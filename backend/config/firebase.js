// FILE: backend/config/firebase.js
const admin = require("firebase-admin")

let serviceAccount

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    console.log("[Firebase] Loaded credentials from FIREBASE_SERVICE_ACCOUNT_JSON env var")
  } catch (e) {
    console.error("[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON — trying individual env vars:", e.message)
    // Fallback to individual environment variables
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "default",
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID || "default",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL.replace('@', '%40')}`,
        universe_domain: "googleapis.com"
      }
      console.log("[Firebase] Loaded credentials from individual Firebase env vars")
    } else {
      console.error("[Firebase] FIREBASE_SERVICE_ACCOUNT_JSON failed to parse and individual env vars not found")
      process.exit(1)
    }
  }
} else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  // Use individual environment variables directly
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log("[Firebase] FIREBASE_PRIVATE_KEY starts with:", privateKey.substring(0, 50) + "...");

  // Check if FIREBASE_PRIVATE_KEY contains JSON (full service account object)
  if (privateKey.startsWith('{')) {
    try {
      const serviceAccountJson = JSON.parse(privateKey);
      serviceAccount = {
        type: "service_account",
        project_id: serviceAccountJson.project_id,
        private_key_id: serviceAccountJson.private_key_id,
        private_key: serviceAccountJson.private_key,
        client_email: serviceAccountJson.client_email,
        client_id: serviceAccountJson.client_id,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: serviceAccountJson.client_x509_cert_url,
        universe_domain: "googleapis.com"
      };
      console.log("[Firebase] Successfully parsed JSON from FIREBASE_PRIVATE_KEY");
      console.log("[Firebase] Project ID:", serviceAccount.project_id);
      console.log("[Firebase] Client Email:", serviceAccount.client_email);
    } catch (e) {
      console.error("[Firebase] Failed to parse JSON in FIREBASE_PRIVATE_KEY:", e.message);
      console.error("[Firebase] Raw content:", privateKey.substring(0, 100) + "...");
      process.exit(1);
    }
  } else {
    // Use individual environment variables
    serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "default",
      private_key: privateKey.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || "default",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL.replace('@', '%40')}`,
      universe_domain: "googleapis.com"
    };
    console.log("[Firebase] Loaded credentials from individual Firebase env vars");
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
    console.error("  Option B: Set FIREBASE_SERVICE_ACCOUNT_JSON env var with valid JSON")
    console.error("  Option C: Set individual Firebase env vars:")
    console.error("            FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY")
    console.error("========================================================\n")
    process.exit(1)
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
  // Check Firebase connection by listing collections (async)
  admin.firestore().listCollections()
    .then(() => {
      console.log("[Firebase] Connected to Firestore successfully!")
    })
    .catch((err) => {
      console.error("[Firebase] Connection to Firestore failed:", err.message)
    })
}

const db = admin.firestore()
const auth = admin.auth()

module.exports = { admin, db, auth }