<!-- FILE: frontend/src/pages/Register.vue -->
<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'
import { useNotification } from '../services/notification'
import { getCaptchaToken } from '../services/captcha'

const username = ref('')
const email    = ref('')
const phone    = ref('')
const password = ref('')
const loading  = ref(false)
const showPass = ref(false)
const authStore    = useAuthStore()
const router       = useRouter()
const notification = useNotification()

const captchaError = ref(false)

const handleRegister = async () => {
  loading.value = true
  captchaError.value = false
  try {
    // Get captcha token (invisible — no user interaction needed)
    const captchaToken = await getCaptchaToken('register')
    if (!captchaToken) {
      captchaError.value = true
      notification.add('Security verification failed. Please try again.', 'error')
      loading.value = false
      return
    }

    await authStore.register(email.value, password.value, username.value, phone.value)
    notification.add('Account created! ₹5,000 added to your wallet.', 'success')
    router.push('/')
  } catch (e) {
    notification.add(
      e?.message?.includes('email-already-in-use')
        ? 'Email already registered. Try signing in.'
        : 'Registration failed. Please try again.',
      'error'
    )
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
          <h1 class="brand-headline">Join 50,000+ serious bidders.</h1>
          <p class="brand-sub">Free to join. Bid on rare art, watches, vehicles and more — all verified, all live.</p>
        </div>
        <div class="bonus-card">
          <div class="bonus-card__icon">🎁</div>
          <div class="bonus-card__body">
            <div class="bonus-card__eyebrow">Welcome Bonus</div>
            <div class="bonus-card__amount">₹5,000</div>
            <div class="bonus-card__sub">Added instantly on signup</div>
          </div>
        </div>
        <div class="brand-steps">
          <div v-for="(s, i) in steps" :key="i" class="step">
            <div class="step__num">{{ i + 1 }}</div>
            <span>{{ s }}</span>
          </div>
        </div>
        <div class="brand-footer">© 2026 BidWars Platform</div>
      </div>
    </div>

    <!-- Right form panel -->
    <div class="form-panel">
      <div class="form-wrap">
        <div class="form-head">
          <div class="form-eyebrow">Create Account</div>
          <h2 class="form-title">Start bidding today</h2>
          <p class="form-sub">Free forever. No credit card required.</p>
        </div>

        <form @submit.prevent="handleRegister" class="form-body">
          <div class="field-wrap">
            <label class="field-label">Display Name</label>
            <input v-model="username" type="text" placeholder="How others see you" required class="field" />
          </div>
          <div class="field-wrap">
            <label class="field-label">Email Address</label>
            <input v-model="email" type="email" placeholder="you@example.com" required class="field" />
          </div>
          <div class="field-wrap">
            <label class="field-label">Mobile Number</label>
            <input v-model="phone" type="tel" placeholder="+91 XXXX-XXXXXX" required class="field" />
          </div>
          <div class="field-wrap">
            <label class="field-label">Password</label>
            <div class="field-password-wrap">
              <input v-model="password" :type="showPass ? 'text' : 'password'"
                placeholder="At least 8 characters" required minlength="8" class="field field--password" />
              <button type="button" class="field-toggle" @click="showPass = !showPass">
                {{ showPass ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          <div class="terms-note">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </div>

          <button type="submit" class="btn-submit" :disabled="loading">
            <span v-if="loading" class="btn-spin"></span>
            {{ loading ? 'Creating account…' : 'Create Free Account' }}
          </button>

          <div v-if="captchaError" style="font-size:12px;color:var(--red, #EF4444);text-align:center;margin-top:8px">
            Security check failed. Please refresh and try again.
          </div>

          <div class="captcha-notice">
            Protected by reCAPTCHA.
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Privacy</a> ·
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener">Terms</a>
          </div>
        </form>

        <p class="form-switch">
          Already have an account?
          <router-link to="/login">Sign in →</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    steps: ['Create your free account', 'Complete identity verification', 'Deposit funds and start bidding']
  })
}
</script>

<style scoped>
.auth-page { display: flex; min-height: 100vh; }

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
  display: flex; flex-direction: column; gap: 32px; padding: 52px;
}
.brand-logo { display: flex; align-items: center; gap: 10px; }
.brand-logo__icon { font-size: 24px; color: var(--orange); }
.brand-logo__name { font-family: var(--font-display); font-size: 24px; font-weight: 600; color: var(--text); }

