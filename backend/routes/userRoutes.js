// FILE: backend/routes/userRoutes.js
const express = require("express")
const router = express.Router()
const db = require("../config/firebase")
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
router.post("/kyc/initiate", verifyToken, async (req, res) => {
  try {
    await db.collection("users").doc(req.user.uid).update({
      kycStatus: "pending",
      kycInitiatedAt: new Date()
    })
    res.json({ message: "KYC initiated" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post("/kyc/cancel", verifyToken, async (req, res) => {
  try {
    await db.collection("users").doc(req.user.uid).update({
      kycStatus: "cancelled",
      kycCancelledAt: new Date()
    })
    res.json({ message: "KYC cancelled" })
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

module.exports = router