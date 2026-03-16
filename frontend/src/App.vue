<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from './store/auth'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import NotificationToast from './components/NotificationToast.vue'

const authStore = useAuthStore()
const router = useRouter()
const theme = useTheme()

const isDark = ref(localStorage.getItem('theme') === 'dark')
const drawer = ref(false)

const toggleDark = () => {
  isDark.value = !isDark.value
}

// Global theme sync
watch(isDark, (val) => {
  theme.global.name.value = val ? 'dark' : 'light'
  if (val) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('theme', val ? 'dark' : 'light')
}, { immediate: true })

const handleLogout = async () => {
  if (confirm("Terminate secure session?")) {
    await authStore.logout()
    router.push('/login')
  }
}

onMounted(() => {
  authStore.init()
})
</script>

<template>
  <v-app class="institutional-shell">
    <!-- Luxury HUD Layer -->
    <div class="fixed inset-0 hud-overlay z-0 opacity-40"></div>

    <!-- Mobile Drawer Engine -->
    <v-navigation-drawer
      v-model="drawer"
      temporary
      location="right"
      class="glass border-l border-subtle"
      width="320"
    >
      <div class="pa-12 d-flex flex-column h-100">
        <div class="mb-12">
          <p class="text-[9px] font-weight-black text-primary tracking-[0.4em] uppercase mb-2">Protocol</p>
          <h3 class="text-h4 font-weight-black italic tracking-tighter">Mobile <span class="text-primary">Command</span></h3>
        </div>

        <div class="d-flex flex-column gap-2 mb-auto">
          <v-btn to="/auctions" variant="text" block class="justify-start rounded-xl px-6 h-56" active-color="primary" @click="drawer = false">
            <v-icon start icon="mdi-gavel" class="mr-4"></v-icon>
            Market Tenders
          </v-btn>
          <v-btn v-if="authStore.role === 'bidder'" to="/dashboard" variant="text" block class="justify-start rounded-xl px-6 h-56" active-color="primary" @click="drawer = false">
            <v-icon start icon="mdi-view-dashboard-outline" class="mr-4"></v-icon>
            Portfolio
          </v-btn>
          <v-btn v-if="authStore.user" to="/wallet" variant="text" block class="justify-start rounded-xl px-6 h-56" active-color="primary" @click="drawer = false">
            <v-icon start icon="mdi-wallet-outline" class="mr-4"></v-icon>
            Wealth Ledger
          </v-btn>
          <v-btn v-if="authStore.user" to="/profile" variant="text" block class="justify-start rounded-xl px-6 h-56" active-color="primary" @click="drawer = false">
            <v-icon start icon="mdi-account-circle-outline" class="mr-4"></v-icon>
            Identity Profile
          </v-btn>
          <v-divider class="my-6 border-subtle opacity-10"></v-divider>
          <v-btn v-if="authStore.role === 'admin'" to="/admin" variant="flat" color="primary" block class="rounded-xl h-56 shadow-lg" prepend-icon="mdi-shield-crown" @click="drawer = false">ADMIN PANEL</v-btn>
        </div>

        <div class="pt-8 border-t border-subtle">
          <v-btn @click="toggleDark" block variant="tonal" class="rounded-xl h-48 mb-4" :color="isDark ? 'warning' : 'primary'">
            <v-icon start :icon="isDark ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'"></v-icon>
            {{ isDark ? 'Luminous Mode' : 'Stealth Mode' }}
          </v-btn>
          
          <template v-if="!authStore.user">
            <v-btn v-if="$route.name !== 'Login' && $route.name !== 'Register'" to="/login" block variant="flat" color="primary" class="rounded-xl h-56 shadow-lg" @click="drawer = false">SIGN IN</v-btn>
          </template>
          <v-btn v-else @click="handleLogout" block variant="outlined" color="primary" class="rounded-xl h-56">TERMINATE SESSION</v-btn>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- Premium Command Bar -->
    <v-app-bar 
      elevation="0" 
      class="glass border-b border-subtle z-50"
      height="80"
      fixed
    >
      <v-container class="d-flex align-center px-6 fill-height" fluid>
        <!-- Logo Architecture -->
        <router-link to="/" class="d-flex align-center gap-4 text-decoration-none active-scale-95 transition-all group">
          <v-avatar color="primary" class="rounded-xl shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-500" size="44">
            <v-icon icon="mdi-gavel" color="white" size="24"></v-icon>
          </v-avatar>
          <div class="d-flex flex-column">
            <span class="text-h5 font-weight-black text-primary tracking-tighter leading-none mb-0.5">
              Bid<span class="text-primary opacity-60">Wars</span> 
            </span>
            <span class="text-[9px] font-weight-bold text-muted-custom tracking-[0.3em] uppercase opacity-60 leading-none">Elite Marketplace</span>
          </div>
        </router-link>

        <v-spacer></v-spacer>

        <!-- Desktop Navigation Engine -->
        <div class="hidden lg:flex align-center gap-2">
          <div class="d-flex align-center bg-grey-lighten-4 rounded-pill pa-1 gap-1 border border-subtle mr-6">
            <v-btn to="/auctions" variant="text" class="rounded-pill px-6" active-color="primary">Market</v-btn>
            <v-btn v-if="authStore.role === 'bidder'" to="/dashboard" variant="text" class="rounded-pill px-6" active-color="primary">Portfolio</v-btn>
            <v-btn v-if="authStore.user" to="/wallet" variant="text" class="rounded-pill px-6" active-color="primary">Wallet</v-btn>
            <v-btn v-if="authStore.user" to="/profile" variant="text" class="rounded-pill px-6" active-color="primary">Profile</v-btn>
          </div>

          <div class="d-flex align-center gap-2 pl-6 border-l border-subtle">
            <v-btn v-if="authStore.role === 'admin'" to="/admin" variant="flat" color="primary" class="rounded-pill px-6 shadow-md" prepend-icon="mdi-shield-crown">ADMIN</v-btn>
            
            <v-btn icon @click="toggleDark" class="rounded-xl" variant="text">
              <v-icon :icon="isDark ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'" :color="isDark ? 'warning' : 'primary'"></v-icon>
            </v-btn>

            <template v-if="!authStore.user && $route.name !== 'Login' && $route.name !== 'Register'">
              <v-btn to="/login" variant="flat" color="primary" class="rounded-pill px-8 shadow-lg h-48" elevation="12">SIGN IN</v-btn>
            </template>
            <v-btn v-else @click="handleLogout" variant="tonal" class="rounded-pill pr-2 pl-4 gap-3 h-48" color="primary">
               <span class="text-caption font-weight-black opacity-80 uppercase tracking-widest">{{ authStore.user?.username }}</span>
               <v-avatar color="primary" size="32" class="font-weight-black text-caption shadow-sm">
                 {{ (authStore.user?.username || 'J')[0].toUpperCase() }}
               </v-avatar>
            </v-btn>
          </div>
        </div>

        <!-- Mobile Command Toggle -->
        <v-btn icon color="primary" variant="tonal" class="rounded-xl lg-hidden" @click="drawer = !drawer">
          <v-icon icon="mdi-menu-variant"></v-icon>
        </v-btn>
      </v-container>
    </v-app-bar>

    <!-- Main Viewport Context -->
    <v-main class="relative z-10 min-vh-100 px-0">
      <router-view v-slot="{ Component }">
        <transition name="page-transition" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>

    <!-- Institutional Footer Foundation -->
    <v-footer v-if="$route.name !== 'Login' && $route.name !== 'Register'" class="bg-surface border-t border-subtle py-8 relative z-10" app order="1">
      <v-container class="px-6" fluid>
        <v-row align="center" justify="space-between" class="gap-y-6">
          <v-col cols="12" md="auto">
            <div class="d-flex align-center gap-6">
              <div class="d-flex align-center gap-3">
                 <v-icon icon="mdi-shield-check" color="primary" size="20"></v-icon>
                 <span class="text-[10px] font-weight-black text-primary tracking-[0.2em] uppercase">Trusted Exchange</span>
              </div>
              <div class="h-4 w-px bg-border-subtle hidden md-block"></div>
              <span class="text-[10px] font-weight-bold text-muted-custom opacity-70">© 2026 BidWars Institutional Core. All rights reserved.</span>
            </div>
          </v-col>
          <v-col cols="12" md="auto">
            <div class="d-flex gap-8 justify-center justify-md-end">
              <a href="#" class="text-[10px] font-weight-black text-muted-custom hover-text-primary text-decoration-none tracking-widest uppercase">Protocol</a>
              <a href="#" class="text-[10px] font-weight-black text-muted-custom hover-text-primary text-decoration-none tracking-widest uppercase">Security</a>
              <a href="#" class="text-[10px] font-weight-black text-muted-custom hover-text-primary text-decoration-none tracking-widest uppercase">Audit</a>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>

    <NotificationToast />
  </v-app>
</template>

<style scoped>
.institutional-shell {
  background-color: var(--bg-page) !important;
}

.min-vh-100 {
  min-height: 100vh;
}

.lg-hidden {
  display: none !important;
}

@media (max-width: 1280px) {
  .lg-hidden {
    display: flex !important;
  }
}

/* Page Transition Mechanics */
.page-transition-enter-active,
.page-transition-leave-active {
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.hover-text-primary:hover {
  color: rgb(var(--v-theme-primary)) !important;
}

.bg-border-subtle {
  background-color: var(--border-subtle);
}

.active-scale-95:active {
  transform: scale(0.95);
}
</style>

<style>
/* Reset and Global Polish */
.v-application__wrap {
  min-height: 100vh !important;
}

.v-btn--active::before {
  opacity: 0.1 !important;
}

.text-lowercase { text-transform: lowercase !important; }
.text-uppercase { text-transform: uppercase !important; }
.text-capitalize { text-transform: capitalize !important; }
.italic { font-style: italic !important; }
.not-italic { font-style: normal !important; }
</style>
