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

// User: Get single ticket details with replies
router.get("/tickets/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const doc = await db.collection("support_tickets").doc(id).get()
    if (!doc.exists) return res.status(404).json({ error: "Ticket not found" })
    
    const ticket = doc.data()
    if (ticket.userId !== req.user.uid && req.user.role !== 'admin' && req.user.role !== 'employee') {
      return res.status(403).json({ error: "Forbidden" })
    }

    const repliesSnap = await db.collection("support_tickets").doc(id)
      .collection("replies")
      .orderBy("createdAt", "asc")
      .get()
    
    const replies = repliesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json({ id: doc.id, ...ticket, replies })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// User/Admin: Reply to ticket
router.post("/tickets/:id/reply", verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const { message } = req.body
    if (!message) return res.status(400).json({ error: "Message is required" })

    const ticketRef = db.collection("support_tickets").doc(id)
    const ticketDoc = await ticketRef.get()
    if (!ticketDoc.exists) return res.status(404).json({ error: "Ticket not found" })

    const ticket = ticketDoc.data()
    const isAdminReply = req.user.role === 'admin' || req.user.role === 'employee'
    
    if (!isAdminReply && ticket.userId !== req.user.uid) {
      return res.status(403).json({ error: "Forbidden" })
    }

    const reply = {
      userId: req.user.uid,
      username: req.user.username || req.user.email,
      message,
      isAdminReply,
      createdAt: new Date()
    }

    await ticketRef.collection("replies").add(reply)
    await ticketRef.update({ 
      updatedAt: new Date(),
      status: isAdminReply ? "replied" : "open" 
    })

    // Notify user if it's an admin reply
    if (isAdminReply) {
      await db.collection("notifications").add({
        userId: ticket.userId,
        type: 'TICKET_REPLY',
        message: `Support team replied to: "${ticket.subject}"`,
        data: { ticketId: id },
        createdAt: new Date(),
        read: false
      })
    }

    res.json(reply)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin Only: Resolve/Update ticket
router.put("/admin/tickets/:id", verifyToken, async (req, res) => {
  const isAdmin = req.user.role === 'admin' || req.user.role === 'employee'
  if (!isAdmin) return res.status(403).json({ error: "Admin only" })
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

// User: Create dispute
router.post("/disputes", verifyToken, async (req, res) => {
  try {
    const { transactionId, auctionId, reason } = req.body
    if (!transactionId || !reason) {
      return res.status(400).json({ error: "Transaction ID and reason are required" })
    }

    const dispute = {
      userId: req.user.uid,
      username: req.user.username || req.user.email,
      transactionId,
      auctionId: auctionId || null,
      reason,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const docRef = await db.collection("disputes").add(dispute)
    
    // Also update transaction status
    try {
      await db.collection("transactions").doc(transactionId).update({
        disputed: true,
        disputeId: docRef.id
      })
    } catch (err) {
      console.warn("Could not link dispute to transaction:", err.message)
    }

    res.json({ id: docRef.id, ...dispute })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
