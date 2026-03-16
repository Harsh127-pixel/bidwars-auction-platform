import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'
import Login from '../pages/Login.vue'
import Register from '../pages/Register.vue'
import Dashboard from '../pages/Dashboard.vue'
import AuctionList from '../pages/AuctionList.vue'
import AuctionDetail from '../pages/AuctionDetail.vue'
import Admin from '../pages/Admin.vue'
import Profile from '../pages/Profile.vue'
import Wallet from '../pages/Wallet.vue'

const routes = [
  { path: '/', redirect: '/auctions' },
  { path: '/login', component: Login, name: 'Login' },
  { path: '/register', component: Register, name: 'Register' },
  { 
    path: '/dashboard', 
    component: Dashboard, 
    name: 'Dashboard',
    meta: { requiresAuth: true }
  },
  { path: '/auctions', component: AuctionList, name: 'AuctionList' },
  { path: '/auction/:id', component: AuctionDetail, name: 'AuctionDetail' },
  { 
    path: '/admin', 
    component: Admin, 
    name: 'Admin',
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/profile', 
    component: Profile, 
    name: 'Profile',
    meta: { requiresAuth: true }
  },
  { 
    path: '/wallet', 
    component: Wallet, 
    name: 'Wallet',
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Wait for auth to initialize
  if (authStore.loading) {
    // This is simple; in a real app you might want a better loading state
    await new Promise(resolve => {
      const stop = authStore.$subscribe(() => {
        if (!authStore.loading) {
          stop()
          resolve()
        }
      })
    })
  }

  if (to.meta.requiresAuth && !authStore.user) {
    next('/login')
  } else if (to.meta.requiresAdmin && authStore.role !== 'admin') {
    // TEMPORARY DEMO MODE: Bypassing admin check so you can test features
    console.warn("DEMO MODE: Bypassing admin role check for testing.");
    next()
    // next('/auctions') // Original logic
  } else {
    next()
  }
})

export default router
