<template>
  <div style="min-height: 100vh; background: var(--bg-page); display: flex; align-items: center; justify-content: center; padding: 24px 16px;">
    <div style="width: 100%; max-width: 960px; display: flex; background: var(--bg-card); border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: var(--shadow-xl);" class="animate-in">

      <!-- Left Panel -->
      <div style="flex: 1; background: linear-gradient(135deg, #1a1a18 0%, #2d2d28 100%); padding: 48px; display: none; flex-direction: column; justify-content: space-between; min-height: 560px;" class="d-none d-md-flex">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 48px;">
            <div style="width: 36px; height: 36px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              <v-icon size="20" color="white">mdi-gavel</v-icon>
            </div>
            <span style="font-family: 'DM Serif Display', serif; color: white; font-size: 22px;">BidWars</span>
          </div>

          <h2 style="font-family: 'DM Serif Display', serif; font-size: 36px; color: white; line-height: 1.2; margin: 0 0 16px; font-weight: 400;">
            Win auctions. Discover rare finds.
          </h2>
          <p style="color: rgba(255,255,255,0.55); font-size: 15px; line-height: 1.7; margin: 0;">
            Join thousands of bidders competing for authenticated items every day.
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div v-for="feat in features" :key="feat.text" style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.08); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <v-icon size="16" style="color: rgba(255,255,255,0.6);">{{ feat.icon }}</v-icon>
            </div>
            <span style="color: rgba(255,255,255,0.65); font-size: 14px;">{{ feat.text }}</span>
          </div>
        </div>
      </div>

      <!-- Right: Form -->
      <div style="flex: 1; padding: 48px; display: flex; flex-direction: column; justify-content: center; min-width: 320px;">
        <div style="margin-bottom: 32px;">
          <!-- Mobile logo -->
          <div class="d-flex d-md-none align-center" style="gap: 8px; margin-bottom: 32px;">
            <div style="width: 30px; height: 30px; background: var(--accent); border-radius: 7px; display: flex; align-items: center; justify-content: center;">
              <v-icon size="16" color="white">mdi-gavel</v-icon>
            </div>
            <span style="font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--text-primary);">BidWars</span>
          </div>

          <h1 style="font-family: 'DM Serif Display', serif; font-size: 30px; color: var(--text-primary); margin: 0 0 8px; font-weight: 400;">Welcome back</h1>
          <p style="color: var(--text-muted); font-size: 14px; margin: 0;">Sign in to continue bidding</p>
        </div>

        <form @submit.prevent="handleLogin" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Email address</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              required
              style="width: 100%; padding: 11px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 15px; outline: none; transition: border-color 0.15s; font-family: 'DM Sans', sans-serif;"
              @focus="$event.target.style.borderColor = 'var(--accent)'"
              @blur="$event.target.style.borderColor = 'var(--border-color)'"
            />
          </div>

          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Password</label>
            <input
              v-model="password"
              :type="showPass ? 'text' : 'password'"
              placeholder="••••••••"
              required
              style="width: 100%; padding: 11px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 15px; outline: none; transition: border-color 0.15s; font-family: 'DM Sans', sans-serif;"
              @focus="$event.target.style.borderColor = 'var(--accent)'"
              @blur="$event.target.style.borderColor = 'var(--border-color)'"
            />
            <button type="button" @click="showPass = !showPass" style="background: none; border: none; color: var(--text-muted); font-size: 12px; cursor: pointer; margin-top: 4px; font-family: 'DM Sans', sans-serif;">
              {{ showPass ? 'Hide' : 'Show' }} password
            </button>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--text-secondary);">
              <input type="checkbox" style="accent-color: var(--accent);" /> Remember me
            </label>
            <a href="#" style="font-size: 13px; color: var(--accent); text-decoration: none; font-weight: 500;">Forgot password?</a>
          </div>

          <button
            type="submit"
            :disabled="loading"
            style="width: 100%; background: var(--accent); color: white; border: none; padding: 13px; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.15s; font-family: 'DM Sans', sans-serif; margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 8px;"
            :style="loading ? 'opacity: 0.7; cursor: not-allowed;' : ''"
          >
            <v-progress-circular v-if="loading" size="16" width="2" indeterminate color="white"></v-progress-circular>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p style="text-align: center; margin-top: 24px; font-size: 14px; color: var(--text-muted);">
          New to BidWars?
          <router-link to="/register" style="color: var(--accent); font-weight: 600; text-decoration: none; margin-left: 4px;">Create free account →</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'
import { useNotification } from '../services/notification'

const email = ref('')
const password = ref('')
const loading = ref(false)
const showPass = ref(false)
const authStore = useAuthStore()
const router = useRouter()
const notification = useNotification()

const features = [
  { icon: 'mdi-shield-check', text: 'Every item is authenticated' },
  { icon: 'mdi-lightning-bolt', text: 'Real-time bidding updates' },
  { icon: 'mdi-lock-outline', text: 'Secure escrow payments' },
  { icon: 'mdi-trophy-outline', text: 'Win exclusive collectibles' },
]

const handleLogin = async () => {
  loading.value = true
  try {
    const success = await authStore.login(email.value, password.value)
    if (success) {
      notification.add('Welcome back! You\'re signed in.', 'success')
      router.push('/')
    } else {
      notification.add('Incorrect email or password.', 'error')
    }
  } catch {
    notification.add('Something went wrong. Try again.', 'error')
  } finally {
    loading.value = false
  }
}
</script>