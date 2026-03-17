// FILE: frontend/src/config/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Validate at boot so missing vars surface immediately as a clear error
const required = ['apiKey', 'authDomain', 'projectId', 'appId']
const missing = required.filter(k => !firebaseConfig[k])

if (missing.length > 0) {
  console.error('[Firebase] CRITICAL ERROR: Missing required environment variables:', missing.join(', '))
}

let app, auth, db

try {
  app  = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db   = getFirestore(app)
} catch (err) {
  console.error('[Firebase] Initialization failed:', err.message)
  // Non-breaking fallback so the app shell can at least render a "Site under maintenance" or similar
}

export { auth, db }
export default app