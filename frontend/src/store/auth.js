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
    loading: true
  }),
  actions: {
    async login(email, password) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      await this.fetchUserData(userCredential.user.uid)
    },
    async register(email, password, username) {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Initialize user in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        role: 'bidder', // Default role
        credits: 5000,
        heldCredits: 0
      })
      
      await this.fetchUserData(user.uid)
    },
    async logout() {
      await signOut(auth)
      this.user = null
      this.role = null
    },
    async fetchUserData(uid) {
      const docSnap = await getDoc(doc(db, 'users', uid))
      if (docSnap.exists()) {
        this.user = { uid, ...docSnap.data() }
        this.role = docSnap.data().role
      }
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
