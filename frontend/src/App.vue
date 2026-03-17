<!-- FILE: frontend/src/App.vue -->
<script setup>
import { ref, onMounted, watch, computed, provide } from 'vue'
import { useAuthStore } from './store/auth'
import { useRouter, useRoute } from 'vue-router'
import { useNotification } from './services/notification'
import api from './services/api'
import socket, { joinUserRoom } from './services/socket'
import NotificationToast from './components/NotificationToast.vue'
import SubscriptionModal from './components/SubscriptionModal.vue'
import FloatingChat from './components/FloatingChat.vue'

const authStore = useAuthStore()
const notification = useNotification()
const router = useRouter()
const route = useRoute()

// Theme logic: check localStorage first, then OS preference
const getInitialTheme = () => {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') return 'dark'
  if (saved === 'light') return 'light'
  // Default to OS preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const themeMode = ref(localStorage.getItem('theme') || 'system') // 'light' | 'dark' | 'system'
const isDark = ref(getInitialTheme() === 'dark')
const drawer = ref(false)
const showSubscriptionModal = ref(false)
const subscriptionTriggerContext = ref('general')

// Expose globally so other pages can trigger the modal
const openSubscriptionModal = (context = 'general') => {
  subscriptionTriggerContext.value = context
  showSubscriptionModal.value = true
}

provide('openSubscriptionModal', openSubscriptionModal)

// Initialize auth IMMEDIATELY (not in onMounted) so the router guard
// doesn't deadlock waiting for loading to become false
authStore.init()

const applyTheme = (mode) => {
  let dark = false
  if (mode === 'dark') dark = true
  else if (mode === 'system') dark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = dark
  if (dark) document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
}

watch(themeMode, (val) => {
  if (val === 'system') {
    localStorage.removeItem('theme')
  } else {
    localStorage.setItem('theme', val)
  }
  applyTheme(val)
}, { immediate: true })

const setTheme = (mode) => { themeMode.value = mode }
const toggleDark = () => { themeMode.value = isDark.value ? 'light' : 'dark' }

// Listen for OS theme changes when in system mode
onMounted(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => { if (themeMode.value === 'system') applyTheme('system') })
})

const handleLogout = async () => {
  try {
    await authStore.logout()
    notification.add('Logged out successfully', 'info')
    router.push('/login')
  } catch (err) {
    notification.add('Logout failed', 'error')
  }
}

const resetPassword = async () => {
  if (!authStore.user?.email) return
  try {
    await api.post('/api/users/forgot-password', { email: authStore.user.email })
    notification.add('Password reset link sent to your email!', 'success')
  } catch (err) {
    notification.add('Failed to send reset link.', 'error')
  }
}

const isAuthPage = computed(() => 
  ['Login', 'Register'].includes(route.name) || 
  route.path.includes('/login') || 
  route.path.includes('/register')
)

const isStaff = computed(() => authStore.role === 'admin' || authStore.role === 'employee')
const isOnAdminPage = computed(() => route.path.startsWith('/admin'))

// Admin tabs config — must match Admin.vue allTabsConfigs
const allAdminTabs = [
  { id:'overview',    label:'Overview' },
  { id:'auctions',    label:'Auctions',     permission: 'view_auctions' },
  { id:'proposals',   label:'Proposals',    permission: 'view_proposals' },
  { id:'transactions',label:'Transactions', permission: 'view_audit' },
  { id:'fulfillment', label:'Fulfillment',  permission: 'view_fulfillment' },
  { id:'flagged',     label:'Security',     permission: 'manage_users' },
  { id:'disputes',    label:'Disputes',     permission: 'view_disputes' },
  { id:'support',     label:'Support',      permission: 'view_support' },
  { id:'users',       label:'Users',        permission: 'view_users' },
  { id:'employees',   label:'Employees',    adminOnly: true },
  { id:'logs',        label:'Audit Logs',   permission: 'view_audit' },
  { id:'reports',     label:'AI Reports',   permission: 'view_audit' },
  { id:'settings',    label:'Settings',     permission: 'manage_settings' },
  { id:'create',      label:'+ New Lot',    permission: 'manage_auctions' },
]
const adminTabs = computed(() => {
  return allAdminTabs.filter(t => {
    if (authStore.role === 'admin') return true
    if (t.adminOnly) return false
    if (!t.permission) return true
    return authStore.user?.permissions?.[t.permission]
  })
})

