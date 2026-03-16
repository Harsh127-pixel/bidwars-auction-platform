<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from './store/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const isDark = ref(localStorage.getItem('theme') === 'dark')

const toggleDark = () => {
  isDark.value = !isDark.value
}

// Global theme class toggle
watch(isDark, (val) => {
  if (val) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('theme', val ? 'dark' : 'light')
}, { immediate: true })

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  authStore.init()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-base text-primary-custom transition-colors duration-500">
    <!-- Premium Navbar -->
    <nav class="sticky top-0 z-50 glass">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-20 items-center">
          <!-- Logo -->
          <router-link to="/" class="flex items-center gap-3 active:scale-95 transition-transform">
            <div class="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <span class="text-2xl font-black text-theme tracking-tight">Bid<span class="text-indigo-600">Wars</span> <span class="text-[10px] font-bold text-gray-400 align-top">v2.0</span></span>
          </router-link>
          
          <!-- Desktop Nav -->
          <div class="hidden md:flex items-center gap-10">
            <div class="flex items-center gap-8 border-r border-subtle-custom pr-10">
              <router-link to="/auctions" class="text-sm font-semibold text-secondary-custom hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Live Auctions</router-link>
              <router-link v-if="authStore.user" to="/dashboard" class="text-sm font-semibold text-secondary-custom hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Portfolio</router-link>
              <!-- DEMO MODE: Showing Admin Panel for easy access during your walkthrough -->
              <router-link v-if="authStore.user" to="/admin" class="text-sm font-bold text-indigo-600/60 hover:text-indigo-600 px-3 py-1.5 border border-indigo-600/20 rounded-xl transition-all">Admin</router-link>
            </div>
            
            <div class="flex items-center gap-6">
              <button @click="toggleDark" class="w-10 h-10 rounded-xl flex items-center justify-center text-muted-custom hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
                <svg v-if="!isDark" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                </svg>
              </button>

              <template v-if="!authStore.user">
                <router-link to="/login" class="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-95">Sign In</router-link>
              </template>
              <div v-else class="flex items-center gap-4">
                <div class="h-8 w-px border-subtle-custom"></div>
                <button @click="handleLogout" class="text-sm font-bold text-muted-custom hover:text-red-500 dark:hover:text-red-400 transition-colors">Logout</button>
              </div>
            </div>
          </div>

          <!-- Mobile Menu Button -->
          <div class="md:hidden">
             <button class="p-2 text-muted-custom">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
               </svg>
             </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-grow">
      <router-view v-slot="{ Component }">
        <transition 
          name="fade" 
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="bg-footer-custom border-t border-subtle-custom py-12 transition-colors duration-500">
      <div class="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-surface rounded-lg flex items-center justify-center border border-subtle-custom">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-muted-custom" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <span class="text-sm font-bold text-muted-custom tracking-tight">BidWars Platform Private Beta</span>
        </div>
        <p class="text-muted-custom text-xs">© 2026 BidWars. Engineered with precision.</p>
      </div>
    </footer>
  </div>
</template>

<style>
/* Global Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
