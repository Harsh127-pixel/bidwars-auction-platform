const admin = require("firebase-admin")

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  // Production: Use environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} else {
  // Local: Use file
  try {
    serviceAccount = require("./serviceAccountKey.json");
  } catch (e) {
    console.error("Firebase Service Account key missing locally and in ENV.");
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
} else {
  console.error("Firebase Admin could not be initialized.");
}

const db = admin.firestore()

module.exports = db
