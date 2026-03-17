const { db } = require("../config/firebase")

class NotificationService {
  constructor() {
    this.io = null
  }

  setIo(io) {
    this.io = io
  }

  async send(userId, type, message, data = {}) {
    try {
      const notification = {
        userId,
        type,
        message,
        ...data,
        read: false,
        createdAt: new Date()
      }

      await db.collection("notifications").add(notification)

      // 1. Desktop/Web Real-time (Socket.io)
      if (this.io) {
        this.io.to(`user_${userId}`).emit("notification", notification)
      }
      
      // 2. Mobile/Device Push (FCM)
      const userDoc = await db.collection("users").doc(userId).get()
      if (userDoc.exists) {
        const userData = userDoc.data()
        if (userData.fcmToken) {
           const payload = {
             token: userData.fcmToken,
             notification: {
               title: 'BidWars Update',
               body: message
             },
             data: {
               type,
               ...Object.entries(data).reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {})
             }
           }
           
           try {
             const { admin } = require("../config/firebase")
             await admin.messaging().send(payload)
             console.log(`[FCM] Push sent to ${userId}`)
           } catch (fcmErr) {
             console.warn(`[FCM] Failed to send push to ${userId}:`, fcmErr.message)
             // If token is invalid, maybe remove it?
             if (fcmErr.code === 'messaging/registration-token-not-registered') {
                await db.collection("users").doc(userId).update({ fcmToken: null })
             }
           }
        }
      }

      return true
    } catch (err) {
      console.error("Failed to send notification:", err)
      return false
    }
  }

  async broadcast(type, message, data = {}) {
    try {
      // For global notifications, we might not want to write 10,000 docs to Firestore 
      // instantly if we have many users. For now, let's just emit to everyone.
      if (this.io) {
        this.io.emit("notification", { type, message, ...data, createdAt: new Date() })
      }
    } catch (err) {
      console.error("Broadcast failed:", err)
    }
  }
}

module.exports = new NotificationService()
