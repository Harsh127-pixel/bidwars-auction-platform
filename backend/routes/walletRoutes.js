// FILE: backend/routes/walletRoutes.js
const express = require("express")
const router = express.Router()
const ledgerService = require("../services/ledger")
const { verifyToken } = require("../middleware/authMiddleware")

// Get transaction history
router.get("/history", verifyToken, async (req, res) => {
  try {
    const history = await ledgerService.getHistory(req.user.uid)
    res.json(history)
  } catch (error) {
    console.error("Wallet History Error:", error.message)
    res.status(500).json({ error: error.message })
  }
})

// Request withdrawal
router.post("/withdraw", verifyToken, async (req, res) => {
  try {
    const { amount, method, details } = req.body // method: 'bank' | 'upi'
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" })
    if (!method || !details) return res.status(400).json({ error: "Method and details are required" })

    const charge = amount * 0.01
    const totalDeduction = amount + charge

    // Atomic deduction from user credits
    await ledgerService.recordTransaction(req.user.uid, -totalDeduction, 'WITHDRAWAL_REQUEST')

    // Record the withdrawal request
    const { db } = require("../config/firebase")
    await db.collection("withdrawals").add({
      userId: req.user.uid,
      amount,
      charge,
      totalDeduction,
      method,
      details,
      status: "pending",
      createdAt: new Date()
    })

    // Send Withdrawal Email Alert
    const userDoc = await db.collection("users").doc(req.user.uid).get()
    const userData = userDoc.data()
    if (userData && userData.email) {
      const emailService = require("../services/emailService")
      emailService.sendWithdrawalAlert(userData.email, {
        username: userData.username,
        amount: amount,
        method: method,
        details: String(details.accountNo || details.upiId || details),
        totalDeduction: totalDeduction
      }).catch(err => console.error("Withdrawal alert email error:", err))
    }

    res.json({ message: "Withdrawal request submitted", totalDeduction })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