// ========== BROWSER NOTIFICATIONS ==========
const browserNotifGranted = ref(Notification?.permission === 'granted')
const browserNotifAsked = ref(localStorage.getItem('notif-asked') === '1')

const requestBrowserNotifications = () => {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    browserNotifGranted.value = true
    return
  }
  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      browserNotifGranted.value = perm === 'granted'
      browserNotifAsked.value = true
      localStorage.setItem('notif-asked', '1')
    })
  }
}

const showBrowserNotification = (title, body, icon = '/favicon.svg') => {
  // Always try to show — even when tab is focused for important updates
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    const n = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: title, // Prevents duplicate notifications
      renotify: true
    })
    n.onclick = () => { window.focus(); n.close() }
    setTimeout(() => n.close(), 5000)
  } catch (e) {
    // Service worker fallback for mobile
    if (navigator.serviceWorker?.ready) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, { body, icon, tag: title })
      }).catch(() => {})
    }
  }
}

const fmtTime = (ts) => {
  if (!ts) return ''
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
  return d.toLocaleDateString()
}

const notifications = ref([])
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const fetchNotifications = async () => {
  if (!authStore.user) return
  try {
    const res = await api.get('/api/notifications')
    notifications.value = res.data
  } catch (err) { console.warn('Failed to fetch notifications', err) }
}

const markAllRead = async () => {
  try {
    await api.delete('/api/notifications/clear-all')
    notifications.value = []
    notification.add('All notifications cleared', 'success')
  } catch {
    notification.add('Failed to clear notifications', 'error')
  }
}

// Helper to push an in-app bell notification
const pushBellNotification = (title, message, icon = 'mdi-information-outline', type = 'info') => {
  notifications.value.unshift({ id: Date.now(), title, message, createdAt: new Date(), icon, type, read: false })
}

watch(() => authStore.user, (user) => {
  if (user) {
    fetchNotifications()
    joinUserRoom(user.uid)
  }
}, { immediate: true })

onMounted(() => {
  // Don't auto-request permission — wait for user gesture (bell click)
  // Just check current state
  if ('Notification' in window && Notification.permission === 'granted') {
    browserNotifGranted.value = true
  }

  // ─── SOCKET LISTENERS ───────────────────────────────────────
  // Bid updates
  socket.on('bidUpdate', (data) => {
    if (data.previousBidder === authStore.user?.uid && data.userId !== authStore.user?.uid) {
      pushBellNotification(
        `Outbid on Lot ${data.auctionId.slice(0,6).toUpperCase()}`,
        `Someone just bid ₹${data.amount.toLocaleString()}`,
        'mdi-gavel', 'outbid'
      )
      notification.add("You've been outbid!", "error")
      showBrowserNotification('Outbid!', `Someone outbid you with ₹${data.amount.toLocaleString()}`)
    }
  })

  socket.on('biddingStopped', (data) => {
    const title = data.status === 'closed' ? 'Auction Closed' : 'Auction Withdrawn'
    pushBellNotification(title, 'Click to see final results',
      data.status === 'closed' ? 'mdi-trophy-outline' : 'mdi-alert-circle-outline', 'info')
    showBrowserNotification('Auction Update', data.status === 'closed' ? 'An auction you watched has closed!' : 'An auction was withdrawn')
  })

  // Server push notifications
  socket.on('notification', (data) => {
    if (data.userId && data.userId !== authStore.user?.uid) return
    pushBellNotification(data.type?.replace(/_/g, ' ') || 'Notification', data.message)
    notification.add(data.message, 'info')
    showBrowserNotification('BidWars', data.message)
  })

  // Admin data refresh
  socket.on('adminDataUpdate', () => {
    window.dispatchEvent(new CustomEvent('admin-data-refresh'))
  })

  // Ticket updates
  socket.on('ticketUpdate', (data) => {
    fetchNotifications()
    if (data?.message) {
      pushBellNotification('Support Update', data.message, 'mdi-chat-processing-outline', 'support')
      showBrowserNotification('Support Update', data.message)
    }
  })

  // Dispute updates
  socket.on('disputeUpdate', (data) => {
    if (data.userId === authStore.user?.uid) {
      fetchNotifications()
      const msg = `Your dispute has been ${data.status}`
      pushBellNotification('Dispute Update', msg, 'mdi-alert-circle-outline', 'dispute')
      notification.add(msg, 'info')
      showBrowserNotification('Dispute Update', msg)
    }
  })

  // Wallet updates
  socket.on('walletUpdate', (data) => {
    if (data.userId === authStore.user?.uid) {
      fetchNotifications()
      const msg = data.message || 'Your wallet has been updated'
      pushBellNotification('Wallet Update', msg, 'mdi-wallet-outline', 'wallet')
      notification.add(msg, 'success')
      showBrowserNotification('Wallet Update', msg)
    }
  })
})
</script>

