// FILE: frontend/src/router/index.js
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
import Sell from '../pages/Sell.vue'
import ForgotPassword from '../pages/ForgotPassword.vue'
import Terms from '../pages/Terms.vue'
import Privacy from '../pages/Privacy.vue'
import Support from '../pages/Support.vue'
import AdminLogin from '../pages/AdminLogin.vue'

const routes = [
  { path: '/', redirect: '/auctions' },
  { path: '/login', component: Login, name: 'Login' },
  { path: '/register', component: Register, name: 'Register' },
  { path: '/dashboard', component: Dashboard, name: 'Dashboard', meta: { requiresAuth: true } },
  { path: '/auctions', component: AuctionList, name: 'AuctionList' },
  { path: '/auction/:id', component: AuctionDetail, name: 'AuctionDetail' },
  { path: '/admin', component: Admin, name: 'Admin', meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/profile', component: Profile, name: 'Profile', meta: { requiresAuth: true } },
  { path: '/wallet', component: Wallet, name: 'Wallet', meta: { requiresAuth: true } },
  { path: '/sell', component: Sell, name: 'Sell', meta: { requiresAuth: true } },
  { path: '/forgot-password', component: ForgotPassword, name: 'ForgotPassword' },
  { path: '/terms', component: Terms, name: 'Terms' },
  { path: '/privacy', component: Privacy, name: 'Privacy' },
  { path: '/support', component: Support, name: 'Support' },
  { path: '/admin/login', component: AdminLogin, name: 'AdminLogin' },
  { path: '/:pathMatch(.*)*', redirect: '/auctions' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for Firebase auth state to resolve — but with a timeout so we never deadlock
  if (authStore.loading) {
    await new Promise((resolve) => {
      const maxWait = setTimeout(resolve, 3000) // 3s failsafe
      const stop = authStore.$subscribe(() => {
        if (!authStore.loading) {
          clearTimeout(maxWait)
          stop()
          resolve()
        }
      })
    })
  }

  if (to.meta.requiresAuth && !authStore.user) {
    // If trying to access admin area without login, go to admin login
    if (to.path.startsWith('/admin')) {
      next('/admin/login')
    } else {
      next({ path: '/login', query: { redirect: to.fullPath } })
    }
  } else if (to.meta.requiresAdmin && !(authStore.role === 'admin' || authStore.role === 'employee')) {
    next('/auctions')
  } else {
    next()
  }
})

export default router