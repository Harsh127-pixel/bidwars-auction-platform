const express = require("express")
const router = express.Router()
const { db, admin } = require("../config/firebase")
const { verifyToken } = require("../middleware/authMiddleware")
const ledgerService = require("../services/ledger")
const pdfService = require("../services/pdfService")
const emailService = require("../services/emailService")

const toMs = (ts) => {
  if (!ts) return 0
  if (ts._seconds) return ts._seconds * 1000
  if (ts.seconds) return ts.seconds * 1000
  if (ts.toDate) return ts.toDate().getTime()
  return new Date(ts).getTime() || 0
}

// Simulate Razorpay for testing
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_1234567890"

// Create payment order
router.post("/create-order", verifyToken, async (req, res) => {
  try {
    const amount = Number(req.body.amount); // Ensure numeric
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
    const { currency = "INR" } = req.body;
    
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
      const amount = Number(orderData.amount) / 100 // Convert back from paisa, ensure numeric
      
      const { newBalance } = await ledgerService.recordTransaction(req.user.uid, amount, "WALLET_TOPUP")
      
      // Background: Generate and send invoice
      const userDoc = await db.collection("users").doc(req.user.uid).get()
      const userData = userDoc.data()
      
      pdfService.generateInvoice({
        invoiceId: orderId.toUpperCase(),
        description: `Wallet Topup - ${orderId}`,
        amount: amount
      }, userData).then(pdf => {
        emailService.sendInvoice(req.user.email, `Wallet Topup`, amount, pdf)
      }).catch(err => console.error("Invoice generation error:", err))

      emailService.sendWalletTopupAlert(req.user.email, {
        username: userData.username,
        amount: amount,
        newBalance: newBalance,
        transactionId: orderId
      }).catch(err => console.error("Topup alert email error:", err))

      res.json({ message: "Payment verified and wallet updated", balance: newBalance })
    } else {
      res.status(400).json({ error: "Invalid payment signature" })
    }
  } catch (error) {
    console.error("Payment Verification Error:", error.message)
    res.status(500).json({ error: error.message })
  }
})

// Get payment history
router.get("/history", verifyToken, async (req, res) => {
  try {
    const payments = await db.collection("orders")
      .where("userId", "==", req.user.uid)
      .get()
    
    const history = payments.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
    res.json(history)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all transactions (Admin/Staff only)
const { verifyStaff, checkPermission } = require("../middleware/authMiddleware")
router.get("/admin/transactions", verifyToken, verifyStaff, checkPermission("view_audit"), async (req, res) => {
  try {
    const history = await ledgerService.getAllTransactions()
    res.json(history)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router