<script setup>
import { ref, onMounted, watch } from 'vue'
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

const isAuthPage = () => ['Login', 'Register'].includes(route.name)

onMounted(() => {
  authStore.init()
  
  // High-level system notifications
  import('./services/socket').then(({ default: socket }) => {
    socket.on('biddingStopped', (data) => {
      if (data.status === 'closed') {
        notification.add(`Bidding Floor: Auction ${data.auctionId.slice(0,8)} has reached its final settlement.`, 'info')
      } else if (data.status === 'deleted') {
        notification.add(`System Alert: Asset ${data.auctionId.slice(0,8)} has been withdrawn from liquidation.`, 'warning')
      }
    })
  })
})
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
          <v-btn v-if="authStore.role === 'bidder'" to="/dashboard" variant="text" block class="justify-start rounded-lg px-4" height="44" style="color: var(--text-secondary); font-weight: 500;" @click="drawer = false">
            <v-icon start size="18">mdi-view-dashboard-outline</v-icon>
            My Dashboard
          </v-btn>
          <v-btn v-if="authStore.user" to="/wallet" variant="text" block class="justify-start rounded-lg px-4" height="44" style="color: var(--text-secondary); font-weight: 500;" @click="drawer = false">
            <v-icon start size="18">mdi-wallet-outline</v-icon>
            Wallet
          </v-btn>
          <v-btn v-if="authStore.user" to="/profile" variant="text" block class="justify-start rounded-lg px-4" height="44" style="color: var(--text-secondary); font-weight: 500;" @click="drawer = false">
            <v-icon start size="18">mdi-account-outline</v-icon>
            Profile
          </v-btn>
          <v-btn v-if="authStore.role === 'admin'" to="/admin" variant="text" block class="justify-start rounded-lg px-4" height="44" style="color: var(--accent);" @click="drawer = false">
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
          <v-btn to="/auctions" variant="text" class="rounded-lg px-4" height="38" style="color: var(--text-secondary); font-weight: 500; font-size: 14px;">Auctions</v-btn>
          <v-btn v-if="authStore.role === 'bidder'" to="/dashboard" variant="text" class="rounded-lg px-4" height="38" style="color: var(--text-secondary); font-weight: 500; font-size: 14px;">Dashboard</v-btn>
          <v-btn v-if="authStore.user" to="/wallet" variant="text" class="rounded-lg px-4" height="38" style="color: var(--text-secondary); font-weight: 500; font-size: 14px;">Wallet</v-btn>
          <v-btn v-if="authStore.user" to="/profile" variant="text" class="rounded-lg px-4" height="38" style="color: var(--text-secondary); font-weight: 500; font-size: 14px;">Profile</v-btn>

          <div style="width: 1px; height: 24px; background: var(--border-color); margin: 0 8px;"></div>

          <v-btn v-if="authStore.role === 'admin'" to="/admin" variant="tonal" class="rounded-lg px-4" height="38" style="background: var(--accent-soft); color: var(--accent); font-weight: 600; font-size: 13px;" prepend-icon="mdi-shield-crown-outline">Admin</v-btn>

          <v-btn icon @click="toggleDark" variant="text" class="rounded-lg" size="38" style="color: var(--text-muted);">
            <v-icon size="18">{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
          </v-btn>

          <template v-if="!authStore.user">
            <v-btn to="/login" variant="outlined" class="rounded-lg px-5 btn-outline" height="38" style="font-size: 14px;">Sign In</v-btn>
            <v-btn to="/register" class="rounded-lg px-5 btn-primary" height="38" style="font-size: 14px; margin-left: 6px;">Register Free</v-btn>
          </template>
          <v-btn v-else variant="tonal" class="rounded-lg px-3" height="38" style="background: var(--bg-subtle); color: var(--text-primary); font-weight: 500;" @click="handleLogout">
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
          <v-btn icon @click="drawer = !drawer" variant="text" size="38" style="color: var(--text-primary);">
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
    <v-footer v-if="!isAuthPage()" style="background-color: var(--bg-card); border-top: 1px solid var(--border-color); padding: 24px 16px;">
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