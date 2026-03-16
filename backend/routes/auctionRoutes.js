const express = require("express")
const admin = require("firebase-admin")
const router = express.Router()
const db = require("../config/firebase")
const { generateListingDescription } = require("../services/aiListing")
const protect = require("../middleware/authMiddleware")
const isAdmin = require("../middleware/adminMiddleware")
const ledgerService = require("../services/ledger")
const reportService = require("../services/ReportService")
const pdfService = require("../services/pdfService")
const emailService = require("../services/emailService")

// ─── HELPER ────────────────────────────────────────────────────────────────
// Firestore throws 500 when you combine .where() on one field with .orderBy()
// on a different field without a composite index. Fix: fetch without orderBy,
// sort in memory. Applied to every affected route below.
const toMs = (ts) => {
  if (!ts) return 0
  if (ts._seconds) return ts._seconds * 1000
  if (ts.seconds) return ts.seconds * 1000
  if (ts.toDate) return ts.toDate().getTime()
  return new Date(ts).getTime()
}

// Public: Fetch all active auctions
router.get("/auctions", async (req, res) => {
  try {
    const snapshot = await db.collection("auctions")
      .where("status", "==", "active")
      .get()
    const auctions = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
    res.json(auctions)
  } catch (err) {
    console.error("GET /auctions:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// Admin Only: Fetch all users
router.get("/admin/users", protect, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("users").get()
    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
    res.json(users)
  } catch (err) {
    console.error("GET /admin/users:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// Admin Only: Verify KYC
router.post("/admin/verifyKYC", protect, isAdmin, async (req, res) => {
  const { uid, status } = req.body
  try {
    await db.collection("users").doc(uid).update({
      isVerified: status === "approved",
      kycStatus: status,
      updatedAt: new Date()
    })
    res.json({ success: true, message: `Identity ${status}` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Protected: Generate AI Description
router.post("/generateDescription", protect, async (req, res) => {
  const { itemName, features } = req.body
  try {
    const description = await generateListingDescription(itemName, features)
    res.json({ description })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin Only: Create Auction
router.post("/auctions", protect, isAdmin, async (req, res) => {
  const { title, description, category, minBid, imageUrl, startTime, endTime } = req.body
  try {
    const auction = await db.collection("auctions").add({
      title,
      description,
      category,
      minBid: parseFloat(minBid),
      highestBid: parseFloat(minBid),
      highestBidder: null,
      buyItNow: req.body.buyItNow ? parseFloat(req.body.buyItNow) : null,
      imageUrl,
      status: "active",
      sellerId: "admin",
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: new Date(endTime),
      createdAt: new Date(),
      bidCount: 0,
      reserveMet: false
    })
    res.json({ id: auction.id })
  } catch (error) {
    console.error("POST /auctions:", error.message)
    res.status(500).json({ error: error.message })
  }
})

// User: Propose Auction
router.post("/auctions/propose", protect, async (req, res) => {
  const { title, description, category, minBid, imageUrl, endTime } = req.body
  if (!req.user.isVerified) {
    return res.status(403).json({ message: "KYC Verification required to list assets." })
  }
  try {
    const auction = await db.collection("auctions").add({
      title, description, category,
      minBid: parseFloat(minBid),
      highestBid: parseFloat(minBid),
      highestBidder: null,
      imageUrl,
      status: "pending_approval",
      sellerId: req.user.uid,
      sellerName: req.user.username,
      endTime: new Date(endTime),
      createdAt: new Date(),
      bidCount: 0
    })
    res.json({ id: auction.id, message: "Listing submitted for review." })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin Only: Update User Credits
router.post("/admin/updateCredits", protect, isAdmin, async (req, res) => {
  const { userId, credits } = req.body
  try {
    const userDoc = await db.collection("users").doc(userId).get()
    const currentCredits = userDoc.exists ? (userDoc.data().credits || 0) : 0
    const adjustment = parseFloat(credits) - currentCredits
    await ledgerService.recordTransaction(userId, adjustment, "ADMIN_TOPUP")
    res.json({ success: true, message: `Credits updated for ${userId}` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Protected: Get Wallet History
router.get("/wallet/history", protect, async (req, res) => {
  try {
    const history = await ledgerService.getHistory(req.user.uid)
    res.json(history)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Protected: Wallet Topup
router.post("/wallet/topup", protect, async (req, res) => {
  const { amount } = req.body
  try {
    const magnitude = parseFloat(amount)
    if (magnitude <= 0) throw new Error("Invalid amount")
    await ledgerService.recordTransaction(req.user.uid, magnitude, "WALLET_TOPUP")
    res.json({ success: true, message: "Top-up successful" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin Only: Close Auction
router.post("/admin/closeAuction", protect, isAdmin, async (req, res) => {
  const { auctionId } = req.body
  try {
    const auctionRef = db.collection("auctions").doc(auctionId)
    const auctionDoc = await auctionRef.get()
    if (!auctionDoc.exists) throw new Error("Auction not found")
    const auctionData = auctionDoc.data()

    if (auctionData.highestBidder) {
      const winnerRef = db.collection("users").doc(auctionData.highestBidder)
      await db.runTransaction(async (t) => {
        const winnerDoc = await t.get(winnerRef)
        if (!winnerDoc.exists) return
        const winnerData = winnerDoc.data()
        const finalPrice = auctionData.highestBid
        t.update(winnerRef, {
          heldCredits: admin.firestore.FieldValue.increment(-finalPrice),
          totalWins: admin.firestore.FieldValue.increment(1)
        })
        ledgerService.logTransaction(t, auctionData.highestBidder, 0, "BID_WIN_FINAL",
          winnerData.credits, winnerData.credits, auctionId)
      })
    }

    await auctionRef.update({
      status: "closed",
      endTime: new Date(),
      escrowStatus: auctionData.sellerId === "admin" ? "released" : "held"
    })

    const io = req.app.get("io")
    io.emit("biddingStopped", {
      auctionId,
      status: "closed",
      winner: auctionData.highestBidder,
      escrowStatus: auctionData.sellerId === "admin" ? "released" : "held"
    })
    res.json({ success: true, winner: auctionData.highestBidder || "None" })
  } catch (error) {
    console.error("POST /admin/closeAuction:", error.message)
    res.status(500).json({ error: error.message })
  }
})

// Protected: Buy It Now
router.post("/auctions/buy-it-now/:id", protect, async (req, res) => {
  const auctionId = req.params.id
  const userId = req.user.uid
  try {
    const auctionRef = db.collection("auctions").doc(auctionId)
    const userRef = db.collection("users").doc(userId)
    await db.runTransaction(async (t) => {
      const auctionDoc = await t.get(auctionRef)
      const userDoc = await t.get(userRef)
      if (!auctionDoc.exists) throw new Error("Auction not found")
      if (!userDoc.exists) throw new Error("User not found")
      const auctionData = auctionDoc.data()
      const userData = userDoc.data()
      if (auctionData.status !== "active") throw new Error("Auction is not active")
      if (auctionData.bidCount > 0) throw new Error("Buy It Now only available before first bid")
      if (!auctionData.buyItNow) throw new Error("Buy It Now not available for this item")
      const price = auctionData.buyItNow
      if (userData.credits < price) throw new Error("Insufficient credits")
      t.update(userRef, {
        credits: admin.firestore.FieldValue.increment(-price),
        totalWins: admin.firestore.FieldValue.increment(1)
      })
      t.update(auctionRef, {
        status: "closed",
        highestBid: price,
        highestBidder: userId,
        endTime: new Date(),
        buyItNowUsed: true,
        escrowStatus: auctionData.sellerId === "admin" ? "released" : "held"
      })
      ledgerService.logTransaction(t, userId, -price, "BUY_IT_NOW",
        userData.credits, userData.credits - price, auctionId)
    })
    const io = req.app.get("io")
    io.emit("biddingStopped", { auctionId, status: "closed", winner: userId })
    res.json({ success: true, message: "Purchase successful" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Admin Only: Update Auction
router.put("/auctions/:id", protect, isAdmin, async (req, res) => {
  const { title, description, category, minBid, imageUrl, endTime, buyItNow } = req.body
  const auctionId = req.params.id
  try {
    const auctionRef = db.collection("auctions").doc(auctionId)
    const auctionDoc = await auctionRef.get()
    if (!auctionDoc.exists) throw new Error("Auction not found")
    const auctionData = auctionDoc.data()
    const updateData = { title, description, category, imageUrl, endTime: new Date(endTime), updatedAt: new Date() }
    if ((auctionData.bidCount || 0) === 0) {
      if (minBid !== undefined) { updateData.minBid = parseFloat(minBid); updateData.highestBid = parseFloat(minBid) }
      if (buyItNow !== undefined) updateData.buyItNow = buyItNow ? parseFloat(buyItNow) : null
    }
    await auctionRef.update(updateData)
    res.json({ success: true, message: "Auction updated" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin Only: Delete Auction
router.delete("/auctions/:id", protect, isAdmin, async (req, res) => {
  try {
    await db.collection("auctions").doc(req.params.id).delete()
    const io = req.app.get("io")
    io.emit("biddingStopped", { auctionId: req.params.id, status: "deleted" })
    res.json({ success: true, message: "Auction deleted" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin Only: Get Flagged Auctions
router.get("/admin/flagged", protect, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("auctions").where("flagged", "==", true).get()
    const flagged = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(flagged)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Protected: Create Dispute
router.post("/disputes", protect, async (req, res) => {
  const { auctionId, reason } = req.body
  try {
    const dispute = {
      auctionId, reason,
      initiatorId: req.user.uid,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const docRef = await db.collection("disputes").add(dispute)
    res.json({ id: docRef.id, ...dispute })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin Only: Get All Disputes — FIX: removed .orderBy to avoid missing index
router.get("/admin/disputes", protect, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("disputes").get()  // no orderBy — sort in memory
    const disputes = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
    res.json(disputes)
  } catch (err) {
    console.error("GET /admin/disputes:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// Admin Only: Resolve Dispute
router.post("/admin/disputes/:id/resolve", protect, isAdmin, async (req, res) => {
  const { status, resolution } = req.body
  try {
    const disputeRef = db.collection("disputes").doc(req.params.id)
    const disputeDoc = await disputeRef.get()
    if (!disputeDoc.exists) throw new Error("Dispute not found")
    const data = disputeDoc.data()
    const auctionRef = db.collection("auctions").doc(data.auctionId)
    const auctionDoc = await auctionRef.get()
    const auctionData = auctionDoc.data()

    if (resolution === "Refund Issued" && auctionData.highestBidder) {
      const userRef = db.collection("users").doc(auctionData.highestBidder)
      const sellerRef = db.collection("users").doc(auctionData.sellerId)
      await db.runTransaction(async (t) => {
        const userDoc = await t.get(userRef)
        const currentCredits = userDoc.data().credits || 0
        t.update(userRef, { credits: admin.firestore.FieldValue.increment(auctionData.highestBid) })
        ledgerService.logTransaction(t, auctionData.highestBidder, auctionData.highestBid,
          "DISPUTE_REFUND", currentCredits, currentCredits + auctionData.highestBid, data.auctionId)
        if (auctionData.sellerId !== "admin") {
          t.update(sellerRef, { reputation: admin.firestore.FieldValue.increment(-5) })
        }
      })
    }
    await disputeRef.update({ status, resolution, updatedAt: new Date() })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin Only: Get Pending Auctions — FIX: removed .orderBy to avoid missing index
router.get("/admin/pendingAuctions", protect, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("auctions")
      .where("status", "==", "pending_approval")
      .get()  // no .orderBy — sort in memory below
    const pending = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
    res.json(pending)
  } catch (err) {
    console.error("GET /admin/pendingAuctions:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// Admin Only: Approve/Reject Auction
router.post("/admin/reviewAuction", protect, isAdmin, async (req, res) => {
  const { auctionId, approved } = req.body
  try {
    const status = approved ? "active" : "rejected"
    await db.collection("auctions").doc(auctionId).update({
      status,
      startTime: approved ? new Date() : null,
      updatedAt: new Date()
    })
    res.json({ success: true, status })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin Only: Get Analytics
router.get("/admin/analytics", protect, isAdmin, async (req, res) => {
  try {
    const stats = await reportService.getPlatformSummary()
    res.json(stats)
  } catch (err) {
    console.error("GET /admin/analytics:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// Protected: Confirm Receipt (Release Escrow)
router.post("/auctions/:id/confirm-receipt", protect, async (req, res) => {
  const auctionId = req.params.id
  const userId = req.user.uid
  try {
    const auctionRef = db.collection("auctions").doc(auctionId)
    const auctionDoc = await auctionRef.get()
    if (!auctionDoc.exists) throw new Error("Auction not found")
    const auctionData = auctionDoc.data()
    if (auctionData.highestBidder !== userId) throw new Error("Only the winning bidder can confirm receipt")
    if (auctionData.escrowStatus !== "held") throw new Error("Funds already released or not in escrow")
    if (auctionData.status !== "closed") throw new Error("Auction must be closed to release funds")

    const finalPrice = auctionData.highestBid
    const sellerId = auctionData.sellerId

    await db.runTransaction(async (t) => {
      const winnerRef = db.collection("users").doc(userId)
      const winnerDoc = await t.get(winnerRef)
      const winnerData = winnerDoc.data()
      t.update(winnerRef, { heldCredits: admin.firestore.FieldValue.increment(-finalPrice) })

      if (sellerId && sellerId !== "admin") {
        const sellerRef = db.collection("users").doc(sellerId)
        const sellerDoc = await t.get(sellerRef)
        const sellerData = sellerDoc.data()
        const tier = sellerData.membershipTier || "Bronze"
        const rate = tier === "Gold" ? 0.01 : (tier === "Silver" ? 0.03 : 0.05)
        const payout = finalPrice - Math.floor(finalPrice * rate)
        t.update(sellerRef, { credits: admin.firestore.FieldValue.increment(payout) })
        ledgerService.logTransaction(t, sellerId, payout, "ESCROW_PAYOUT",
          sellerData.credits, sellerData.credits + payout, auctionId)
      }
      t.update(auctionRef, { escrowStatus: "released", updatedAt: new Date() })
    })

    // Background: Generate and email certificate
    pdfService.generateCertificate(auctionDoc.data(),
      (await db.collection("users").doc(userId).get()).data())
      .then(pdf => emailService.sendCertificate(req.user.email, auctionDoc.data().title, pdf))
      .catch(err => console.error("Certificate email error:", err))

    res.json({ success: true, message: "Escrow released." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Protected: Toggle Watchlist
router.post("/watchlist/toggle/:id", protect, async (req, res) => {
  const auctionId = req.params.id
  const userId = req.user.uid
  try {
    const watchRef = db.collection("watchlist").doc(`${userId}_${auctionId}`)
    const doc = await watchRef.get()
    if (doc.exists) {
      await watchRef.delete()
      res.json({ watched: false })
    } else {
      await watchRef.set({ userId, auctionId, createdAt: new Date() })
      res.json({ watched: true })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Protected: Get Watchlist
router.get("/watchlist", protect, async (req, res) => {
  try {
    const snapshot = await db.collection("watchlist")
      .where("userId", "==", req.user.uid)
      .get()
    const auctionIds = snapshot.docs.map(doc => doc.data().auctionId)
    if (auctionIds.length === 0) return res.json([])
    const auctionsSnapshot = await db.collection("auctions")
      .where(admin.firestore.FieldPath.documentId(), "in", auctionIds)
      .get()
    const watchlist = auctionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(watchlist)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Public: Get Bid History
router.get("/auctions/:id/bids", async (req, res) => {
  try {
    const snapshot = await db.collection("bids")
      .where("auctionId", "==", req.params.id)
      .get()
    const bids = snapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => toMs(a.timestamp) - toMs(b.timestamp))
    res.json(bids)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Protected: Download Certificate
router.get("/auctions/:id/certificate", protect, async (req, res) => {
  try {
    const auctionDoc = await db.collection("auctions").doc(req.params.id).get()
    if (!auctionDoc.exists) return res.status(404).json({ error: "Auction not found" })
    const auctionData = auctionDoc.data()
    if (auctionData.highestBidder !== req.user.uid) return res.status(403).json({ error: "Unauthorized" })
    const userDoc = await db.collection("users").doc(req.user.uid).get()
    const pdfBuffer = await pdfService.generateCertificate(auctionData, userDoc.data())
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename=Certificate_${req.params.id}.pdf`)
    res.send(pdfBuffer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Protected: Get Notifications — FIX: removed .orderBy to avoid missing index
router.get("/notifications", protect, async (req, res) => {
  try {
    const snapshot = await db.collection("notifications")
      .where("userId", "==", req.user.uid)
      .get()  // no .orderBy — sort in memory
    const notifications = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
      .slice(0, 20)
    res.json(notifications)
  } catch (err) {
    console.error("GET /notifications:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// Protected: Mark Notification Read
router.post("/notifications/:id/read", protect, async (req, res) => {
  try {
    await db.collection("notifications").doc(req.params.id).update({ read: true })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin Only: Get User Audit — FIX: removed .orderBy to avoid missing index
router.get("/admin/users/:uid/audit", protect, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("transactions")
      .where("userId", "==", req.params.uid)
      .get()  // no .orderBy — sort in memory
    const audit = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
      .slice(0, 50)
    res.json(audit)
  } catch (err) {
    console.error("GET /admin/users/:uid/audit:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// Public: Leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const snapshot = await db.collection("users")
      .orderBy("credits", "desc")
      .limit(5)
      .get()
    const whales = snapshot.docs.map(doc => ({
      username: doc.data().username,
      tier: doc.data().membershipTier || "Bronze"
    }))
    res.json(whales)
  } catch (err) {
    // leaderboard failing shouldn't break the app — return empty
    console.error("GET /leaderboard:", err.message)
    res.json([])
  }
})

// Public: AI Market Sentiment
router.get("/auctions/:id/sentiment", async (req, res) => {
  try {
    const auctionDoc = await db.collection("auctions").doc(req.params.id).get()
    const auctionData = auctionDoc.data()
    const bidSnapshot = await db.collection("bids")
      .where("auctionId", "==", req.params.id)
      .get()
    const prompt = `As an expert auction analyst, predict the final hammer price for this item:
      Title: ${auctionData.title}
      Starting Price: ₹${auctionData.minBid}
      Current Highest Bid: ₹${auctionData.highestBid || auctionData.minBid}
      Total Bids so far: ${bidSnapshot.size}
      Category: ${auctionData.category}
      Respond in strictly JSON format: { "predictedPrice": number, "confidence": number (0-1), "analysis": "short 1 sentence string" }`
    const response = await generateListingDescription(prompt)
    const clean = response.replace(/```json\n?/g, "").replace(/```/g, "").trim()
    let parsed
    try { parsed = JSON.parse(clean) } catch {
      const currentBid = auctionData.highestBid || auctionData.minBid
      parsed = { predictedPrice: Math.round(currentBid * 1.25), confidence: 0.62, analysis: "Market shows moderate interest based on current bid activity." }
    }
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: "AI Sentiment analysis unavailable" })
  }
})

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

module.exports = router