<template>
  <div style="min-height: 100vh; background: var(--bg-page); display: flex; align-items: center; justify-content: center; padding: 24px 16px;">
    <div style="width: 100%; max-width: 960px; display: flex; background: var(--bg-card); border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: var(--shadow-xl);" class="animate-in">

      <!-- Left Panel -->
      <div style="flex: 1; background: linear-gradient(135deg, #1a1a18 0%, #2d2d28 100%); padding: 48px; display: none; flex-direction: column; justify-content: space-between;" class="d-none d-md-flex">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 48px;">
            <div style="width: 36px; height: 36px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              <v-icon size="20" color="white">mdi-gavel</v-icon>
            </div>
            <span style="font-family: 'DM Serif Display', serif; color: white; font-size: 22px;">BidWars</span>
          </div>

          <h2 style="font-family: 'DM Serif Display', serif; font-size: 36px; color: white; line-height: 1.2; margin: 0 0 16px; font-weight: 400;">
            Join 50,000+ bidders worldwide
          </h2>
          <p style="color: rgba(255,255,255,0.55); font-size: 15px; line-height: 1.7; margin: 0 0 36px;">
            Get instant access to live auctions across art, watches, vehicles, and more.
          </p>

          <div style="background: rgba(255,255,255,0.06); border-radius: 12px; padding: 20px;">
            <div style="color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">New member bonus</div>
            <div style="color: white; font-size: 28px; font-family: 'DM Serif Display', serif; margin-bottom: 4px;">₹5,000</div>
            <div style="color: rgba(255,255,255,0.5); font-size: 13px;">Free credits added to your wallet</div>
          </div>
        </div>

        <div style="color: rgba(255,255,255,0.3); font-size: 12px;">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>

      <!-- Right: Form -->
      <div style="flex: 1; padding: 48px; display: flex; flex-direction: column; justify-content: center; min-width: 320px;">
        <div style="margin-bottom: 32px;">
          <div class="d-flex d-md-none align-center" style="gap: 8px; margin-bottom: 32px;">
            <div style="width: 30px; height: 30px; background: var(--accent); border-radius: 7px; display: flex; align-items: center; justify-content: center;">
              <v-icon size="16" color="white">mdi-gavel</v-icon>
            </div>
            <span style="font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--text-primary);">BidWars</span>
          </div>

          <h1 style="font-family: 'DM Serif Display', serif; font-size: 30px; color: var(--text-primary); margin: 0 0 8px; font-weight: 400;">Create your account</h1>
          <p style="color: var(--text-muted); font-size: 14px; margin: 0;">Free to join. Start bidding in minutes.</p>
        </div>

        <form @submit.prevent="handleRegister" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Display name</label>
            <input
              v-model="username"
              type="text"
              placeholder="How others see you"
              required
              style="width: 100%; padding: 11px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 15px; outline: none; transition: border-color 0.15s; font-family: 'DM Sans', sans-serif;"
              @focus="$event.target.style.borderColor = 'var(--accent)'"
              @blur="$event.target.style.borderColor = 'var(--border-color)'"
            />
          </div>

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
              type="password"
              placeholder="At least 8 characters"
              required
              style="width: 100%; padding: 11px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 15px; outline: none; transition: border-color 0.15s; font-family: 'DM Sans', sans-serif;"
              @focus="$event.target.style.borderColor = 'var(--accent)'"
              @blur="$event.target.style.borderColor = 'var(--border-color)'"
            />
          </div>

          <div style="background: var(--bg-elevated); border-radius: 8px; padding: 14px; display: flex; align-items: flex-start; gap: 10px; border: 1px solid var(--border-color);">
            <v-icon size="18" style="color: var(--success); flex-shrink: 0; margin-top: 1px;">mdi-gift-outline</v-icon>
            <div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">₹5,000 welcome bonus</div>
              <div style="font-size: 12px; color: var(--text-muted);">Added to your wallet immediately after signup</div>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            style="width: 100%; background: var(--accent); color: white; border: none; padding: 13px; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.15s; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px;"
            :style="loading ? 'opacity: 0.7; cursor: not-allowed;' : ''"
          >
            <v-progress-circular v-if="loading" size="16" width="2" indeterminate color="white"></v-progress-circular>
            {{ loading ? 'Creating account...' : 'Create Free Account' }}
          </button>
        </form>

        <p style="text-align: center; margin-top: 24px; font-size: 14px; color: var(--text-muted);">
          Already have an account?
          <router-link to="/login" style="color: var(--accent); font-weight: 600; text-decoration: none; margin-left: 4px;">Sign in →</router-link>
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

const username = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const authStore = useAuthStore()
const router = useRouter()
const notification = useNotification()

const handleRegister = async () => {
  loading.value = true
  try {
    const success = await authStore.register(email.value, password.value, username.value)
    if (success) {
      notification.add('Account created! ₹5,000 added to your wallet.', 'success')
      router.push('/')
    } else {
      notification.add('Email already in use. Try signing in.', 'error')
    }
  } catch {
    notification.add('Something went wrong. Please try again.', 'error')
  } finally {
    loading.value = false
  }
}
</script>