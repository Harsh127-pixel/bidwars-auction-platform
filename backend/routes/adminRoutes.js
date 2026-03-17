// FILE: backend/routes/adminRoutes.js
const express = require("express")
const router = express.Router()
const { db } = require("../config/firebase")
const { verifyToken, verifyAdmin, verifyStaff, checkPermission } = require("../middleware/authMiddleware")

// Get all users
router.get("/users", verifyToken, verifyStaff, checkPermission("view_users"), async (req, res) => {
  try {
    const users = await db.collection("users").get()
    const userList = users.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(userList)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Block/Unblock user
router.put("/users/:userId/status", verifyToken, verifyStaff, checkPermission("manage_users"), async (req, res) => {
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
router.get("/proposals", verifyToken, verifyStaff, checkPermission("view_proposals"), async (req, res) => {
  try {
    const proposals = await db.collection("proposals").get()
    const proposalList = proposals.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(proposalList)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Approve/Reject proposal
router.put("/proposals/:proposalId", verifyToken, verifyStaff, checkPermission("manage_proposals"), async (req, res) => {
  try {
    const { proposalId } = req.params
    const { status, adminNotes } = req.body // 'approved' or 'rejected'
    
    await db.runTransaction(async (transaction) => {
      const proposalRef = db.collection("proposals").doc(proposalId)
      const proposalDoc = await transaction.get(proposalRef)
      
      if (!proposalDoc.exists) throw new Error("Proposal not found")
      
      const proposalData = proposalDoc.data()
      
      transaction.update(proposalRef, {
        status,
        adminNotes,
        reviewedAt: new Date(),
        reviewedBy: req.user.uid
      })
      
      // If it's a listing proposal and approved, create an auction
      if (status === "approved" && proposalData.type === "listing") {
        const auctionRef = db.collection("auctions").doc()
        transaction.set(auctionRef, {
          title: proposalData.title,
          description: proposalData.description,
          category: proposalData.category || "General",
          startingPrice: proposalData.startingPrice || 0,
          currentPrice: proposalData.startingPrice || 0,
          sellerId: proposalData.userId,
          status: "pending", // Start as pending until scheduled
          imageUrl: proposalData.imageUrl || null,
          createdAt: new Date(),
          duration: proposalData.duration || 24 // hours
        })
      }
    })
    
    res.json({ message: `Proposal ${status}` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Forceful KYC cancellation
router.put("/users/:userId/cancel-kyc", verifyToken, verifyStaff, checkPermission("manage_users"), async (req, res) => {
  try {
    const { userId } = req.params
    await db.collection("users").doc(userId).update({
      kycStatus: "rejected",
      kycNote: "Cancelled by Admin",
      updatedAt: new Date()
    })
    res.json({ message: "KYC cancelled by admin" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Forceful Subscription cancellation
router.put("/users/:userId/cancel-subscription", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const subscriptions = await db.collection("subscriptions")
      .where("userId", "==", userId)
      .where("status", "==", "active")
      .get()
    
    if (subscriptions.empty) {
      return res.status(404).json({ error: "No active subscription found" })
    }

    const batch = db.batch()
    subscriptions.forEach(doc => {
      batch.update(doc.ref, {
        status: "cancelled",
        cancelledBy: "admin",
        cancelledAt: new Date()
      })
    })
    
    // Also update user doc to reflect inactive preference if needed
    batch.update(db.collection("users").doc(userId), {
      isSubscribed: false
    })

    await batch.commit()
    res.json({ message: "Subscription cancelled by admin" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Edit live auction
router.put("/auctions/:auctionId", verifyToken, verifyStaff, checkPermission("manage_auctions"), async (req, res) => {
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

// Get all fulfillment orders
router.get("/fulfillment", verifyToken, verifyStaff, checkPermission("view_fulfillment"), async (req, res) => {
  try {
    const orders = await db.collection("fulfillment_orders").get()
    const orderList = orders.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(orderList)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update shipping for an order
router.put("/fulfillment/:orderId/ship", verifyToken, verifyStaff, checkPermission("manage_fulfillment"), async (req, res) => {
  try {
    const { orderId } = req.params
    const { trackingUrl, courierService, shippingAddress } = req.body
    
    const updateData = {
      trackingUrl,
      courierService,
      shippingAddress,
      status: 'shipped',
      updatedAt: new Date()
    }
    
    await db.collection("fulfillment_orders").doc(orderId).update(updateData)
    
    // Notify user
    const orderDoc = await db.collection("fulfillment_orders").doc(orderId).get()
    const orderData = orderDoc.data()
    
    await db.collection("notifications").add({
      userId: orderData.winnerId,
      type: 'ORDER_SHIPPED',
      auctionId: orderData.auctionId,
      message: `Your item "${orderData.auctionTitle}" has been shipped via ${courierService}. Tracking: ${trackingUrl}`,
      createdAt: new Date(),
      read: false
    })
    
    res.json({ message: "Order marked as shipped" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// System Settings (Razorpay Simulation Toggle)
router.get("/settings", verifyToken, verifyStaff, checkPermission("manage_settings"), async (req, res) => {
  try {
    const settingDoc = await db.collection("settings").doc("platform").get()
    res.json(settingDoc.exists ? settingDoc.data() : { razorpaySimulation: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put("/settings", verifyToken, verifyStaff, checkPermission("manage_settings"), async (req, res) => {
  try {
    const { razorpaySimulation } = req.body
    await db.collection("settings").doc("platform").set({ razorpaySimulation }, { merge: true })
    res.json({ message: "Settings updated" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get Audit Logs
const reportService = require("../services/ReportService")
router.get("/audit/logs", verifyToken, verifyStaff, checkPermission("view_audit"), async (req, res) => {
  try {
    const logs = await reportService.getAuditLogs()
    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Promote user to admin
router.put("/users/:userId/promote", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    await db.collection("users").doc(userId).update({
      role: "admin",
      promotedAt: new Date(),
      promotedBy: req.user.uid
    })
    res.json({ message: "User promoted to admin" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// EMPLOYEE MANAGEMENT (Admin Only)

// List all employees
router.get("/employees", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("users").where("role", "==", "employee").get()
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(list)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create/Invite Employee
router.post("/employees", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { email, username, permissions } = req.body
    
    // Check if user exists
    const userSnapshot = await db.collection("users").where("email", "==", email).get()
    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found. They must register an account first." })
    }
    
    const userDoc = userSnapshot.docs[0]
    await userDoc.ref.update({
      role: "employee",
      username: username || userDoc.data().username,
      permissions: permissions || {},
      employeeAddedAt: new Date(),
      employeeAddedBy: req.user.uid
    })
    
    res.json({ message: "Employee added successfully", id: userDoc.id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update Employee Permissions
router.put("/employees/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { permissions } = req.body
    await db.collection("users").doc(id).update({
      permissions,
      updatedAt: new Date()
    })
    res.json({ message: "Permissions updated" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Remove Employee (demote back to bidder)
router.delete("/employees/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params
    await db.collection("users").doc(id).update({
      role: "bidder",
      permissions: null,
      updatedAt: new Date()
    })
    res.json({ message: "Employee removed" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router