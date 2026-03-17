<!-- FILE: frontend/src/components/RazorpayModal.vue -->
<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  amount: Number,     // in PAISE (e.g. 10000 = ₹100)
  orderId: String,
  razorpayKey: String
})
const emit = defineEmits(['update:modelValue', 'success', 'cancel'])

const step = ref('method') // method | processing | success
const selectedMethod = ref(null)
const cardNumber = ref('')
const cardExpiry = ref('')
const cardCvv = ref('')
const cardName = ref('')
const upiId = ref('')
const error = ref('')

const displayAmount = computed(() => {
  const rupees = (props.amount || 0) / 100
  return '₹' + rupees.toLocaleString('en-IN')
})

const methods = [
  { id: 'upi',        icon: '⚡', label: 'UPI',         sub: 'Google Pay, PhonePe, Paytm' },
  { id: 'card',       icon: '💳', label: 'Card',        sub: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', icon: '🏦', label: 'Net Banking',  sub: 'All major Indian banks' },
]

const close = () => {
  emit('update:modelValue', false)
  emit('cancel')
  setTimeout(reset, 300)
}

const reset = () => {
  step.value = 'method'
  selectedMethod.value = null
  cardNumber.value = cardExpiry.value = cardCvv.value = cardName.value = upiId.value = ''
  error.value = ''
}

const selectMethod = (id) => {
  selectedMethod.value = id
  error.value = ''
}

const formatCard = (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 16)
  cardNumber.value = v.replace(/(\d{4})(?=\d)/g, '$1 ')
}

const formatExpiry = (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 4)
  if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2)
  cardExpiry.value = v
}

const validate = () => {
  error.value = ''
  if (!selectedMethod.value) { error.value = 'Please select a payment method'; return false }
  if (selectedMethod.value === 'card') {
    if (cardNumber.value.replace(/\s/g, '').length < 16) { error.value = 'Enter a valid 16-digit card number'; return false }
    if (cardExpiry.value.length < 5) { error.value = 'Enter a valid expiry (MM/YY)'; return false }
    if (cardCvv.value.length < 3) { error.value = 'Enter a valid CVV'; return false }
    if (!cardName.value.trim()) { error.value = 'Enter cardholder name'; return false }
  }
  if (selectedMethod.value === 'upi') {
    if (!upiId.value.includes('@')) { error.value = 'Enter a valid UPI ID (e.g. name@upi)'; return false }
  }
  return true
}

