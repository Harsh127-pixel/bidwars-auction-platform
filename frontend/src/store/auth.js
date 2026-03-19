// FILE: frontend/src/store/auth.js
import { defineStore } from 'pinia'
import { auth, db } from '../config/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  updatePassword
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    role: null,
    loading: true,       // true until Firebase resolves the initial auth state
    _userListener: null, // Firestore real-time listener unsubscribe fn
    _authInitialized: false,
    pingHistory: JSON.parse(localStorage.getItem('admin_ping_history') || '[]'),
    platformSettings: {
      captchaEnabled: true,
      registrationEnabled: true,
      maintenanceMode: false,
      emailVerificationRequired: false
    }
  }),

  actions: {
    // Call once at app startup (App.vue, top-level — NOT in onMounted)
    async init() {
      if (this._authInitialized || !auth) return
      this._authInitialized = true

      // Load platform settings (public)
      try {
        const { API_URL } = await import('../config/api')
        const res = await fetch(`${API_URL}/api/settings`)
        const data = await res.json()
        this.platformSettings = { ...this.platformSettings, ...data }
      } catch (err) {
        console.warn('[AuthStore] Settings load failed:', err.message)
      }

      // Ping health check every 10 minutes to keep backend alive (Render free tier)
      this.pingHealthCheck()
      setInterval(() => this.pingHealthCheck(), 10 * 60 * 1000)

      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          await this._attachUserListener(firebaseUser.uid)
          this._registerDevice(firebaseUser.uid)
        } else {
          this._detachUserListener()
          this.user = null
          this.role = null
          this.loading = false
        }
      })
    },

    async _attachUserListener(uid) {
      this._detachUserListener()

      return new Promise((resolve) => {
        let firstSnapshot = true
        this._userListener = onSnapshot(doc(db, 'users', uid), (snap) => {
          if (snap.exists()) {
            this.user = { uid, ...snap.data() }
            this.role = snap.data().role
          } else {
            this.user = null
            this.role = null
          }
          if (firstSnapshot) {
            firstSnapshot = false
            this.loading = false
            resolve()
          }
        })
      })
    },

    _detachUserListener() {
      if (this._userListener) {
        this._userListener()
        this._userListener = null
      }
    },

    async _registerDevice(uid) {
      const deviceId = navigator.userAgent
      try {
        await updateDoc(doc(db, 'users', uid), {
          lastDeviceId: deviceId,
          lastActive: new Date()
        })
      } catch (err) { console.warn('Device registration failed', err) }
    },

    async login(email, password, rememberMe = false) {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
      const credential = await signInWithEmailAndPassword(auth, email, password)
      // _attachUserListener will be called automatically via onAuthStateChanged
      return true
    },

    async register(email, password, username, phone = '') {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = credential.user.uid

      const isAdminEmail = email === import.meta.env.VITE_ADMIN_EMAIL

      await setDoc(doc(db, 'users', uid), {
        username,
        email,
        phone,
        role: isAdminEmail ? 'admin' : 'bidder',
        credits: 5000,
        heldCredits: 0,
        isVerified: false,
        kycStatus: null,
        membershipTier: 'Bronze',
        reputation: 100,
        totalWins: 0,
        preferences: {
          smsNotifications: false,
          twoFactor: true,
          confidentialBidding: false
        },
        createdAt: new Date()
      })

      return true
    },

    async logout() {
      this._detachUserListener()
      await signOut(auth)
      this.user = null
      this.role = null
    },

    async getToken() {
      if (!auth.currentUser) return null
      return auth.currentUser.getIdToken()
    },



    async updatePreferences(prefs) {
      if (!this.user) return false
      await updateDoc(doc(db, 'users', this.user.uid), {
        preferences: { ...this.user.preferences, ...prefs }
      })
      return true
    },

    async resetPassword(email) {
      await sendPasswordResetEmail(auth, email)
      return true
    },

    async changePassword(newPassword) {
      if (!auth.currentUser) throw new Error('User not logged in')
      await updatePassword(auth.currentUser, newPassword)
      return true
    },

    async fetchProfile() {
      if (!auth.currentUser) return
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid))
      if (snap.exists()) {
        this.user = { uid: auth.currentUser.uid, ...snap.data() }
        this.role = snap.data().role
      }
    },

    async pingHealthCheck() {
      const start = Date.now()
      let status = 'error'
      let message = 'Connection failed'
      
      try {
        const { API_URL } = await import('../config/api')
        const res = await fetch(`${API_URL}/api/health`)
        const data = await res.json()
        status = data.status === 'ok' ? 'success' : 'warning'
        message = `Backend responded: ${data.status}`
      } catch (err) {
        message = err.message || 'Network error'
      }

      const entry = {
        timestamp: new Date().toISOString(),
        latency: Date.now() - start,
        status,
        message
      }

      this.pingHistory.unshift(entry)
      if (this.pingHistory.length > 50) this.pingHistory.pop()
      localStorage.setItem('admin_ping_history', JSON.stringify(this.pingHistory))
    }
  }
})