// FILE: backend/routes/userRoutes.js
const express = require("express")
const router = express.Router()
const { db } = require("../config/firebase")
const { verifyToken } = require("../middleware/authMiddleware")

const normalizeEmail = (value = "") => String(value).trim().toLowerCase()

const adminEmails = new Set(
  [
    ...(process.env.ADMIN_EMAILS || "").split(","),
    process.env.ADMIN_EMAIL || ""
  ]
    .map(normalizeEmail)
    .filter(Boolean)
)

const getRoleForEmail = (email = "") =>
  adminEmails.has(normalizeEmail(email)) ? "admin" : "bidder"

// Ensure a user profile exists and is synced after Firebase login/register
router.post("/session-sync", verifyToken, async (req, res) => {
  try {
    const { username, phone, loginType } = req.body || {} // loginType: 'user' | 'admin'
    const userRef = db.collection("users").doc(req.user.uid)
    let userDoc = await userRef.get()

    // 1. Determine effective role (email-based admin check first, then employees collection)
    let role = getRoleForEmail(req.user.email)
    if (role === 'bidder') {
      const empSnapshot = await db.collection("employees").where("email", "==", req.user.email).limit(1).get()
      if (!empSnapshot.empty) {
        role = 'employee'
      }
    }

    // 2. Login portal separation
    const isStaffRole = (role === 'admin' || role === 'employee')
    if (loginType === 'admin' && !isStaffRole) {
      return res.status(403).json({ error: "Access Denied: Admin/Staff only." })
    }
    if (loginType === 'user' && isStaffRole) {
      return res.status(403).json({ error: "Access Denied: Staff must use admin portal." })
    }

    // 3. Create or update user profile
    if (!userDoc.exists) {
      // Prevent duplicate accounts with same email under a different UID
      const emailSnapshot = await db.collection("users").where("email", "==", req.user.email).limit(1).get()
      if (!emailSnapshot.empty) {
        return res.status(400).json({ error: "Duplicate Account: An account with this email already exists." })
      }

      const now = new Date()
      const profile = {
        uid: req.user.uid,
        username: username || req.user.email?.split("@")[0] || "User",
        email: req.user.email,
        phone: phone || "",
        role,
        credits: 5000,
        heldCredits: 0,
        totalWins: 0,
        isVerified: false,
        kycStatus: null,
        membershipTier: "Bronze",
        createdAt: now,
        updatedAt: now,
        lastActive: now
      }
      await userRef.set(profile)
      userDoc = await userRef.get()
    } else {
      const existing = userDoc.data()
      const updates = {
        role,
        updatedAt: new Date(),
        lastActive: new Date()
      }
      if (username && !existing.username) updates.username = username
      if (phone && !existing.phone) updates.phone = phone
      await userRef.update(updates)
      userDoc = await userRef.get()
    }

    res.json({ user: { uid: req.user.uid, ...userDoc.data() } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post("/ping", verifyToken, async (req, res) => {
  try {
    const { deviceId, fcmToken } = req.body || {}
    const updates = {
      lastActive: new Date(),
      updatedAt: new Date()
    }
    if (deviceId) updates.lastDeviceId = deviceId
    if (fcmToken) updates.fcmToken = fcmToken

    await db.collection("users").doc(req.user.uid).set(updates, { merge: true })
    res.json({ message: "Device activity updated", fcmTokenSaved: !!fcmToken })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put("/preferences", verifyToken, async (req, res) => {
  try {
    const { preferences } = req.body || {}
    if (!preferences || typeof preferences !== "object") {
      return res.status(400).json({ error: "Preferences object is required" })
    }

    const userRef = db.collection("users").doc(req.user.uid)
    const userDoc = await userRef.get()
    const current = userDoc.exists ? (userDoc.data().preferences || {}) : {}
    const mergedPreferences = { ...current, ...preferences }

    await userRef.set({
      preferences: mergedPreferences,
      updatedAt: new Date()
    }, { merge: true })

    res.json({ message: "Preferences updated", preferences: mergedPreferences })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get user profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get()
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" })
    }
    res.json(userDoc.data())
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update user profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { displayName, email, phone, kycStatus } = req.body
    await db.collection("users").doc(req.user.uid).update({
      displayName,
      email,
      phone,
      kycStatus,
      updatedAt: new Date()
    })
    res.json({ message: "Profile updated successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// KYC operations
router.post("/kyc/submit", verifyToken, async (req, res) => {
  try {
    const { idType, idNumber, idUrl, selfieUrl } = req.body
    if (!idType || !idUrl) {
      return res.status(400).json({ error: "ID type and document are required" })
    }

    await db.collection("users").doc(req.user.uid).update({
      kycStatus: "pending",
      kycData: {
        idType,
        idNumber,
        idUrl,
        selfieUrl,
        submittedAt: new Date()
      },
      updatedAt: new Date()
    })
    res.json({ message: "KYC documents submitted for review" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Membership Pricing Mapping
const SUB_PRICES = {
  Silver: { monthly: 149, "half-yearly": 799, yearly: 1399 },
  Gold: { monthly: 499, "half-yearly": 2699, yearly: 4499 }
}

// Subscription operations
router.post("/subscription", verifyToken, async (req, res) => {
  try {
    let { tier, duration, plan, amount: providedAmount } = req.body // compatibility for both old/new schemas
    
    // Map frontend 'plan' (monthly/yearly) to duration
    if (plan) duration = plan
    if (!tier) tier = (duration === 'yearly' ? 'Gold' : 'Silver')
    
    if (!SUB_PRICES[tier] || !SUB_PRICES[tier][duration]) {
      return res.status(400).json({ error: "Invalid membership tier or duration" })
    }

    const amount = providedAmount || SUB_PRICES[tier][duration]
    const userRef = db.collection("users").doc(req.user.uid)
    const isWalletPayment = req.body.paymentMethod === 'wallet'

    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef)
      if (!userDoc.exists) throw new Error("User not found")
      
      const userData = userDoc.data()
      const currentCredits = userData.credits || 0
      
      if (isWalletPayment && currentCredits < amount) {
        throw new Error(`Insufficient wallet balance. You need ₹${amount} but have ₹${currentCredits}`)
      }

      // Calculate Expiry
      const expiry = new Date()
      if (duration === 'monthly') expiry.setMonth(expiry.getMonth() + 1)
      else if (duration === 'half-yearly') expiry.setMonth(expiry.getMonth() + 6)
      else if (duration === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1)

      // 1. Cancel any existing active subscriptions
      const existingSubs = await t.get(
        db.collection("subscriptions")
          .where("userId", "==", req.user.uid)
          .where("status", "==", "active")
      )
      existingSubs.forEach(doc => {
        t.update(doc.ref, { status: "replaced", replacedAt: new Date() })
      })

      const subRef = db.collection("subscriptions").doc()
      t.set(subRef, {
        userId: req.user.uid,
        tier,
        duration,
        amount,
        paymentMethod: req.body.paymentMethod || 'simulated',
        status: "active",
        expiryDate: expiry,
        createdAt: new Date()
      })

      // Log Transaction if wallet used
      if (isWalletPayment) {
        const ledgerRef = db.collection("transactions").doc()
        t.set(ledgerRef, {
          userId: req.user.uid,
          amount: -amount,
          type: "MEMBERSHIP_PURCHASE",
          prevBalance: currentCredits,
          newBalance: currentCredits - amount,
          tier,
          duration,
          status: "COMPLETED",
          createdAt: new Date()
        })
      }

      const userUpdate = {
        subscriptionStatus: "active",
        subscriptionPlan: duration,
        membershipTier: tier,
        membershipExpiry: expiry,
        updatedAt: new Date()
      }
      if (isWalletPayment) {
        userUpdate.credits = currentCredits - amount
      }

      t.update(userRef, userUpdate)
    })

    res.json({ success: true, message: `${tier} ${duration} membership activated!` })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.delete("/subscription", verifyToken, async (req, res) => {
  try {
    const subscriptions = await db.collection("subscriptions")
      .where("userId", "==", req.user.uid)
      .where("status", "==", "active")
      .get()

    const updates = []
    subscriptions.forEach((doc) => {
      updates.push(doc.ref.update({ status: "cancelled", cancelledAt: new Date() }))
    })

    // Also update the user document
    updates.push(db.collection("users").doc(req.user.uid).update({
      subscriptionStatus: "inactive",
      membershipTier: "Bronze",
      subscriptionPlan: null,
      membershipExpiry: null,
      updatedAt: new Date()
    }))

    await Promise.all(updates)
    res.json({ message: "Subscription cancelled successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get user orders
router.get("/orders", verifyToken, async (req, res) => {
  try {
    const orders = await db.collection("fulfillment_orders")
      .where("winnerId", "==", req.user.uid)
      .get()
    const orderList = orders.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(orderList)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark order delivered
router.put("/orders/:orderId/delivered", verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params
    const orderRef = db.collection("fulfillment_orders").doc(orderId)
    const orderDoc = await orderRef.get()

    if (!orderDoc.exists) return res.status(404).json({ error: "Order not found" })
    if (orderDoc.data().winnerId !== req.user.uid) return res.status(403).json({ error: "Unauthorized" })

    await orderRef.update({
      status: 'delivered',
      deliveredAt: new Date(),
      updatedAt: new Date()
    })

    res.json({ message: "Order marked as delivered" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get auctions user participated in
router.get("/my/auctions", verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection("auctions")
      .where("participants", "array-contains", req.user.uid)
      .get()
    const auctions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(auctions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
