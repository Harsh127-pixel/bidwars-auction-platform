// FILE: backend/routes/paymentRoutes.js
const express = require("express")
const router = express.Router()
const db = require("../config/firebase")
const { verifyToken } = require("../middleware/authMiddleware")

// Simulate Razorpay for testing
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_1234567890"
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "test_secret"

// Create payment order
router.post("/create-order", verifyToken, async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body
    
    // Simulate Razorpay order creation
    const orderId = `order_${Date.now()}`
    const order = {
      id: orderId,
      amount: amount * 100, // Razorpay expects amount in paisa
      currency,
      status: "created"
    }
    
    // Store order in database
    await db.collection("orders").doc(orderId).set({
      userId: req.user.uid,
      ...order,
      createdAt: new Date()
    })
    
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: RAZORPAY_KEY_ID
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Verify payment
router.post("/verify", verifyToken, async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body
    
    // In production, verify signature with Razorpay
    // For testing, simulate success
    const isValid = true // Simulate verification
    
    if (isValid) {
      // Update order status
      await db.collection("orders").doc(orderId).update({
        paymentId,
        signature,
        status: "paid",
        paidAt: new Date()
      })
      
      // Add amount to user wallet
      const orderDoc = await db.collection("orders").doc(orderId).get()
      const orderData = orderDoc.data()
      const amount = orderData.amount / 100 // Convert back from paisa
      
      await db.collection("wallets").doc(req.user.uid).update({
        balance: admin.firestore.FieldValue.increment(amount),
        lastTransaction: new Date()
      })
      
      res.json({ message: "Payment verified and wallet updated" })
    } else {
      res.status(400).json({ error: "Invalid payment signature" })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get payment history
router.get("/history", verifyToken, async (req, res) => {
  try {
    const payments = await db.collection("orders")
      .where("userId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get()
    
    const history = payments.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(history)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router