const pay = async () => {
  if (!validate()) return
  step.value = 'processing'
  await new Promise(r => setTimeout(r, 2200))
  step.value = 'success'
  await new Promise(r => setTimeout(r, 1000))
  emit('success', {
    orderId: props.orderId,
    paymentId: 'pay_' + Math.random().toString(36).slice(2, 11),
    signature: 'sig_' + Math.random().toString(36).slice(2, 11)
  })
  emit('update:modelValue', false)
  reset()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="rzp-fade">
      <div v-if="modelValue" class="rzp-backdrop" @click.self="close">
        <Transition name="rzp-slide" appear>
          <div class="rzp-sheet">

            <!-- Handle bar (mobile) -->
            <div class="rzp-handle"></div>

            <!-- Header -->
            <div class="rzp-header">
              <div class="rzp-header__left">
                <div class="rzp-brand-dot"></div>
                <span class="rzp-brand-name">Razorpay</span>
              </div>
              <button class="rzp-close" @click="close" aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <!-- Amount display -->
            <div class="rzp-amount-row">
              <span class="rzp-amount-label">Total due</span>
              <span class="rzp-amount-value">{{ displayAmount }}</span>
            </div>

            <!-- ── METHOD SELECTION ── -->
            <div v-if="step === 'method'" class="rzp-body">
              <div class="rzp-methods">
                <button
                  v-for="m in methods" :key="m.id"
                  class="rzp-method-btn"
                  :class="{ 'rzp-method-btn--active': selectedMethod === m.id }"
                  @click="selectMethod(m.id)"
                >
                  <span class="rzp-method-icon">{{ m.icon }}</span>
                  <div class="rzp-method-text">
                    <div class="rzp-method-label">{{ m.label }}</div>
                    <div class="rzp-method-sub">{{ m.sub }}</div>
                  </div>
                  <div class="rzp-method-radio">
                    <div v-if="selectedMethod === m.id" class="rzp-radio-dot"></div>
                  </div>
                </button>
              </div>

              <!-- Card form -->
              <Transition name="expand">
                <div v-if="selectedMethod === 'card'" class="rzp-form">
                  <div class="rzp-field">
                    <label>Card Number</label>
                    <input :value="cardNumber" @input="formatCard" maxlength="19"
                      placeholder="1234 5678 9012 3456" class="rzp-input rzp-input--mono" />
                  </div>
                  <div class="rzp-field-row">
                    <div class="rzp-field">
                      <label>Expiry</label>
                      <input :value="cardExpiry" @input="formatExpiry" maxlength="5"
                        placeholder="MM/YY" class="rzp-input rzp-input--mono" />
                    </div>
                    <div class="rzp-field">
                      <label>CVV</label>
                      <input v-model="cardCvv" type="password" maxlength="4"
                        placeholder="•••" class="rzp-input rzp-input--mono" />
                    </div>
                  </div>
                  <div class="rzp-field">
                    <label>Name on Card</label>
                    <input v-model="cardName" placeholder="JOHN DOE" class="rzp-input" />
                  </div>
                </div>
              </Transition>

              <!-- UPI form -->
              <Transition name="expand">
                <div v-if="selectedMethod === 'upi'" class="rzp-form">
                  <div class="rzp-field">
                    <label>UPI ID</label>
                    <input v-model="upiId" placeholder="yourname@upi" class="rzp-input" />
                    <span class="rzp-field-hint">You'll receive a payment request in your UPI app</span>
                  </div>
                </div>
              </Transition>

              <!-- Net banking note -->
              <Transition name="expand">
                <div v-if="selectedMethod === 'netbanking'" class="rzp-form">
                  <div class="rzp-netbank-note">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="rzp-info-icon">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M8 7v4M8 5.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    You'll be securely redirected to your bank's portal to complete payment.
                  </div>
                </div>
              </Transition>

              <!-- Error -->
              <div v-if="error" class="rzp-error">{{ error }}</div>

              <!-- Pay button -->
              <button class="rzp-pay-btn" :disabled="!selectedMethod" @click="pay">
                Pay {{ displayAmount }}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              <div class="rzp-footer">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="4" width="10" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M4 4V3a2 2 0 114 0v1" stroke="currentColor" stroke-width="1.2"/>
                </svg>
                256-bit SSL · PCI-DSS compliant
              </div>
            </div>

            <!-- ── PROCESSING ── -->
            <div v-else-if="step === 'processing'" class="rzp-state">
              <div class="rzp-spinner">
                <div class="rzp-spinner__ring"></div>
                <div class="rzp-spinner__ring rzp-spinner__ring--2"></div>
              </div>
              <div class="rzp-state-title">Processing payment</div>
              <div class="rzp-state-sub">Please wait, do not close this window</div>
            </div>

            <!-- ── SUCCESS ── -->
            <div v-else-if="step === 'success'" class="rzp-state">
              <div class="rzp-success-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M8 16l5 5 11-11" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="rzp-state-title">Payment successful!</div>
              <div class="rzp-state-sub">{{ displayAmount }} added to your wallet</div>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── BACKDROP ── */
.rzp-backdrop {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center;
}

@media (min-width: 640px) {
  .rzp-backdrop { align-items: center; }
}

/* ── SHEET ── */
.rzp-sheet {
  background: #ffffff;
  border-radius: 20px 20px 0 0;
  width: 100%; max-width: 420px;
  max-height: 92vh; overflow-y: auto;
  padding: 0 0 max(env(safe-area-inset-bottom, 0px), 20px);
  color: #1a1a1a;
}

@media (min-width: 640px) {
  .rzp-sheet { border-radius: 16px; }
}

/* handle */
.rzp-handle {
  width: 36px; height: 4px; background: #e2e8f0;
  border-radius: 2px; margin: 10px auto 0;
}
@media (min-width: 640px) { .rzp-handle { display: none; } }

/* ── HEADER ── */
.rzp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 0;
}
.rzp-header__left { display: flex; align-items: center; gap: 8px; }
.rzp-brand-dot {
  width: 28px; height: 28px; border-radius: 7px;
  background: #0d6efd;
  display: flex; align-items: center; justify-content: center;
}
.rzp-brand-dot::after {
  content: 'R'; color: white; font-weight: 800; font-size: 14px;
}
.rzp-brand-name { font-weight: 700; font-size: 15px; color: #1e293b; }
.rzp-close {
  width: 32px; height: 32px; border-radius: 50%;
  background: #f1f5f9; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #64748b; transition: background 0.15s;
}
.rzp-close:hover { background: #e2e8f0; }

/* ── AMOUNT ── */
.rzp-amount-row {
  display: flex; align-items: baseline; justify-content: space-between;
  padding: 20px 20px 0;
}
.rzp-amount-label { font-size: 13px; color: #64748b; font-weight: 500; }
.rzp-amount-value {
  font-size: 26px; font-weight: 800; color: #0f172a;
  letter-spacing: -0.02em;
}

/* ── BODY ── */
.rzp-body { padding: 16px 20px 20px; }

/* ── METHODS ── */
.rzp-methods { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.rzp-method-btn {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 14px; border-radius: 12px;
  background: #f8fafc; border: 1.5px solid #e2e8f0;
  cursor: pointer; transition: all 0.15s; text-align: left; width: 100%;
}
.rzp-method-btn:hover { border-color: #cbd5e1; background: #f1f5f9; }
.rzp-method-btn--active { border-color: #0d6efd; background: #eff6ff; }

.rzp-method-icon { font-size: 20px; width: 28px; text-align: center; flex-shrink: 0; }
.rzp-method-text { flex: 1; }
.rzp-method-label { font-size: 14px; font-weight: 600; color: #1e293b; }
.rzp-method-sub { font-size: 11px; color: #94a3b8; margin-top: 1px; }

.rzp-method-radio {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: border-color 0.15s;
}
.rzp-method-btn--active .rzp-method-radio { border-color: #0d6efd; }
.rzp-radio-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #0d6efd;
  animation: pop 0.15s ease;
}
@keyframes pop { from { transform: scale(0); } to { transform: scale(1); } }

/* ── FORM ── */
.rzp-form { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.rzp-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.rzp-field { display: flex; flex-direction: column; gap: 5px; }
.rzp-field label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
.rzp-field-hint { font-size: 11px; color: #94a3b8; }

.rzp-input {
  padding: 11px 13px; border-radius: 9px;
  border: 1.5px solid #e2e8f0; background: #f8fafc;
  font-size: 14px; color: #1e293b; outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}
.rzp-input--mono { font-family: 'Courier New', monospace; letter-spacing: 0.04em; }
.rzp-input::placeholder { color: #cbd5e1; }
.rzp-input:focus { border-color: #0d6efd; background: #fff; }

.rzp-netbank-note {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 13px; border-radius: 10px;
  background: #f0f9ff; border: 1px solid #bae6fd;
  font-size: 13px; color: #0369a1; line-height: 1.5;
}
.rzp-info-icon { flex-shrink: 0; margin-top: 1px; }

/* ── ERROR ── */
.rzp-error {
  padding: 10px 13px; border-radius: 9px;
  background: #fef2f2; border: 1px solid #fecaca;
  font-size: 13px; color: #dc2626; margin-bottom: 4px;
}

/* ── PAY BUTTON ── */
.rzp-pay-btn {
  width: 100%; padding: 15px;
  background: #0d6efd; color: white; border: none; border-radius: 12px;
  font-size: 15px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(13, 110, 253, 0.3);
}
.rzp-pay-btn:hover:not(:disabled) { background: #0b5ed7; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(13, 110, 253, 0.4); }
.rzp-pay-btn:active:not(:disabled) { transform: translateY(0); }
.rzp-pay-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── FOOTER ── */
.rzp-footer {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-top: 14px; font-size: 11px; color: #94a3b8;
}

/* ── STATES ── */
.rzp-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 24px; gap: 12px; text-align: center;
}
.rzp-state-title { font-size: 17px; font-weight: 700; color: #1e293b; }
.rzp-state-sub { font-size: 13px; color: #64748b; }

/* Spinner */
.rzp-spinner {
  position: relative; width: 56px; height: 56px; margin-bottom: 8px;
}
.rzp-spinner__ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #0d6efd;
  animation: spin 0.9s linear infinite;
}
.rzp-spinner__ring--2 {
  inset: 6px;
  border-top-color: #93c5fd;
  animation-duration: 1.4s;
  animation-direction: reverse;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Success icon */
.rzp-success-icon {
  width: 64px; height: 64px; border-radius: 50%;
  background: #22c55e;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 8px;
  animation: successPop 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes successPop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* ── TRANSITIONS ── */
.rzp-fade-enter-active, .rzp-fade-leave-active { transition: opacity 0.25s ease; }
.rzp-fade-enter-from, .rzp-fade-leave-to { opacity: 0; }

.rzp-slide-enter-active { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease; }
.rzp-slide-leave-active { transition: transform 0.25s ease, opacity 0.2s ease; }
.rzp-slide-enter-from { transform: translateY(40px); opacity: 0; }
.rzp-slide-leave-to { transform: translateY(20px); opacity: 0; }

@media (min-width: 640px) {
  .rzp-slide-enter-from { transform: translateY(0) scale(0.95); }
  .rzp-slide-leave-to { transform: translateY(0) scale(0.97); }
}

.expand-enter-active, .expand-leave-active { transition: all 0.2s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; transform: translateY(-6px); max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 300px; }
</style>