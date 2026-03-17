<!-- FILE: frontend/src/pages/AdminLogin.vue -->
<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { useRouter, useRoute } from 'vue-router'
import { useNotification } from '../services/notification'

const email    = ref('')
const password = ref('')
const roleType = ref('admin') // 'admin' | 'employee'
const loading  = ref(false)
const showPass = ref(false)
const authStore    = useAuthStore()
const router       = useRouter()
const route        = useRoute()
const notification = useNotification()

const handleLogin = async () => {
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    
    // Check if the role matches the intended staff role
    if (authStore.role === 'admin' || authStore.role === 'employee') {
      notification.add(`Welcome to the ${authStore.role === 'admin' ? 'Administration' : 'Staff'} Portal`, 'success')
      router.push('/admin')
    } else {
      // Not an admin or employee
      await authStore.logout()
      notification.add('Access denied. This portal is for staff only.', 'error')
    }
  } catch (err) {
    notification.add('Incorrect email or password.', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="brand-panel">
      <div class="brand-panel__glow"></div>
      <div class="brand-panel__inner">
        <div class="brand-logo">
          <span class="brand-logo__icon">🛡</span>
          <span class="brand-logo__name">Staff Portal</span>
        </div>
        <div class="brand-copy">
          <h1 class="brand-headline">Secure Gateway for BidWars Staff.</h1>
          <p class="brand-sub">Manage auctions, users, fulfillment, and more. Restricted access for authorized personnel only.</p>
        </div>
        <div class="brand-footer">© 2026 Internal Operations Platform</div>
      </div>
    </div>

    <div class="form-panel">
      <div class="form-wrap">
        <div class="form-head">
          <div class="form-eyebrow">Internal Access</div>
          <h2 class="form-title">Internal Sign In</h2>
          <p class="form-sub">Please select your role and enter credentials</p>
        </div>

        <form @submit.prevent="handleLogin" class="form-body">
          <div class="role-selector">
            <label class="role-opt" :class="{ 'role-opt--active': roleType === 'admin' }">
              <input v-model="roleType" type="radio" value="admin" name="role" />
              <div class="role-opt__box">
                <span class="role-icon">👑</span>
                <span class="role-name">Administrator</span>
              </div>
            </label>
            <label class="role-opt" :class="{ 'role-opt--active': roleType === 'employee' }">
              <input v-model="roleType" type="radio" value="employee" name="role" />
              <div class="role-opt__box">
                <span class="role-icon">💼</span>
                <span class="role-name">Employee</span>
              </div>
            </label>
          </div>

          <div class="field-wrap">
            <label class="field-label">Work Email</label>
            <input v-model="email" type="email" placeholder="staff@bidwars.internal" required class="field" />
          </div>

          <div class="field-wrap">
            <label class="field-label">Password</label>
            <div class="field-password-wrap">
              <input v-model="password" :type="showPass ? 'text' : 'password'"
                placeholder="••••••••" required class="field field--password" />
              <button type="button" class="field-toggle" @click="showPass = !showPass">
                {{ showPass ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          <button type="submit" class="btn-submit btn-staff" :disabled="loading">
            <span v-if="loading" class="btn-spin"></span>
            {{ loading ? 'Authenticating…' : 'Access Portal' }}
          </button>
        </form>

        <p class="form-switch">
          Regular bidder?
          <router-link to="/login">Standard Login →</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Inherit base styles from global or Login.vue but add specific staff styles */
.auth-page { display: flex; min-height: 100vh; }
.brand-panel {
  flex: 1; position: relative; overflow: hidden;
  background: #1e1e1e; border-right: 1px solid rgba(255,255,255,0.1);
  display: flex; align-items: stretch;
}
.brand-panel__glow {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 80% 60% at 20% 80%, rgba(59,130,246,0.15) 0%, transparent 60%);
}
.brand-panel__inner {
  position: relative; width: 100%;
  display: flex; flex-direction: column; gap: 40px; padding: 52px;
}
.brand-logo { display: flex; align-items: center; gap: 10px; }
.brand-logo__icon { font-size: 24px; color: #3b82f6; }
.brand-logo__name { font-family: var(--font-display); font-size: 24px; font-weight: 600; color: #fff; }

.brand-copy { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.brand-headline {
  font-family: var(--font-display); font-size: clamp(28px, 3.5vw, 48px);
  font-weight: 600; color: #fff; line-height: 1.15; margin-bottom: 20px;
}
.brand-sub { font-size: 16px; color: #a1a1aa; line-height: 1.7; }
.brand-footer { font-family: var(--font-mono); font-size: 12px; color: #52525b; }

.form-panel {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 48px; background: var(--bg);
}
.form-wrap { width: 100%; max-width: 400px; }
.form-head { margin-bottom: 36px; }
.form-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #3b82f6; margin-bottom: 12px; }
.form-title   { font-family: var(--font-display); font-size: 32px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
.form-sub     { font-size: 14px; color: var(--text-2); }

.role-selector { display: flex; gap: 12px; margin-bottom: 24px; }
.role-opt { flex: 1; cursor: pointer; position: relative; }
.role-opt input { position: absolute; opacity: 0; }
.role-opt__box {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px; background: var(--bg-card); border: 2px solid var(--border);
  border-radius: 12px; transition: all 0.2s;
}
.role-opt:hover .role-opt__box { border-color: var(--border-md); }
.role-opt--active .role-opt__box {
  border-color: #3b82f6; background: rgba(59,130,246,0.05); transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59,130,246,0.15);
}
.role-icon { font-size: 24px; }
.role-name { font-size: 12px; font-weight: 700; color: var(--text-2); }
.role-opt--active .role-name { color: #3b82f6; }

.form-body { display: flex; flex-direction: column; gap: 20px; }
.field-password-wrap { position: relative; }
.field--password { padding-right: 70px !important; }
.field-toggle {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: var(--text-3); font-size: 12px; font-weight: 600; cursor: pointer;
}

.btn-staff { background: #1e293b !important; box-shadow: 0 4px 20px rgba(15,23,42,0.3) !important; }
.btn-staff:hover:not(:disabled) { background: #0f172a !important; box-shadow: 0 8px 28px rgba(15,23,42,0.4) !important; }

.btn-submit {
  width: 100%; padding: 15px; color: #fff; border: none; border-radius: 12px;
  font-family: var(--font-body); font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all 0.2s; margin-top: 4px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
}
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-spin { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.form-switch { margin-top: 28px; text-align: center; font-size: 14px; color: var(--text-2); }
.form-switch a { color: #3b82f6; font-weight: 600; text-decoration: none; margin-left: 6px; }

@media (max-width: 768px) {
  .brand-panel { display: none; }
}
</style>
