// FILE: backend/services/settingsService.js
const { db } = require("../config/firebase")

let cachedSettings = null
let lastFetch = 0
const CACHE_TTL = 30000 // 30 seconds

const getSettings = async () => {
  const now = Date.now()
  if (cachedSettings && (now - lastFetch < CACHE_TTL)) {
    return cachedSettings
  }

  try {
    const doc = await db.collection("settings").doc("platform").get()
    const data = doc.exists ? doc.data() : {}
    cachedSettings = {
      razorpaySimulation: true,
      captchaEnabled: true,
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: false,
      ...data
    }
    lastFetch = now
    return cachedSettings
  } catch (err) {
    console.error('[Settings] Failed to fetch settings:', err.message)
    return cachedSettings || {
      razorpaySimulation: true,
      captchaEnabled: true,
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: false
    }
  }
}

module.exports = { getSettings }
