import { defineStore } from 'pinia'
import { auth, db } from '../config/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    role: null,
    loading: true,
    userListener: null
  }),
  actions: {
    async login(email, password) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      await this.fetchUserData(userCredential.user.uid)
      return true
    },
    async register(email, password, username) {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Initialize user in Firestore
      const isAdminEmail = email === import.meta.env.VITE_ADMIN_EMAIL
      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        role: isAdminEmail ? 'admin' : 'bidder',
        credits: 5000,
        heldCredits: 0,
        isVerified: false
      })
      
      await this.fetchUserData(user.uid)
      return true
    },
    async logout() {
      if (this.userListener) this.userListener()
      await signOut(auth)
      this.user = null
      this.role = null
      this.userListener = null
    },
    async fetchUserData(uid) {
      if (this.userListener) this.userListener()
      
      const { onSnapshot, doc } = await import('firebase/firestore')
      
      this.userListener = onSnapshot(doc(db, 'users', uid), (docSnap) => {
        if (docSnap.exists()) {
          this.user = { uid, ...docSnap.data() }
          this.role = docSnap.data().role
        }
      })
    },
    async getToken() {
      if (!auth.currentUser) return null
      return await auth.currentUser.getIdToken()
    },
    init() {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          await this.fetchUserData(user.uid)
        } else {
          this.user = null
          this.role = null
        }
        this.loading = false
      })
    }
  }
})
