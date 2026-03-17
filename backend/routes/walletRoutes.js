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

module.exports = router
