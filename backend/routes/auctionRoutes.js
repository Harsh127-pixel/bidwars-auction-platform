const express = require("express")
const admin = require("firebase-admin")
const router = express.Router()
const db = require("../config/firebase")
const { generateListingDescription } = require("../services/aiListing")
const protect = require("../middleware/authMiddleware")
const isAdmin = require("../middleware/adminMiddleware")
const ledgerService = require("../services/ledger")

// Public: Fetch all auctions
router.get("/auctions", async (req,res)=>{
  try {
    const snapshot = await db.collection("auctions").get()
    const auctions = snapshot.docs.map(doc=>({
      id:doc.id,
      ...doc.data()
    }))
    res.json(auctions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin Only: Fetch all users
router.get("/admin/users", protect, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("users").get()
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }))
    res.json(users)
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
router.post("/auctions", protect, isAdmin, async (req,res)=>{
  const { title, description, category, minBid, imageUrl, startTime, endTime } = req.body

  try {
    const auction = await db.collection("auctions").add({
      title,
      description,
      category,
      minBid: parseFloat(minBid),
      highestBid: parseFloat(minBid),
      highestBidder: null,
      imageUrl,
      status: "active",
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: new Date(endTime),
      createdAt: new Date()
    })

    res.json({ id: auction.id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin Only: Update User Credits (Manual Allocation)
router.post("/admin/updateCredits", protect, isAdmin, async (req, res) => {
  const { userId, credits } = req.body
  try {
    const userDoc = await db.collection("users").doc(userId).get()
    const currentCredits = userDoc.exists ? (userDoc.data().credits || 0) : 0
    const adjustment = parseFloat(credits) - currentCredits
    
    await ledgerService.recordTransaction(userId, adjustment, 'ADMIN_TOPUP')
    
    res.json({ success: true, message: `Wealth allocation successful for ${userId}` })
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

// Protected: Simulate Wallet Topup
router.post("/wallet/topup", protect, async (req, res) => {
  const { amount } = req.body
  try {
    const magnitude = parseFloat(amount)
    if (magnitude <= 0) throw new Error("Invalid magnitude")
    
    await ledgerService.recordTransaction(req.user.uid, magnitude, 'WALLET_TOPUP')
    res.json({ success: true, message: "Settlement successful" })
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
    
    if (!auctionDoc.exists) throw new Error("Auction room not found")
    
    const auctionData = auctionDoc.data()
    
    // Finalize winner's credits via Ledger
    if (auctionData.highestBidder) {
      const winnerRef = db.collection("users").doc(auctionData.highestBidder)
      
      await db.runTransaction(async (t) => {
        const winnerDoc = await t.get(winnerRef)
        const winnerData = winnerDoc.data()
        
        const finalPrice = auctionData.highestBid
        const newHeld = Math.max(0, (winnerData.heldCredits || 0) - finalPrice)
        
        t.update(winnerRef, {
          heldCredits: newHeld,
          totalWins: admin.firestore.FieldValue.increment(1)
        })

        // Log the final settlement in the ledger
        ledgerService.logTransaction(t, auctionData.highestBidder, 0, 'BID_WIN_FINAL', winnerData.credits, winnerData.credits, auctionId);
      })
    }

    await auctionRef.update({ status: "closed", endTime: new Date() })
    
    // Notify all clients that bidding has stopped for this auction
    const io = req.app.get('io')
    io.emit('biddingStopped', { 
      auctionId, 
      status: 'closed', 
      winner: auctionData.highestBidder 
    })

    res.json({ success: true, winner: auctionData.highestBidder || 'None' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin Only: Delete Auction
router.delete("/auctions/:id", protect, isAdmin, async (req, res) => {
  try {
    const auctionId = req.params.id
    await db.collection("auctions").doc(auctionId).delete()
    
    // Notify all clients
    const io = req.app.get('io')
    io.emit('biddingStopped', { auctionId, status: 'deleted' })

    res.json({ success: true, message: "Asset liquidated" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
