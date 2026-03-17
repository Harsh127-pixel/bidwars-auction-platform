// FILE: backend/routes/userRoutes.js
const express = require("express")
const router = express.Router()
const { db, auth } = require("../config/firebase")
const emailService = require("../services/emailService")
const { verifyToken } = require("../middleware/authMiddleware")

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

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: "Email is required" })
    
    // We use firebase-admin to generate the reset link and send it via our email service
    // because firebase-admin doesn't have a direct 'sendPasswordResetEmail' for browser-less environments.
    const link = await auth.generatePasswordResetLink(email)
    
    await emailService.sendMail({
      to: email,
      subject: 'Reset your BidWars password',
      text: `Hello,\n\nYou requested a password reset for your BidWars account. Click the link below to set a new password:\n\n${link}\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #eee;border-radius:10px">
          <h2 style="color:#D4AF37">Reset Password</h2>
          <p>You requested a password reset for your BidWars account.</p>
          <a href="${link}" style="display:inline-block;padding:12px 24px;background:#D4AF37;color:white;text-decoration:none;border-radius:6px;font-weight:bold">Reset Password</a>
          <p style="font-size:12px;color:#888;margin-top:20px">If you did not request this, please ignore this email.</p>
        </div>
      `
    })
    
    res.json({ message: "Reset link sent" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Subscription operations
router.post("/subscription", verifyToken, async (req, res) => {
  try {
    const { plan, amount } = req.body
    await db.collection("subscriptions").add({
      userId: req.user.uid,
      plan,
      amount,
      status: "active",
      createdAt: new Date()
    })
    res.json({ message: "Subscription created" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete("/subscription", verifyToken, async (req, res) => {
  try {
    const subscriptions = await db.collection("subscriptions")
      .where("userId", "==", req.user.uid)
      .where("status", "==", "active")
      .get()
    
    subscriptions.forEach(async (doc) => {
      await doc.ref.update({ status: "cancelled", cancelledAt: new Date() })
    })
    res.json({ message: "Subscription cancelled" })
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

module.exports = router