<template>
  <v-app :theme="isDark ? 'dark' : 'light'" :class="isDark ? 'dark' : ''">
    <!-- Mobile Drawer -->
    <v-navigation-drawer v-model="drawer" temporary location="right" width="300"
      style="background-color: var(--bg-card); border-left: 1px solid var(--border-color);">
      <div class="pa-5">
        <div class="d-flex align-center justify-space-between mb-6">
          <span style="font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--text-primary);">BidWars</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="drawer = false"
            style="color: var(--text-muted);"></v-btn>
        </div>

        <div class="d-flex flex-column gap-1">
          <!-- USER links -->
          <template v-if="!isStaff">
            <v-btn to="/auctions" variant="text" block class="justify-start rounded-lg px-4" height="44"
              style="color: var(--text-secondary); font-weight: 500;" @click="drawer = false">
              <v-icon start size="18">mdi-gavel</v-icon>Browse Auctions
            </v-btn>
            <v-btn v-if="authStore.user" to="/sell" variant="text" block class="justify-start rounded-lg px-4"
              height="44" style="color: var(--accent); font-weight: 600;" @click="drawer = false">
              <v-icon start size="18">mdi-plus-box-outline</v-icon>Sell Asset
            </v-btn>
            <v-btn v-if="authStore.user" to="/dashboard" variant="text" block class="justify-start rounded-lg px-4"
              height="44" style="color: var(--text-secondary); font-weight: 500;" @click="drawer = false">
              <v-icon start size="18">mdi-view-dashboard-outline</v-icon>My Dashboard
            </v-btn>
            <v-btn v-if="authStore.user" to="/wallet" variant="text" block class="justify-start rounded-lg px-4"
              height="44" style="color: var(--text-secondary); font-weight: 500;" @click="drawer = false">
              <v-icon start size="18">mdi-wallet-outline</v-icon>Wallet
            </v-btn>
            <v-btn v-if="authStore.user" to="/profile" variant="text" block class="justify-start rounded-lg px-4"
              height="44" style="color: var(--text-secondary); font-weight: 500;" @click="drawer = false">
              <v-icon start size="18">mdi-account-outline</v-icon>Profile
            </v-btn>
            <v-btn v-if="authStore.user" to="/support" variant="text" block class="justify-start rounded-lg px-4"
              height="44" style="color: var(--text-secondary); font-weight: 500;" @click="drawer = false">
              <v-icon start size="18">mdi-help-circle-outline</v-icon>Support & Help
            </v-btn>
          </template>

          <!-- ADMIN/EMPLOYEE mobile nav -->
          <template v-if="isStaff">
            <div style="padding:4px 0 8px">
              <div style="font-size:10px;font-weight:800;letter-spacing:0.1em;color:var(--accent);text-transform:uppercase;padding:4px 16px;margin-bottom:4px">
                {{ authStore.role === 'admin' ? 'Admin Panel' : 'Staff Panel' }}
              </div>
              <v-btn v-for="t in adminTabs" :key="t.id"
                variant="text" block class="justify-start rounded-lg px-4" height="40"
                style="color: var(--text-secondary); font-weight: 500; font-size: 14px;"
                @click="$router.replace({ path: '/admin', query: { tab: t.id } }); drawer = false">
                {{ t.label }}
              </v-btn>
            </div>
          </template>

          <v-btn v-if="authStore.user" variant="text" block class="justify-start rounded-lg px-4"
            height="44" style="color: var(--text-secondary); font-weight: 500;" @click="resetPassword(); drawer = false">
            <v-icon start size="18">mdi-lock-reset</v-icon>Reset Password
          </v-btn>
        </div>

        <v-divider class="my-4" style="border-color: var(--border-color);"></v-divider>


          <template v-if="!authStore.user">
            <v-btn to="/login" variant="outlined" block class="rounded-lg btn-outline" height="44"
              @click="drawer = false">Sign In</v-btn>
            <v-btn to="/register" block class="rounded-lg btn-primary" height="44" @click="drawer = false">Register
              Free</v-btn>
          </template>
          <v-btn v-else @click="() => { drawer = false; handleLogout(); }" variant="outlined" block class="rounded-lg btn-outline"
            height="44">Sign Out</v-btn>
        </div>
    </v-navigation-drawer>

    <!-- Top Nav -->
    <v-app-bar elevation="0" :height="isStaff && isOnAdminPage ? 106 : 64" fixed
      style="background-color: var(--bg-card) !important; border-bottom: 1px solid var(--border-color) !important; z-index: 100;">
      <v-container class="d-flex flex-column fill-height pa-0" style="max-width: 1280px; margin: 0 auto;" fluid>
        <!-- Primary row -->
        <div class="d-flex align-center px-4" style="height: 64px; width: 100%;">
          <router-link to="/" class="d-flex align-center text-decoration-none" style="gap: 8px;">
            <div
              style="width: 34px; height: 34px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              <v-icon icon="mdi-gavel" color="white" size="18"></v-icon>
            </div>
            <span
              style="font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text-primary); letter-spacing: -0.5px;">BidWars</span>
          </router-link>

          <!-- Staff badge in appbar -->
          <div v-if="isStaff" class="d-none d-md-flex align-center ml-3" style="gap: 6px;">
            <span class="admin-role-badge">{{ authStore.role === 'admin' ? 'ADMIN' : 'STAFF' }}</span>
          </div>

          <v-spacer></v-spacer>

          <!-- Desktop Nav -->
          <div class="d-none d-lg-flex align-center" style="gap: 4px;">
            <!-- Normal user links -->
            <template v-if="!isStaff">
              <v-btn to="/auctions" variant="text" class="rounded-lg px-4" height="38"
                style="color: var(--text-secondary); font-weight: 500; font-size: 14px;">Auctions</v-btn>
              <v-btn v-if="authStore.user" to="/sell" variant="flat" class="rounded-lg px-4 mr-1" height="38"
                style="background: var(--accent); color: white; font-weight: 600; font-size: 13px;">Sell Asset</v-btn>
              <v-btn v-if="authStore.user" to="/dashboard" variant="text" class="rounded-lg px-4" height="38"
                style="color: var(--text-secondary); font-weight: 500; font-size: 14px;">Dashboard</v-btn>
              <v-btn v-if="authStore.user" to="/wallet" variant="text" class="rounded-lg px-4" height="38"
                style="color: var(--text-secondary); font-weight: 500; font-size: 14px;">Wallet</v-btn>
              <v-btn v-if="authStore.user" to="/support" variant="text" class="rounded-lg px-4" height="38"
                style="color: var(--text-secondary); font-weight: 500; font-size: 14px;">Support</v-btn>
            </template>

            <!-- Staff: Admin Dashboard link -->
            <template v-if="isStaff">
              <v-btn to="/admin" variant="tonal" class="rounded-lg px-5" height="38"
                style="background: var(--accent-soft, rgba(251,191,36,0.12)); color: var(--accent); font-weight: 600; font-size: 13px;"
                prepend-icon="mdi-shield-crown-outline">Admin Panel</v-btn>
            </template>

            <v-btn v-if="authStore.user?.isVerified" variant="text" size="small" icon class="mr-2" title="KYC Verified" style="color: var(--green);">
              <v-icon>mdi-check-decagram</v-icon>
            </v-btn>

            <v-menu v-if="authStore.user" :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" variant="text" class="rounded-lg px-4" height="38"
                  style="color: var(--text-primary); font-weight: 600; font-size: 15px;">
                  <v-icon start size="16">mdi-account-circle</v-icon>
                  {{ authStore.user?.username }}
                  <v-icon end size="14">mdi-chevron-down</v-icon>
                </v-btn>
              </template>
              <v-list width="200" class="rounded-lg pa-2"
                style="background: var(--bg-card); border: 1px solid var(--border-color);">
                <v-list-item v-if="!isStaff" to="/profile" class="rounded-lg mb-1">
                  <template v-slot:prepend>
                    <v-icon size="16">mdi-account-outline</v-icon>
                  </template>
                  <v-list-item-title style="font-size: 14px;">My Profile</v-list-item-title>
                </v-list-item>
                <div class="pa-2 d-none d-lg-block">
                  <div class="theme-switcher theme-switcher--mini">
                    <div class="theme-switcher__slider" :style="`transform: translateX(${['light','dark','system'].indexOf(themeMode) * 100}%)`"></div>
                    <button v-for="m in ['light','dark','system']" :key="m"
                      @click="setTheme(m)"
                      class="theme-switcher__btn"
                      :class="{'theme-switcher__btn--active': themeMode === m}">
                      <v-icon size="14">{{ m === 'light' ? 'mdi-weather-sunny' : m === 'dark' ? 'mdi-weather-night' : 'mdi-monitor' }}</v-icon>
                    </button>
                  </div>
                </div>
                <v-divider class="my-1"></v-divider>
                <v-list-item @click="resetPassword" class="rounded-lg mb-1">
                  <template v-slot:prepend>
                    <v-icon size="16">mdi-lock-reset</v-icon>
                  </template>
                  <v-list-item-title style="font-size: 14px;">Reset Password</v-list-item-title>
                </v-list-item>
                <v-list-item @click="handleLogout" class="rounded-lg">
                  <template v-slot:prepend>
                    <v-icon size="16">mdi-logout</v-icon>
                  </template>
                  <v-list-item-title style="font-size: 14px;">Sign Out</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>

            <template v-if="!authStore.user">
              <v-btn to="/login" variant="outlined" class="rounded-lg px-5 btn-outline" height="38"
                style="font-size: 14px;">Sign In</v-btn>
              <v-btn to="/register" class="rounded-lg px-5 btn-primary" height="38"
                style="font-size: 14px; margin-left: 6px;">Register Free</v-btn>
            </template>
          </div>

          <!-- Notification bell -->
          <div v-if="authStore.user" class="d-flex align-center ml-2">
            <v-menu :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-btn icon v-bind="props" variant="text" class="rounded-lg" size="38"
                  style="color: var(--text-muted);" @click="requestBrowserNotifications()">
                  <v-badge :content="unreadCount" :model-value="unreadCount > 0" color="error" size="x-small">
                    <v-icon size="20">mdi-bell-outline</v-icon>
                  </v-badge>
                </v-btn>
              </template>
              <v-list width="340" class="rounded-xl pa-0 mt-2"
                style="background: var(--bg-card); border: 1px solid var(--border-color); max-height: 440px; overflow-y: auto;">
                <div
                  class="pa-4 d-flex align-center justify-space-between"
                  style="border-bottom: 1px solid var(--border-color);">
                  <span style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Notifications</span>
                  <v-btn variant="text" size="x-small" @click="markAllRead"
                    style="color: var(--accent); font-weight: 600;">Clear all</v-btn>
                </div>

                <!-- Browser notification permission prompt -->
                <div v-if="!browserNotifGranted && !browserNotifAsked"
                  class="pa-3 d-flex align-center justify-space-between"
                  style="background: rgba(251,191,36,0.08); border-bottom: 1px solid var(--border-color);">
                  <div style="font-size: 12px; color: var(--text-2);">
                    <v-icon size="14" class="mr-1">mdi-bell-ring-outline</v-icon>
                    Enable browser notifications?
                  </div>
                  <v-btn variant="tonal" size="x-small" @click="requestBrowserNotifications"
                    style="background: var(--accent); color: #000; font-weight: 700;">Enable</v-btn>
                </div>

                <v-list-item v-if="notifications.length === 0" class="text-center py-8">
                  <v-icon icon="mdi-bell-off-outline" size="32" color="grey" class="mb-2"></v-icon>
                  <div style="font-size: 13px; color: var(--text-muted);">No notifications yet</div>
                </v-list-item>
                <v-list-item v-for="n in notifications" :key="n.id" class="py-3 px-4 border-b">
                  <template v-slot:prepend>
                    <v-avatar
                      :color="n.type === 'outbid' || n.type === 'OUTBID' ? 'error' : n.type === 'wallet' ? 'success' : n.type === 'support' ? 'info' : n.type === 'dispute' ? 'warning' : 'info'"
                      variant="tonal" size="36"
                      class="rounded-lg mr-4">
                      <v-icon :icon="n.icon || 'mdi-information-outline'" size="18"></v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title style="font-size: 13px; font-weight: 600; color: var(--text-primary);">
                    {{ n.title || 'Notification' }}
                  </v-list-item-title>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">{{ n.message }}</div>
                  <v-list-item-subtitle style="font-size: 11px; color: var(--text-3); margin-top: 4px;">
                    {{ fmtTime(n.createdAt) }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>

          <!-- Mobile hamburger -->
          <div class="d-flex d-lg-none align-center" style="gap: 8px;">
            <v-btn icon @click="toggleDark" variant="text" size="36" style="color: var(--text-muted);">
              <v-icon size="18">{{ isDark ? 'mdi-weather-sunny' : themeMode==='system' ? 'mdi-monitor' : 'mdi-weather-night' }}</v-icon>
            </v-btn>
            <v-btn v-if="!isAuthPage" icon @click="drawer = !drawer" variant="text" size="38"
              style="color: var(--text-primary);">
              <v-icon size="20">mdi-menu</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Admin sub-nav row (only on admin page for staff) -->
        <div v-if="isStaff && isOnAdminPage" class="admin-subnav d-none d-md-flex">
          <div class="admin-subnav-scroll">
            <button v-for="t in adminTabs" :key="t.id"
              class="admin-subnav-btn"
              :class="{ 'admin-subnav-btn--active': $route.query.tab === t.id || (!$route.query.tab && t.id === 'overview') }"
              @click="$router.replace({ query: { tab: t.id } })">
              {{ t.label }}
            </button>
          </div>
        </div>
      </v-container>
    </v-app-bar>

    <!-- Main Content -->
    <v-main style="background-color: var(--bg-page);" :style="`padding-top: ${isStaff && isOnAdminPage ? 106 : 64}px`">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>

    <!-- Footer -->
    <v-footer v-if="!isAuthPage"
      style="background-color: var(--bg-card); border-top: 1px solid var(--border-color); padding: 24px 16px;">
      <v-container style="max-width: 1280px; margin: 0 auto;" fluid>
        <div class="d-flex flex-wrap align-center justify-space-between" style="gap: 16px;">
          <div class="d-flex align-center" style="gap: 8px;">
            <div
              style="width: 24px; height: 24px; background: var(--accent); border-radius: 6px; display: flex; align-items: center; justify-content: center;">
              <v-icon icon="mdi-gavel" color="white" size="13"></v-icon>
            </div>
            <span style="font-family: 'DM Serif Display', serif; color: var(--text-primary); font-size: 16px;">BidWars</span>
            <span style="color: var(--text-muted); font-size: 13px;">© 2026</span>
          </div>
          <div class="d-flex" style="gap: 24px;">
            <router-link to="/terms" style="color: var(--text-muted); font-size: 13px; text-decoration: none;">Terms</router-link>
            <router-link to="/privacy" style="color: var(--text-muted); font-size: 13px; text-decoration: none;">Privacy</router-link>
            <router-link v-if="!isStaff" to="/support" style="color: var(--text-muted); font-size: 13px; text-decoration: none;">Support</router-link>
          </div>
        </div>
      </v-container>
    </v-footer>

    <NotificationToast />
    <SubscriptionModal
      v-model="showSubscriptionModal"
      :context="subscriptionTriggerContext"
    />

    <FloatingChat v-if="authStore.user && !isStaff" />
  </v-app>
</template>

<style scoped>
@keyframes float-pulse {
  0% { transform: translateY(0); box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3); }
  50% { transform: translateY(-4px); box-shadow: 0 12px 35px rgba(212, 175, 55, 0.5); }
  100% { transform: translateY(0); box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3); }
}

