<template>
  <div class="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-base">
    <div class="max-w-md w-full">
      <div class="text-center mb-12">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-500/40 mb-8 -rotate-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 class="text-5xl font-black tracking-tighter mb-4 italic">Establish <span class="text-indigo-600 not-italic">Rank</span></h1>
        <p class="text-secondary-custom font-medium italic">Join the elite network of rare asset bidders.</p>
      </div>

      <div class="bg-surface p-10 rounded-[3rem] border border-subtle-custom shadow-xl">
        <form @submit.prevent="handleRegister" class="space-y-6">
          <div v-if="error" class="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 flex items-center gap-3">
             <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
             <p class="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">{{ error }}</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-black text-muted-custom uppercase tracking-[0.2em] mb-2 px-1">Pseudonym</label>
              <input v-model="username" type="text" placeholder="John Wick" class="w-full bg-base border border-subtle-custom rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all">
            </div>

            <div>
              <label class="block text-[10px] font-black text-muted-custom uppercase tracking-[0.2em] mb-2 px-1">Digital Mail</label>
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
            {{ loading ? 'ENROLLING...' : 'INITIATE REGISTRATION' }}
          </button>
        </form>

        <div class="mt-10 pt-10 border-t border-subtle-custom text-center">
          <p class="text-sm font-medium text-muted-custom">
            Already established? 
            <router-link to="/login" class="text-indigo-600 dark:text-indigo-400 font-black hover:underline ml-1">Re-authorize</router-link>
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
const username = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  try {
    await authStore.register(email.value, password.value, username.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = 'Registration failed. Try a different identity.'
  } finally {
    loading.value = false
  }
}
</script>
