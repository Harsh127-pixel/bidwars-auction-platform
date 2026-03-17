// FILE: backend/routes/proposalRoutes.js
const express = require("express")
const router = express.Router()
const { db } = require("../config/firebase")
const { verifyToken } = require("../middleware/authMiddleware")

// Submit proposal
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, description, category, budget } = req.body
    const proposal = {
      userId: req.user.uid,
      title,
      description,
      category,
      budget,
      status: "pending",
      submittedAt: new Date()
    }
    
    const docRef = await db.collection("proposals").add(proposal)
    res.json({ id: docRef.id, ...proposal })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get user's proposals
router.get("/my", verifyToken, async (req, res) => {
  try {
    const proposals = await db.collection("proposals")
      .where("userId", "==", req.user.uid)
      .orderBy("submittedAt", "desc")
      .get()
    
    const proposalList = proposals.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(proposalList)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update proposal (only if pending)
router.put("/:proposalId", verifyToken, async (req, res) => {
  try {
    const { proposalId } = req.params
    const updates = req.body
    
    const proposalDoc = await db.collection("proposals").doc(proposalId).get()
    if (!proposalDoc.exists || proposalDoc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: "Not authorized" })
    }
    
    if (proposalDoc.data().status !== "pending") {
      return res.status(400).json({ error: "Cannot update approved/rejected proposal" })
    }
    
    updates.updatedAt = new Date()
    await db.collection("proposals").doc(proposalId).update(updates)
    res.json({ message: "Proposal updated" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router