// FILE: frontend/src/store/auth.js
import { defineStore } from 'pinia'
import { auth, db } from '../config/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    role: null,
    loading: true,       // true until Firebase resolves the initial auth state
    _userListener: null, // Firestore real-time listener unsubscribe fn
    _authInitialized: false
  }),

  actions: {
    // Call once at app startup (App.vue, top-level — NOT in onMounted)
    init() {
      if (this._authInitialized) return
      this._authInitialized = true

      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          await this._attachUserListener(firebaseUser.uid)
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

    async login(email, password) {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      // _attachUserListener will be called automatically via onAuthStateChanged
      return true
    },

    async register(email, password, username) {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = credential.user.uid

      const isAdminEmail = email === import.meta.env.VITE_ADMIN_EMAIL

      await setDoc(doc(db, 'users', uid), {
        username,
        email,
        role: isAdminEmail ? 'admin' : 'bidder',
        credits: 5000,
        heldCredits: 0,
        isVerified: false,
        kycStatus: null,
        membershipTier: 'Bronze',
        reputation: 100,
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

    async requestKYC() {
      if (!this.user) return false
      await updateDoc(doc(db, 'users', this.user.uid), {
        kycStatus: 'pending',
        kycSubmittedAt: new Date()
      })
      return true
    },

    async updatePreferences(prefs) {
      if (!this.user) return false
      await updateDoc(doc(db, 'users', this.user.uid), {
        preferences: { ...this.user.preferences, ...prefs }
      })
      return true
    }
  }
})