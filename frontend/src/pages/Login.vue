<!-- FILE: frontend/src/pages/Login.vue -->
<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { useRouter, useRoute } from 'vue-router'
import { useNotification } from '../services/notification'

const email    = ref('')
const password = ref('')
const loading  = ref(false)
const showPass = ref(false)
const rememberMe = ref(false)
const authStore    = useAuthStore()
const router       = useRouter()
const route        = useRoute()
const notification = useNotification()

const features = [
  { icon: '🔒', text: 'Every item authenticated before listing' },
  { icon: '⚡', text: 'Real-time proxy bidding engine' },
  { icon: '🛡', text: 'Escrow-protected payments' },
  { icon: '📜', text: 'Certificate of Authenticity on every win' },
]

const handleLogin = async () => {
  loading.value = true
  try {
    await authStore.login(email.value, password.value, rememberMe.value)
    notification.add('Welcome back!', 'success')
    router.push(route.query.redirect || '/')
  } catch {
    notification.add('Incorrect email or password.', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <!-- Left brand panel -->
    <div class="brand-panel">
      <div class="brand-panel__glow"></div>
      <div class="brand-panel__inner">
        <div class="brand-logo">
          <span class="brand-logo__icon">⚑</span>
          <span class="brand-logo__name">BidWars</span>
        </div>
        <div class="brand-copy">
          <h1 class="brand-headline">Where rare finds meet serious bidders.</h1>
          <p class="brand-sub">Live auctions on authenticated items. Real-time bidding. Secure escrow on every transaction.</p>
        </div>
        <div class="brand-features">
          <div v-for="f in features" :key="f.text" class="brand-feature">
            <span class="brand-feature__icon">{{ f.icon }}</span>
            <span>{{ f.text }}</span>
          </div>
        </div>
        <div class="brand-footer">© 2026 BidWars Platform</div>
      </div>
    </div>

    <!-- Right form panel -->
    <div class="form-panel">
      <div class="form-wrap">
        <div class="form-head">
          <div class="form-eyebrow">Sign In</div>
          <h2 class="form-title">Welcome back</h2>
          <p class="form-sub">Continue to your bidding dashboard</p>
        </div>

        <form @submit.prevent="handleLogin" class="form-body">
          <div class="field-wrap">
            <label class="field-label">Email Address</label>
            <input v-model="email" type="email" placeholder="you@example.com" required class="field" />
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

          <div class="field-wrap">
            <label class="checkbox-label">
              <input v-model="rememberMe" type="checkbox" class="checkbox" />
              <span>Remember me</span>
            </label>
          </div>

          <button type="submit" class="btn-submit" :disabled="loading">
            <span v-if="loading" class="btn-spin"></span>
            {{ loading ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>

        <p class="form-switch">
          New to BidWars?
          <router-link to="/register">Create free account →</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page { display: flex; min-height: 100vh; }

/* BRAND PANEL */
.brand-panel {
  flex: 1; position: relative; overflow: hidden;
  background: var(--bg-card); border-right: 1px solid var(--border);
  display: flex; align-items: stretch;
}
.brand-panel__glow {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 80% 60% at 20% 80%, rgba(251,146,60,0.1) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 80% 20%, rgba(251,146,60,0.06) 0%, transparent 50%);
}
.brand-panel__inner {
  position: relative; width: 100%;
  display: flex; flex-direction: column; gap: 40px; padding: 52px;
}
.brand-logo { display: flex; align-items: center; gap: 10px; }
.brand-logo__icon { font-size: 24px; color: var(--orange); }
.brand-logo__name { font-family: var(--font-display); font-size: 24px; font-weight: 600; color: var(--text); }

.brand-copy { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.brand-headline {
  font-family: var(--font-display); font-size: clamp(28px, 3.5vw, 48px);
  font-weight: 600; color: var(--text); line-height: 1.15; margin-bottom: 20px;
  animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
.brand-sub { font-size: 16px; color: var(--text-2); line-height: 1.7; animation: slideUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both; }

.brand-features { display: flex; flex-direction: column; gap: 0; }
.brand-feature {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 0; border-bottom: 1px solid var(--border);
  font-size: 14px; color: var(--text-2);
  animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
}
.brand-feature:last-child { border-bottom: none; }
.brand-feature__icon { font-size: 18px; width: 28px; text-align: center; flex-shrink: 0; }
.brand-footer { font-family: var(--font-mono); font-size: 12px; color: var(--text-3); }

/* FORM PANEL */
.form-panel {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 48px; background: var(--bg);
}
.form-wrap { width: 100%; max-width: 400px; animation: slideUp 0.5s 0.15s cubic-bezier(0.16,1,0.3,1) both; }

.form-head { margin-bottom: 36px; }
.form-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--orange); margin-bottom: 12px; }
.form-title   { font-family: var(--font-display); font-size: 32px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
.form-sub     { font-size: 14px; color: var(--text-2); }

.form-body { display: flex; flex-direction: column; gap: 20px; }

.field-password-wrap { position: relative; }
.field--password { padding-right: 70px !important; }
.field-toggle {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: var(--text-3);
  font-family: var(--font-body); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: color 0.15s;
}
.field-toggle:hover { color: var(--text); }

.btn-submit {
  width: 100%; padding: 15px; background: var(--orange); color: #fff;
  border: none; border-radius: 12px; font-family: var(--font-body); font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all 0.2s; margin-top: 4px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  box-shadow: 0 4px 20px rgba(251,146,60,0.3);
}
.btn-submit:hover:not(:disabled) { background: #f97316; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(251,146,60,0.4); }
.btn-submit:active { transform: translateY(0); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.btn-spin { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.form-switch { margin-top: 28px; text-align: center; font-size: 14px; color: var(--text-2); }
.form-switch a { color: var(--orange); font-weight: 600; text-decoration: none; margin-left: 6px; transition: color 0.15s; }
.form-switch a:hover { color: #f97316; }

@media (max-width: 768px) {
  .brand-panel { display: none; }
  .form-panel { padding: 40px 24px; }
}
</style>