.brand-copy { }
.brand-headline {
  font-family: var(--font-display); font-size: clamp(28px, 3.5vw, 46px);
  font-weight: 600; color: var(--text); line-height: 1.15; margin-bottom: 16px;
  animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
.brand-sub { font-size: 15px; color: var(--text-2); line-height: 1.7; animation: slideUp 0.6s 0.08s cubic-bezier(0.16,1,0.3,1) both; }

.bonus-card {
  display: flex; align-items: center; gap: 18px;
  background: var(--orange-dim); border: 1px solid rgba(251,146,60,0.25);
  border-radius: 16px; padding: 20px 24px;
  animation: slideUp 0.5s 0.15s cubic-bezier(0.16,1,0.3,1) both;
}
.bonus-card__icon { font-size: 36px; flex-shrink: 0; }
.bonus-card__eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--orange); margin-bottom: 4px; }
.bonus-card__amount { font-family: var(--font-display); font-size: 32px; color: var(--text); line-height: 1; margin-bottom: 2px; }
.bonus-card__sub { font-size: 13px; color: var(--text-2); }

.brand-steps { display: flex; flex-direction: column; gap: 12px; flex: 1; justify-content: flex-end; }
.step { display: flex; align-items: center; gap: 14px; font-size: 14px; color: var(--text-2); }
.step__num {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: var(--orange-dim); border: 1px solid rgba(251,146,60,0.3);
  color: var(--orange); font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.brand-footer { font-family: var(--font-mono); font-size: 12px; color: var(--text-3); }

.form-panel {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 48px; background: var(--bg);
}
.form-wrap { width: 100%; max-width: 400px; animation: slideUp 0.5s 0.15s cubic-bezier(0.16,1,0.3,1) both; }

.form-head { margin-bottom: 32px; }
.form-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--orange); margin-bottom: 12px; }
.form-title { font-family: var(--font-display); font-size: 32px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
.form-sub   { font-size: 14px; color: var(--text-2); }

.form-body { display: flex; flex-direction: column; gap: 18px; }

.field-password-wrap { position: relative; }
.field--password { padding-right: 70px !important; }
.field-toggle {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: var(--text-3);
  font-family: var(--font-body); font-size: 12px; font-weight: 600; cursor: pointer; transition: color 0.15s;
}
.field-toggle:hover { color: var(--text); }

.terms-note { font-size: 12px; color: var(--text-3); line-height: 1.5; }

.btn-submit {
  width: 100%; padding: 15px; background: var(--orange); color: #fff;
  border: none; border-radius: 12px; font-family: var(--font-body); font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all 0.2s; margin-top: 4px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  box-shadow: 0 4px 20px rgba(251,146,60,0.3);
}
.btn-submit:hover:not(:disabled) { background: #f97316; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(251,146,60,0.4); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.btn-spin { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.form-switch { margin-top: 28px; text-align: center; font-size: 14px; color: var(--text-2); }
.form-switch a { color: var(--orange); font-weight: 600; text-decoration: none; margin-left: 6px; }
.form-switch a:hover { color: #f97316; }

@media (max-width: 768px) {
  .brand-panel { display: none; }
  .form-panel { padding: 40px 24px; }
}

.captcha-notice {
  text-align: center; font-size: 11px; color: var(--text-3, #888);
  margin-top: 12px;
}
.captcha-notice a {
  color: var(--text-3, #888); text-decoration: underline;
}
</style>