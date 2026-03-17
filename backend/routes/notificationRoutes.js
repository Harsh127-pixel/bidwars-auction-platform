const express = require("express")
const router = express.Router()
const { db } = require("../config/firebase")
const { verifyToken, verifyStaff, checkPermission } = require("../middleware/authMiddleware")
const notificationService = require("../services/notificationService")

// Get my notifications
router.get("/", verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection("notifications")
      .where("userId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get()
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all notifications (Admin/Staff)
router.get("/all", verifyToken, verifyStaff, checkPermission("view_audit"), async (req, res) => {
  try {
    const snapshot = await db.collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get()
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark as read
router.put("/read-all", verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection("notifications")
      .where("userId", "==", req.user.uid)
      .where("read", "==", false)
      .get()
    
    const batch = db.batch()
    snapshot.docs.forEach(doc => batch.update(doc.ref, { read: true }))
    await batch.commit()
    
    res.json({ success: true, count: snapshot.size })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Clear all notifications (delete)
router.delete("/clear-all", verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection("notifications")
      .where("userId", "==", req.user.uid)
      .get()
    
    const batch = db.batch()
    snapshot.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
    
    res.json({ success: true, count: snapshot.size })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark individual as read
router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    await db.collection("notifications").doc(id).update({ read: true })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// admin: Delete notification
router.delete("/:id", verifyToken, verifyStaff, checkPermission("manage_settings"), async (req, res) => {
  try {
    const { id } = req.params
    await db.collection("notifications").doc(id).delete()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: Send individual notification
router.post("/send", verifyToken, verifyStaff, checkPermission("manage_users"), async (req, res) => {
  try {
    const { userId, type, message, data } = req.body
    await notificationService.send(userId, type || "ADMIN_MESSAGE", message, data)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: Broadcast
router.post("/broadcast", verifyToken, verifyStaff, checkPermission("manage_settings"), async (req, res) => {
  try {
    const { message, type } = req.body
    await notificationService.broadcast(type || "PLATFORM_UPDATE", message)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
