// FILE: backend/routes/supportRoutes.js
const express = require("express")
const router = express.Router()
const { db } = require("../config/firebase")
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware")

// User: Create support ticket
router.post("/tickets", verifyToken, async (req, res) => {
  try {
    const { subject, message } = req.body
    if (!subject || !message) {
      return res.status(400).json({ error: "Subject and message are required" })
    }

    const ticket = {
      userId: req.user.uid,
      username: req.user.username || req.user.email,
      subject,
      message,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const docRef = await db.collection("support_tickets").add(ticket)
    res.json({ id: docRef.id, ...ticket })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// User: Get my tickets
router.get("/tickets", verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection("support_tickets")
      .where("userId", "==", req.user.uid)
      .get()
    
    const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(tickets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin Only: Get all tickets
router.get("/admin/tickets", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("support_tickets").get()
    const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(tickets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin Only: Resolve/Update ticket
router.put("/admin/tickets/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status, resolution } = req.body
    
    await db.collection("support_tickets").doc(id).update({
      status,
      resolution,
      resolvedBy: req.user.uid,
      updatedAt: new Date()
    })
    
    // Notify user
    const ticketDoc = await db.collection("support_tickets").doc(id).get()
    const ticketData = ticketDoc.data()
    
    await db.collection("notifications").add({
      userId: ticketData.userId,
      type: 'TICKET_RESOLVED',
      message: `Your support ticket regarding "${ticketData.subject}" has been marked as ${status}. Resolution: ${resolution}`,
      createdAt: new Date(),
      read: false
    })

    res.json({ message: "Ticket updated" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
