<!-- FILE: frontend/src/pages/ForgotPassword.vue -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { useNotification } from '../services/notification'

const router = useRouter()
const notification = useNotification()
const email = ref('')
const loading = ref(false)
const sent = ref(false)

const handleReset = async () => {
  if (!email.value) return
  loading.value = true
  try {
    await api.post('/api/users/forgot-password', { email: email.value })
    sent.value = true
    notification.add('Password reset link sent! Check your inbox.', 'success')
  } catch (error) {
    notification.add('Failed to send reset link: ' + (error.response?.data?.error || error.message), 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card fade-up">
      <div class="auth-header">
        <h1 class="t-display t-title" style="font-size: 24px;">Reset Password</h1>
        <p class="t-body" style="color:var(--text-3);font-size:14px">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div v-if="!sent">
        <form @submit.prevent="handleReset" class="auth-form">
          <div class="field-wrap">
            <label class="field-label">Email Address</label>
            <input v-model="email" type="email" required class="field" placeholder="name@example.com" />
          </div>

          <button type="submit" class="btn btn-gold btn-lg btn-block" :disabled="loading">
            {{ loading ? 'Sending...' : 'Send Reset Link' }}
          </button>
        </form>
      </div>

      <div v-else class="success-state">
        <div class="success-icon">✉</div>
        <p>A reset link has been sent to <strong>{{ email }}</strong>. Please check your spam folder if you don't see it.</p>
        <button class="btn btn-gold btn-lg btn-block" @click="router.push('/login')">Return to Login</button>
      </div>

      <div class="auth-footer">
        <router-link to="/login" class="text-link">Back to Login</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page { display: flex; align-items: center; justify-content: center; min-height: 80vh; padding: 20px; }
.auth-card { background: var(--bg-card); border: 1px solid var(--border-md); border-radius: var(--r-md); width: 100%; max-width: 400px; padding: 40px; }
.auth-header { text-align: center; margin-bottom: 32px; }
.auth-form { display: flex; flex-direction: column; gap: 20px; }
.auth-footer { margin-top: 24px; text-align: center; font-size: 14px; color: var(--text-3); }
.text-link { color: var(--gold); font-weight: 600; text-decoration: none; }
.btn-block { width: 100%; border-radius: 8px; }

.success-state { text-align: center; display: flex; flex-direction: column; gap: 20px; align-items: center; }
.success-icon { font-size: 48px; color: var(--green); margin-bottom: 8px; }
</style>
