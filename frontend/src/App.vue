<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useAuthStore } from './store/auth'
import { useRouter, useRoute } from 'vue-router'
import { useNotification } from './services/notification'
import NotificationToast from './components/NotificationToast.vue'

const authStore = useAuthStore()
const notification = useNotification()
const router = useRouter()
const route = useRoute()

const isDark = ref(localStorage.getItem('theme') === 'dark')
const drawer = ref(false)

watch(isDark, (val) => {
  if (val) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('theme', val ? 'dark' : 'light')
}, { immediate: true })

const toggleDark = () => { isDark.value = !isDark.value }

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const isAuthPage = computed(() => ['Login', 'Register'].includes(route.name) || route.path.includes('/login') || route.path.includes('/register'))

const notifications = ref([])
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const markAllRead = () => {
  notifications.value.forEach(n => n.read = true)
}

onMounted(() => {
  authStore.init()
  
  // High-level system notifications
  import('./services/socket').then(({ default: socket }) => {
    socket.on('bidUpdate', (data) => {
      // If we are outbid (and we were the previous leader)
      // This logic is simplified for demo; usually backend pushes specific 'outbid' event
      if (data.previousBidder === authStore.user?.uid && data.userId !== authStore.user?.uid) {
         notifications.value.unshift({
           id: Date.now(),
           title: `Outbid in Lot ${data.auctionId.slice(0,6)}`,
           time: 'Just now',
           icon: 'mdi-gavel',
           type: 'outbid',
           read: false
         })
         notification.add("High Alert: You have been outbid!", "error")
      }
    })

    socket.on('biddingStopped', (data) => {
      notifications.value.unshift({
        id: Date.now(),
        title: data.status === 'closed' ? `Auction Room Finalized` : `Asset Withdrawn`,
        time: 'Just now',
        icon: data.status === 'closed' ? 'mdi-trophy-outline' : 'mdi-alert-circle-outline',
        type: 'info',
        read: false
      })
    })
  })
})

const handleAuctionsClick = async () => {
  if (!authStore.user) {
    // Demo Auto-Login for convenience
    try {
      await authStore.login('bhojwaniharsh213@gmail.com', 'password123')
      notification.add('Authenticated automatically.', 'success')
    } catch (e) {
      console.warn("Auto-login skip: missing or invalid test credentials", e)
    }
  }
  router.push('/auctions')
}
</script>

