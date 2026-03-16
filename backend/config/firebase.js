// FILE: backend/config/firebase.js
const admin = require("firebase-admin")

let serviceAccount

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    console.log("[Firebase] Loaded credentials from FIREBASE_SERVICE_ACCOUNT_JSON env var")
  } catch (e) {
    console.error("[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON — check for invalid JSON:", e.message)
    process.exit(1)
  }
} else {
  try {
    serviceAccount = require("./serviceAccountKey.json")
    console.log("[Firebase] Loaded credentials from serviceAccountKey.json")
  } catch (e) {
    console.error("\n========================================================")
    console.error("[Firebase] SETUP REQUIRED: No credentials found.")
    console.error("  Option A: Download serviceAccountKey.json from Firebase Console")
    console.error("            → Project Settings → Service Accounts → Generate new private key")
    console.error("            → Place file at: backend/config/serviceAccountKey.json")
    console.error("")
    console.error("  Option B: Set the FIREBASE_SERVICE_ACCOUNT_JSON env var in backend/.env")
    console.error("            with the full JSON content of the service account key.")
    console.error("========================================================\n")
    process.exit(1)
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

module.exports = db