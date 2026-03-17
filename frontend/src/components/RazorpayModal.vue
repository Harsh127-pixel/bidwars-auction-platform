<!-- FILE: frontend/src/components/RazorpayModal.vue -->
<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  amount: Number,
  orderId: String,
  razorpayKey: String
})
const emit = defineEmits(['update:modelValue', 'success', 'cancel'])

const processing = ref(false)
const step = ref(1) // 1: Method, 2: Processing, 3: Success

const methods = [
  { id: 'upi', icon: '⚡', name: 'UPI', desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', icon: '💳', name: 'Card', desc: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', icon: '🏦', name: 'Netbanking', desc: 'All Indian Banks' },
  { id: 'wallet', icon: '👛', name: 'Wallet', desc: 'Mobikwik, Freecharge' }
]

const handlePay = () => {
  processing.value = true
  step.value = 2
  setTimeout(() => {
    step.value = 3
    setTimeout(() => {
      emit('success', {
        orderId: props.orderId,
        paymentId: 'pay_' + Math.random().toString(36).slice(2, 11),
        signature: 'sig_' + Math.random().toString(36).slice(2, 11)
      })
      emit('update:modelValue', false)
      step.value = 1
      processing.value = false
    }, 1500)
  }, 2000)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="rzp">
      <div v-if="modelValue" class="rzp-overlay" @click.self="emit('update:modelValue', false)">
        <div class="rzp-modal">
          <!-- Header -->
          <div class="rzp-head">
            <div class="rzp-brand">
              <div class="rzp-logo">R</div>
              <div>
                <div class="rzp-title">Razorpay</div>
                <div class="rzp-sub">Trusted by 10M+ businesses</div>
              </div>
            </div>
            <div class="rzp-amount">
              <span class="rzp-curr">₹</span>{{ Number(amount).toLocaleString('en-IN') }}
            </div>
          </div>

          <!-- Body -->
          <div class="rzp-body">
            <!-- Step 1: Selection -->
            <div v-if="step === 1" class="fade-in">
              <div class="rzp-section-title">CHOOSE PAYMENT METHOD</div>
              <div class="rzp-methods">
                <div v-for="m in methods" :key="m.id" class="rzp-method" @click="handlePay">
                  <span class="rzp-method__icon">{{ m.icon }}</span>
                  <div class="rzp-method__info">
                    <div class="rzp-method__name">{{ m.name }}</div>
                    <div class="rzp-method__desc">{{ m.desc }}</div>
                  </div>
                  <span class="rzp-method__arrow">→</span>
                </div>
              </div>
            </div>

            <!-- Step 2: Processing -->
            <div v-if="step === 2" class="rzp-processing fade-in">
              <div class="rzp-spinner"></div>
              <div class="rzp-proc-status">Processing your payment...</div>
              <div class="rzp-proc-sub">Do not press back or refresh</div>
            </div>

            <!-- Step 3: Success -->
            <div v-if="step === 3" class="rzp-success fade-in">
              <div class="rzp-check">✓</div>
              <div class="rzp-proc-status">Payment Successful</div>
              <div class="rzp-proc-sub">Updating your wallet balance</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="rzp-foot">
            <div class="rzp-security">
              🛡️ Secured by Razorpay | PCI-DSS Compliant
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.rzp-overlay {
  position: fixed; inset: 0; background: rgba(18, 25, 38, 0.85);
  backdrop-filter: blur(4px); z-index: 9999;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.rzp-modal {
  width: 100%; max-width: 400px; background: #fff;
  border-radius: 4px; overflow: hidden; color: #1e293b;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.rzp-head {
  background: #232f3e; padding: 24px; color: #fff;
  display: flex; align-items: center; justify-content: space-between;
}
.rzp-brand { display: flex; align-items: center; gap: 12px; }
.rzp-logo {
  width: 32px; height: 32px; background: #339af0; border-radius: 4px;
  display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 20px;
}
.rzp-title { font-weight: 700; font-size: 16px; line-height: 1; }
.rzp-sub { font-size: 10px; opacity: 0.6; margin-top: 2px; }
.rzp-amount { font-size: 24px; font-weight: 700; }
.rzp-curr { font-size: 16px; opacity: 0.7; margin-right: 2px; }

.rzp-body { padding: 24px; min-height: 320px; background: #f8fafc; }
.rzp-section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #64748b; margin-bottom: 16px; }

.rzp-methods { display: flex; flex-direction: column; gap: 12px; }
.rzp-method {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 6px;
  padding: 12px 16px; display: flex; align-items: center; gap: 12px;
  cursor: pointer; transition: all 0.2s;
}
.rzp-method:hover { border-color: #339af0; transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.rzp-method__icon { font-size: 20px; width: 24px; text-align: center; }
.rzp-method__info { flex: 1; }
.rzp-method__name { font-weight: 600; font-size: 14px; color: #1e293b; }
.rzp-method__desc { font-size: 11px; color: #64748b; }
.rzp-method__arrow { font-size: 14px; color: #cbd5e1; }

.rzp-processing, .rzp-success {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding-top: 40px;
}
.rzp-spinner {
  width: 48px; height: 48px; border: 4px solid #e2e8f0;
  border-top-color: #339af0; border-radius: 50%;
  animation: spin 0.8s linear infinite; margin-bottom: 24px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.rzp-check {
  width: 60px; height: 60px; background: #22c55e; color: #fff; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 32px;
  margin-bottom: 24px; animation: scaleIn 0.3s cubic-bezier(0.16,1,0.3,1);
}
@keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.rzp-proc-status { font-weight: 700; font-size: 18px; color: #1e293b; margin-bottom: 8px; }
.rzp-proc-sub { font-size: 13px; color: #64748b; }

.rzp-foot { padding: 16px; border-top: 1px solid #e2e8f0; text-align: center; }
.rzp-security { font-size: 11px; color: #94a3b8; }

.fade-in { animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.rzp-enter-active, .rzp-leave-active { transition: opacity 0.3s ease; }
.rzp-enter-from, .rzp-leave-to { opacity: 0; }
.rzp-enter-active .rzp-modal { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1); }
.rzp-enter-from .rzp-modal { transform: scale(0.9) translateY(20px); }
</style>
