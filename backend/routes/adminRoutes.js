// FILE: backend/routes/adminRoutes.js
const express = require("express")
const router = express.Router()
const db = require("../config/firebase")
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware")

// Get all users
router.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await db.collection("users").get()
    const userList = users.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(userList)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Block/Unblock user
router.put("/users/:userId/status", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { status } = req.body // 'active' or 'blocked'
    await db.collection("users").doc(userId).update({
      status,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: req.user.uid
    })
    res.json({ message: `User ${status}` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all proposals
router.get("/proposals", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const proposals = await db.collection("proposals").get()
    const proposalList = proposals.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(proposalList)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Approve/Reject proposal
router.put("/proposals/:proposalId", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { proposalId } = req.params
    const { status, adminNotes } = req.body // 'approved' or 'rejected'
    await db.collection("proposals").doc(proposalId).update({
      status,
      adminNotes,
      reviewedAt: new Date(),
      reviewedBy: req.user.uid
    })
    res.json({ message: `Proposal ${status}` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Edit live auction
router.put("/auctions/:auctionId", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { auctionId } = req.params
    const updates = req.body
    updates.updatedAt = new Date()
    updates.updatedBy = req.user.uid
    
    await db.collection("auctions").doc(auctionId).update(updates)
    res.json({ message: "Auction updated" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router