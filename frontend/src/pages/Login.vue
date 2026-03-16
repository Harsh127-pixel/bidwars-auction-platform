<template>
  <div class="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-base">
    <div class="max-w-md w-full">
      <div class="text-center mb-12">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-500/40 mb-8 rotate-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 class="text-5xl font-black tracking-tighter mb-4 italic">Welcome <span class="text-indigo-600 not-italic">Back</span></h1>
        <p class="text-secondary-custom font-medium">Secure access to your bidding portfolio.</p>
      </div>

      <div class="bg-surface p-10 rounded-[3rem] border border-subtle-custom shadow-xl">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div v-if="error" class="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 flex items-center gap-3">
             <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
             <p class="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">{{ error }}</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-black text-muted-custom uppercase tracking-[0.2em] mb-2 px-1">Identity</label>
              <input v-model="email" type="email" placeholder="email@address.com" class="w-full bg-base border border-subtle-custom rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all">
            </div>
            
            <div>
              <label class="block text-[10px] font-black text-muted-custom uppercase tracking-[0.2em] mb-2 px-1">Passkey</label>
              <input v-model="password" type="password" placeholder="••••••••" class="w-full bg-base border border-subtle-custom rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all">
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
          >
            <span v-if="loading" class="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ loading ? 'VERIFYING...' : 'AUTHORIZE ACCESS' }}
          </button>
        </form>

        <div class="mt-10 pt-10 border-t border-subtle-custom text-center">
          <p class="text-sm font-medium text-muted-custom">
            No portfolio yet? 
            <router-link to="/register" class="text-indigo-600 dark:text-indigo-400 font-black hover:underline ml-1">Establish Rank</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    await authStore.login(email.value, password.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = 'Invalid email or password'
  } finally {
    loading.value = false
  }
}
</script>