<template>
  <v-app :theme="isDark ? 'dark' : 'light'" :class="isDark ? 'dark' : ''">
    <!-- Mobile Drawer -->
    <v-navigation-drawer v-model="drawer" temporary location="right" width="300" style="background-color: var(--bg-card); border-left: 1px solid var(--border-color);">
      <div class="pa-5">
        <div class="d-flex align-center justify-space-between mb-6">
          <div class="d-flex align-center gap-2">
            <span style="font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--text-primary);">BidWars</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="drawer = false" style="color: var(--text-muted);"></v-btn>
        </div>

        <div class="d-flex flex-column gap-1">
          <v-btn to="/auctions" variant="text" block class="justify-start rounded-lg px-4" height="44" style="color: var(--text-secondary); font-weight: 500;" @click="drawer = false">
            <v-icon start size="18">mdi-gavel</v-icon>
            Browse Auctions
          </v-btn>
          <v-btn v-if="authStore.role === 'bidder' && !isAuthPage" to="/dashboard" variant="text" block class="justify-start rounded-lg px-4" height="44" style="color: var(--text-secondary); font-weight: 500;" @click="drawer = false">
            <v-icon start size="18">mdi-view-dashboard-outline</v-icon>
            My Dashboard
          </v-btn>
          <v-btn v-if="authStore.user && !isAuthPage" to="/wallet" variant="text" block class="justify-start rounded-lg px-4" height="44" style="color: var(--text-secondary); font-weight: 500;" @click="drawer = false">
            <v-icon start size="18">mdi-wallet-outline</v-icon>
            Wallet
          </v-btn>
          <v-btn v-if="authStore.user && !isAuthPage" to="/profile" variant="text" block class="justify-start rounded-lg px-4" height="44" style="color: var(--text-secondary); font-weight: 500;" @click="drawer = false">
            <v-icon start size="18">mdi-account-outline</v-icon>
            Profile
          </v-btn>
          <v-btn v-if="authStore.role === 'admin' && !isAuthPage" to="/admin" variant="text" block class="justify-start rounded-lg px-4" height="44" style="color: var(--accent);" @click="drawer = false">
            <v-icon start size="18">mdi-shield-crown-outline</v-icon>
            Admin Panel
          </v-btn>
        </div>

        <v-divider class="my-4" style="border-color: var(--border-color);"></v-divider>

        <div class="d-flex flex-column gap-2">
          <v-btn @click="toggleDark" variant="tonal" block class="rounded-lg" height="44" style="background: var(--bg-subtle); color: var(--text-secondary);">
            <v-icon start size="18">{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
            {{ isDark ? 'Light Mode' : 'Dark Mode' }}
          </v-btn>

          <template v-if="!authStore.user">
            <v-btn to="/login" variant="outlined" block class="rounded-lg btn-outline" height="44" @click="drawer = false">Sign In</v-btn>
            <v-btn to="/register" block class="rounded-lg btn-primary" height="44" @click="drawer = false">Register Free</v-btn>
          </template>
          <v-btn v-else @click="handleLogout; drawer = false" variant="outlined" block class="rounded-lg btn-outline" height="44">
            Sign Out
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- Top Navigation Bar -->
    <v-app-bar elevation="0" height="64" fixed style="background-color: var(--bg-card) !important; border-bottom: 1px solid var(--border-color) !important; z-index: 100;">
      <v-container class="d-flex align-center px-4 fill-height" style="max-width: 1280px; margin: 0 auto;" fluid>
        <!-- Logo -->
        <router-link to="/" class="d-flex align-center gap-2 text-decoration-none" style="gap: 8px;">
          <div style="width: 34px; height: 34px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <v-icon icon="mdi-gavel" color="white" size="18"></v-icon>
          </div>
          <span style="font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text-primary); letter-spacing: -0.5px; line-height: 1;">BidWars</span>
        </router-link>

        <v-spacer></v-spacer>

        <!-- Desktop Nav -->
        <div class="d-none d-lg-flex align-center" style="gap: 4px;">
          <v-btn @click="handleAuctionsClick" variant="text" class="rounded-lg px-4" height="38" style="color: var(--text-secondary); font-weight: 500; font-size: 14px;">Auctions</v-btn>
          <v-btn v-if="authStore.role === 'bidder' && !isAuthPage" to="/dashboard" variant="text" class="rounded-lg px-4" height="38" style="color: var(--text-secondary); font-weight: 500; font-size: 14px;">Dashboard</v-btn>
          <v-btn v-if="authStore.user && !isAuthPage" to="/wallet" variant="text" class="rounded-lg px-4" height="38" style="color: var(--text-secondary); font-weight: 500; font-size: 14px;">Wallet</v-btn>
          <v-btn v-if="authStore.user && !isAuthPage" to="/profile" variant="text" class="rounded-lg px-4" height="38" style="color: var(--text-secondary); font-weight: 500; font-size: 14px;">Profile</v-btn>

          <div style="width: 1px; height: 24px; background: var(--border-color); margin: 0 8px;"></div>

          <v-btn v-if="authStore.role === 'admin' && !isAuthPage" to="/admin" variant="tonal" class="rounded-lg px-4" height="38" style="background: var(--accent-soft); color: var(--accent); font-weight: 600; font-size: 13px;" prepend-icon="mdi-shield-crown-outline">Admin</v-btn>

          <v-btn icon @click="toggleDark" variant="text" class="rounded-lg" size="38" style="color: var(--text-muted);">
            <v-icon size="18">{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
          </v-btn>

          <template v-if="!authStore.user">
            <v-btn to="/login" variant="outlined" class="rounded-lg px-5 btn-outline" height="38" style="font-size: 14px;">Sign In</v-btn>
            <v-btn to="/register" class="rounded-lg px-5 btn-primary" height="38" style="font-size: 14px; margin-left: 6px;">Register Free</v-btn>
          </template>
        </div>

        <!-- Shared Icons (Always visible if logged in and not on auth page) -->
        <div v-if="authStore.user && !isAuthPage" class="d-flex align-center ml-2">
          <!-- Notifications -->
          <v-menu :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props" variant="text" class="rounded-lg" size="38" style="color: var(--text-muted);">
                <v-badge :content="unreadCount" :model-value="unreadCount > 0" color="error" size="x-small">
                  <v-icon size="20">mdi-bell-outline</v-icon>
                </v-badge>
              </v-btn>
            </template>
            <v-list width="320" class="rounded-xl border-subtle shadow-2xl pa-0 mt-2" style="background: var(--bg-card);">
              <div class="pa-4 border-b border-subtle d-flex align-center justify-space-between">
                <span class="text-subtitle-2 font-weight-black uppercase tracking-widest text-primary italic">Intelligence Feed</span>
                <v-btn variant="text" size="x-small" color="primary" class="font-weight-black" @click="markAllRead">Clear All</v-btn>
              </div>
              <v-list-item v-if="notifications.length === 0" class="text-center py-8">
                <v-icon icon="mdi-bell-off-outline" size="32" color="grey-lighten-1" class="mb-2"></v-icon>
                <div class="text-caption font-weight-bold text-muted-custom">No protocol updates</div>
              </v-list-item>
              <v-list-item v-for="n in notifications" :key="n.id" :active="!n.read" class="py-3 px-4 notification-item">
                <template v-slot:prepend>
                  <v-avatar :color="n.type === 'outbid' ? 'error' : 'info'" variant="tonal" size="36" class="rounded-lg mr-4">
                    <v-icon :icon="n.icon" size="18"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-caption font-weight-black tracking-tight leading-tight mb-1" :style="{ color: n.read ? 'var(--text-muted)' : 'var(--text-primary)' }">
                  {{ n.title }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-[10px] font-weight-medium opacity-60">
                   {{ n.time }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-menu>

          <!-- Desktop User Profile -->
          <v-btn v-if="authStore.user" variant="tonal" class="rounded-lg px-3 ml-2 d-none d-lg-flex" height="38" style="background: var(--bg-subtle); color: var(--text-primary); font-weight: 500;" @click="handleLogout">
            <v-avatar size="24" style="background: var(--accent); margin-right: 8px; border-radius: 6px;">
              <span style="color: white; font-size: 11px; font-weight: 700;">{{ (authStore.user?.username || 'U')[0].toUpperCase() }}</span>
            </v-avatar>
            {{ authStore.user?.username }}
          </v-btn>
        </div>

        <!-- Mobile Toggle -->
        <div class="d-flex d-lg-none align-center" style="gap: 8px;">
          <v-btn icon @click="toggleDark" variant="text" size="36" style="color: var(--text-muted);">
            <v-icon size="18">{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
          </v-btn>
          <v-btn v-if="!isAuthPage" icon @click="drawer = !drawer" variant="text" size="38" style="color: var(--text-primary);">
            <v-icon size="20">mdi-menu</v-icon>
          </v-btn>
        </div>
      </v-container>
    </v-app-bar>

    <!-- Main Content -->
    <v-main style="background-color: var(--bg-page); padding-top: 64px;">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>

    <!-- Footer -->
    <v-footer v-if="!isAuthPage" style="background-color: var(--bg-card); border-top: 1px solid var(--border-color); padding: 24px 16px;">
      <v-container style="max-width: 1280px; margin: 0 auto;" fluid>
        <div class="d-flex flex-wrap align-center justify-space-between" style="gap: 16px;">
          <div class="d-flex align-center" style="gap: 8px;">
            <div style="width: 24px; height: 24px; background: var(--accent); border-radius: 6px; display: flex; align-items: center; justify-content: center;">
              <v-icon icon="mdi-gavel" color="white" size="13"></v-icon>
            </div>
            <span style="font-family: 'DM Serif Display', serif; color: var(--text-primary); font-size: 16px;">BidWars</span>
            <span style="color: var(--text-muted); font-size: 13px;">© 2026</span>
          </div>
          <div class="d-flex" style="gap: 24px;">
            <a href="#" style="color: var(--text-muted); font-size: 13px; text-decoration: none;">Terms</a>
            <a href="#" style="color: var(--text-muted); font-size: 13px; text-decoration: none;">Privacy</a>
            <a href="#" style="color: var(--text-muted); font-size: 13px; text-decoration: none;">Support</a>
          </div>
        </div>
      </v-container>
    </v-footer>

    <NotificationToast />
  </v-app>
</template>

<style scoped>
.page-enter-active, .page-leave-active { transition: opacity 0.2s ease; }
.page-enter-from, .page-leave-to { opacity: 0; }

:deep(.v-btn--active) { color: var(--accent) !important; }
:deep(.v-btn--active .v-btn__content) { color: var(--accent) !important; }
</style>