.page-enter-active, .page-leave-active { transition: opacity 0.2s ease; }
.page-enter-from, .page-leave-to { opacity: 0; }
:deep(.theme-active) { background: var(--bg-subtle) !important; }
:deep(.btn-outline) { border-color: var(--border-md) !important; color: var(--text-primary) !important; }
:deep(.btn-primary) { background: var(--gold) !important; color: #000 !important; }

/* Admin role badge */
.admin-role-badge {
  font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
  background: var(--accent); color: #000;
  padding: 3px 10px; border-radius: 20px;
  text-transform: uppercase;
}

/* Admin sub-navigation bar */
.admin-subnav {
  height: 42px; width: 100%; padding: 0 16px;
  border-top: 1px solid var(--border-color);
  display: flex; align-items: center;
  overflow-x: auto; gap: 2px;
  -ms-overflow-style: none; scrollbar-width: none;
}
.admin-subnav::-webkit-scrollbar { display: none; }
.admin-subnav-scroll {
  display: flex; gap: 2px; flex: 1;
}
.admin-subnav-btn {
  padding: 6px 14px; border-radius: 8px; border: none;
  background: transparent; color: var(--text-muted);
  font-family: inherit; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.admin-subnav-btn:hover { background: var(--bg-raised); color: var(--text-primary); }
.admin-subnav-btn--active {
  background: var(--accent-soft); color: var(--accent); font-weight: 700;
}

/* Sliding Theme Switcher */
.theme-switcher {
  position: relative; display: flex; background: var(--bg-raised);
  border-radius: 12px; padding: 4px; gap: 4px; margin-bottom: 24px;
}
.theme-switcher__slider {
  position: absolute; top: 4px; bottom: 4px; left: 4px;
  width: calc(33.33% - 5.33px); background: var(--gold);
  border-radius: 8px; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
}
.theme-switcher__btn {
  position: relative; flex: 1; padding: 10px 0; border: none; background: transparent;
  color: var(--text-3); font-size: 11px; font-weight: 700; text-transform: uppercase;
  cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px;
  transition: color 0.2s; z-index: 1;
}
.theme-switcher__btn--active { color: #000; }

/* MINI THEME SWITCHER */
.theme-switcher--mini { margin-bottom: 0; padding: 2px; border-radius: 8px; }
.theme-switcher--mini .theme-switcher__slider { border-radius: 6px; box-shadow: none; width: calc(33.33% - 2.66px); top: 2px; bottom: 2px; left: 2px; }
.theme-switcher--mini .theme-switcher__btn { padding: 8px 0; }
.theme-switcher--mini .theme-switcher__btn { color: var(--text-muted); }
.theme-switcher--mini .theme-switcher__btn--active { color: #000; }

/* Mobile admin tabs in drawer */
@media (max-width: 959px) {
  .admin-subnav { display: none !important; }
}
</style>