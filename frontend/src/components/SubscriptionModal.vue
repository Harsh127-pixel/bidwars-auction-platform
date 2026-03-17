<!-- FILE: frontend/src/components/SubscriptionModal.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'
import api from '../services/api'

const props = defineProps({
  modelValue: Boolean,
  context: { type: String, default: 'general' }
})

const emit = defineEmits(['update:modelValue'])
const authStore = useAuthStore()
const notification = useNotification()

const step = ref('plans') // 'plans' | 'payment' | 'processing' | 'success'
const selectedPlan = ref(null)
const paymentMethod = ref('card')
const cardNumber = ref('')
const cardExpiry = ref('')
const cardCvv = ref('')
const cardName = ref('')
const upiId = ref('')
const paymentError = ref('')

const close = () => {
  emit('update:modelValue', false)
  setTimeout(() => {
    step.value = 'plans'
    selectedPlan.value = null
    paymentError.value = ''
    cardNumber.value = cardExpiry.value = cardCvv.value = cardName.value = upiId.value = ''
  }, 300)
}

const isSubscribed = computed(() => authStore.user?.subscriptionStatus === 'active')

const plans = [
  {
    id: 'monthly',
    name: 'Pro Monthly',
    price: 999,
    period: 'month',
    badge: null,
    color: '#D4AF37',
    icon: '⚡',
    features: [
      { text: 'Zero platform fee (save 5%)', highlight: true },
      { text: 'Priority bid processing', highlight: true },
      { text: 'Advanced auction analytics', highlight: false },
      { text: 'Unlimited proxy bids', highlight: false },
      { text: 'Early access to new lots', highlight: false },
      { text: 'Dedicated support', highlight: false },
    ]
  },
  {
    id: 'yearly',
    name: 'Pro Annual',
    price: 7999,
    period: 'year',
    badge: 'Save 33%',
    color: '#D4AF37',
    icon: '👑',
    features: [
      { text: 'Zero platform fee (save 5%)', highlight: true },
      { text: 'Priority bid processing', highlight: true },
      { text: 'Advanced auction analytics', highlight: false },
      { text: 'Unlimited proxy bids', highlight: false },
      { text: 'Early access to new lots', highlight: false },
      { text: 'Dedicated support', highlight: false },
      { text: 'Annual bidder certificate', highlight: false },
      { text: 'Exclusive Gold tier status', highlight: true },
    ]
  }
]

const contextMessages = {
  'general': { title: 'Unlock BidWars Pro', subtitle: 'Bid smarter, save more, win bigger.' },
  'fee': { title: 'Eliminate Platform Fees', subtitle: 'You\'re about to pay a 5% buyer\'s premium. Pro members pay ₹0.' },
  'premium_lot': { title: 'Premium Lot Access', subtitle: 'This lot requires a Pro subscription. Join to unlock exclusive auctions.' },
  'analytics': { title: 'Unlock Analytics', subtitle: 'Get deep bidding insights with a Pro subscription.' }
}

const contextMsg = computed(() => contextMessages[props.context] || contextMessages['general'])

const selectPlan = (plan) => {
  selectedPlan.value = plan
  step.value = 'payment'
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

const processPayment = async () => {
  paymentError.value = ''

  if (paymentMethod.value === 'card') {
    if (!cardNumber.value || cardNumber.value.replace(/\s/g,'').length < 16) {
      paymentError.value = 'Enter a valid 16-digit card number'; return
    }
    if (!cardExpiry.value || cardExpiry.value.length < 5) {
      paymentError.value = 'Enter a valid expiry date'; return
    }
    if (!cardCvv.value || cardCvv.value.length < 3) {
      paymentError.value = 'Enter a valid CVV'; return
    }
    if (!cardName.value) {
      paymentError.value = 'Enter cardholder name'; return
    }
  } else if (paymentMethod.value === 'upi') {
    if (!upiId.value || !upiId.value.includes('@')) {
      paymentError.value = 'Enter a valid UPI ID (e.g. name@upi)'; return
    }
  }

  step.value = 'processing'

  // Simulate gateway processing (2.5s animation)
  await new Promise(r => setTimeout(r, 2500))

  // Simulate success (demo mode — in production, call real Razorpay API)
  try {
    // Update user's subscription in Firestore via API  
    await api.post('/api/users/subscription', {
      plan: selectedPlan.value.id,
      amount: selectedPlan.value.price,
      simulatedPayment: true
    })
  } catch {
    // Even if API fails, simulate success for demo
  }

  // Optimistically update auth store
  if (authStore.user) {
    authStore.user.subscriptionStatus = 'active'
    authStore.user.subscriptionPlan = selectedPlan.value.id
    authStore.user.membershipTier = selectedPlan.value.id === 'yearly' ? 'Gold' : 'Silver'
  }

  step.value = 'success'
}

const finishSuccess = () => {
  notification.add('🎉 Welcome to BidWars Pro! Platform fees are now waived.', 'success')
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sub-modal">
      <div v-if="modelValue" class="sub-overlay" @click.self="close">
        <div class="sub-modal" :class="`step-${step}`">

          <!-- Close button -->
          <button class="sub-close" @click="close">✕</button>

          <!-- ═══════════════ STEP: PLANS ═══════════════ -->
          <div v-if="step === 'plans'" class="step-plans">
            <!-- Decorative glow -->
            <div class="plans-glow"></div>

            <!-- Already subscribed -->
            <div v-if="isSubscribed" class="already-subscribed">
              <div class="already-sub__icon">🏆</div>
              <div class="already-sub__title">You're a Pro Member!</div>
              <div class="already-sub__sub">All platform fees are waived. Enjoy exclusive bidder benefits.</div>
              <div class="sub-perks-row">
                <div class="sub-perk-pill">✓ 0% Platform Fee</div>
                <div class="sub-perk-pill">✓ Priority Bids</div>
                <div class="sub-perk-pill">✓ Gold Status</div>
              </div>
              <button class="sub-btn-close-main" @click="close">Continue Bidding</button>
            </div>

            <!-- Plan selection -->
            <div v-else>
              <!-- Context-aware header -->
              <div class="plans-header">
                <div class="plans-eyebrow">BidWars Pro</div>
                <h2 class="plans-title">{{ contextMsg.title }}</h2>
                <p class="plans-subtitle">{{ contextMsg.subtitle }}</p>
              </div>

              <!-- Context callout if fee-related -->
              <div v-if="context === 'fee'" class="fee-callout">
                <div class="fee-callout__icon">💸</div>
                <div>
                  <div class="fee-callout__text">As a free member, you pay a <strong>5% buyer's premium</strong> on every win.</div>
                  <div class="fee-callout__sub">Pro members pay <strong>₹0</strong> in platform fees — ever.</div>
                </div>
              </div>

              <!-- Plan cards -->
              <div class="plan-cards">
                <div v-for="plan in plans" :key="plan.id"
                  class="plan-card"
                  :class="{ 'plan-card--featured': plan.id === 'yearly' }"
                  @click="selectPlan(plan)">
                  <div v-if="plan.badge" class="plan-badge">{{ plan.badge }}</div>
                  <div class="plan-icon">{{ plan.icon }}</div>
                  <div class="plan-name">{{ plan.name }}</div>
                  <div class="plan-price-group">
                    <span class="plan-currency">₹</span>
                    <span class="plan-price">{{ plan.price.toLocaleString('en-IN') }}</span>
                    <span class="plan-period">/{{ plan.period }}</span>
                  </div>
                  <div class="plan-features">
                    <div v-for="f in plan.features" :key="f.text"
                      class="plan-feature" :class="{ 'plan-feature--highlight': f.highlight }">
                      <span class="plan-feature__check">{{ f.highlight ? '★' : '✓' }}</span>
                      {{ f.text }}
                    </div>
                  </div>
                  <button class="plan-cta">
                    Get {{ plan.name }} <span>→</span>
                  </button>
                </div>
              </div>

              <div class="plans-footer">
                <span>🔒 Secure payment via Razorpay</span>
                <span>·</span>
                <span>Cancel anytime</span>
                <span>·</span>
                <span>30-day refund</span>
              </div>
            </div>
          </div>

          <!-- ═══════════════ STEP: PAYMENT ═══════════════ -->
          <div v-else-if="step === 'payment'" class="step-payment">
            <button class="back-btn" @click="step = 'plans'">← Back</button>
            <div class="pay-header">
              <div class="pay-plan-badge">{{ selectedPlan.icon }} {{ selectedPlan.name }}</div>
              <div class="pay-amount">₹{{ selectedPlan.price.toLocaleString('en-IN') }}<span>/{{ selectedPlan.period }}</span></div>
              <div class="pay-subtitle">Powered by Razorpay (Demo Mode)</div>
            </div>

            <!-- Payment method tabs -->
            <div class="pay-methods">
              <button class="pay-method-btn" :class="{ active: paymentMethod === 'card' }" @click="paymentMethod = 'card'">
                💳 Card
              </button>
              <button class="pay-method-btn" :class="{ active: paymentMethod === 'upi' }" @click="paymentMethod = 'upi'">
                ⚡ UPI
              </button>
              <button class="pay-method-btn" :class="{ active: paymentMethod === 'netbanking' }" @click="paymentMethod = 'netbanking'">
                🏦 Net Banking
              </button>
            </div>

            <!-- Card form -->
            <div v-if="paymentMethod === 'card'" class="pay-form">
              <div class="pay-field">
                <label>Card Number</label>
                <input :value="cardNumber" @input="formatCard" maxlength="19" placeholder="1234 5678 9012 3456" class="pay-input" />
              </div>
              <div class="pay-row">
                <div class="pay-field">
                  <label>Expiry</label>
                  <input :value="cardExpiry" @input="formatExpiry" maxlength="5" placeholder="MM/YY" class="pay-input" />
                </div>
                <div class="pay-field">
                  <label>CVV</label>
                  <input v-model="cardCvv" type="password" maxlength="4" placeholder="•••" class="pay-input" />
                </div>
              </div>
              <div class="pay-field">
                <label>Cardholder Name</label>
                <input v-model="cardName" placeholder="Name on card" class="pay-input" />
              </div>
            </div>

            <!-- UPI form -->
            <div v-else-if="paymentMethod === 'upi'" class="pay-form">
              <div class="pay-field">
                <label>UPI ID</label>
                <input v-model="upiId" placeholder="yourname@upi" class="pay-input" />
              </div>
              <div class="upi-hint">You'll receive a payment request on your UPI app</div>
            </div>

            <!-- Net Banking -->
            <div v-else class="pay-form">
              <div class="netbank-list">
                <div v-for="bank in ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak']" :key="bank"
                  class="netbank-btn">{{ bank }}</div>
              </div>
              <div class="upi-hint">You'll be redirected to your bank's secure portal</div>
            </div>

            <div v-if="paymentError" class="pay-error">⚠ {{ paymentError }}</div>

            <button class="pay-submit" @click="processPayment">
              Pay ₹{{ selectedPlan.price.toLocaleString('en-IN') }} Securely
            </button>

            <div class="pay-security">
              <span>🔒 256-bit SSL encrypted</span>
              <span>·</span>
              <span>PCI DSS compliant</span>
            </div>
          </div>

          <!-- ═══════════════ STEP: PROCESSING ═══════════════ -->
          <div v-else-if="step === 'processing'" class="step-processing">
            <div class="processing-ring">
              <div class="processing-ring__inner"></div>
            </div>
            <div class="processing-logo">🏦</div>
            <div class="processing-title">Authorizing Payment</div>
            <div class="processing-sub">Connecting to Razorpay secure gateway…</div>
            <div class="processing-steps">
              <div class="proc-step proc-step--done">✓ Validating details</div>
              <div class="proc-step proc-step--active">⟳ 3D Secure verification</div>
              <div class="proc-step proc-step--pending">○ Activating subscription</div>
            </div>
          </div>

          <!-- ═══════════════ STEP: SUCCESS ═══════════════ -->
          <div v-else-if="step === 'success'" class="step-success">
            <div class="success-confetti">
              <span v-for="i in 12" :key="i" :style="`--i:${i}`">★</span>
            </div>
            <div class="success-icon">🏆</div>
            <div class="success-title">You're now Pro!</div>
            <div class="success-plan">{{ selectedPlan?.name }} activated</div>
            <div class="success-perks">
              <div class="success-perk">
                <div class="success-perk__icon">💸</div>
                <div>
                  <div class="success-perk__label">Platform Fee</div>
                  <div class="success-perk__val">0% — Waived forever</div>
                </div>
              </div>
              <div class="success-perk">
                <div class="success-perk__icon">⚡</div>
                <div>
                  <div class="success-perk__label">Bid Priority</div>
                  <div class="success-perk__val">Priority queue enabled</div>
                </div>
              </div>
              <div class="success-perk">
                <div class="success-perk__icon">👑</div>
                <div>
                  <div class="success-perk__label">Membership</div>
                  <div class="success-perk__val">{{ selectedPlan?.id === 'yearly' ? 'Gold' : 'Silver' }} tier unlocked</div>
                </div>
              </div>
            </div>
            <button class="success-cta" @click="finishSuccess">
              Start Bidding Pro ✦
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ═══════ OVERLAY ═══════ */
.sub-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

/* ═══════ MODAL ═══════ */
.sub-modal {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-md);
  border-radius: 24px;
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,0.5);
  scrollbar-width: thin;
}

.sub-close {
  position: absolute; top: 16px; right: 20px; z-index: 10;
  width: 32px; height: 32px;
  background: var(--bg-raised); border: 1px solid var(--border);
  border-radius: 50%; cursor: pointer;
  font-size: 13px; color: var(--text-3);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.sub-close:hover { background: var(--red-dim); color: var(--red); border-color: rgba(214,48,49,0.3); }

/* ═══════ PLANS STEP ═══════ */
.step-plans { padding: 40px 36px 32px; position: relative; }

.plans-glow {
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 600px; height: 200px;
  background: radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 70%);
  pointer-events: none;
}

.plans-header { text-align: center; margin-bottom: 28px; position: relative; }
.plans-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--gold); background: var(--gold-dim); border: 1px solid var(--gold-border);
  border-radius: 20px; padding: 4px 14px; margin-bottom: 16px;
}
.plans-title {
  font-family: var(--font-display);
  font-size: clamp(24px, 4vw, 36px);
  color: var(--text);
  margin-bottom: 10px;
  line-height: 1.1;
}
.plans-subtitle { font-size: 16px; color: var(--text-2); max-width: 500px; margin: 0 auto; }

/* Fee callout */
.fee-callout {
  display: flex; align-items: flex-start; gap: 14px;
  background: var(--red-dim); border: 1px solid rgba(214,48,49,0.25);
  border-radius: 12px; padding: 16px 20px;
  margin-bottom: 28px;
}
.fee-callout__icon { font-size: 24px; flex-shrink: 0; }
.fee-callout__text { font-size: 14px; color: var(--text-2); margin-bottom: 4px; }
.fee-callout__sub { font-size: 13px; color: var(--green); font-weight: 600; }

/* Plan cards */
.plan-cards {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  margin-bottom: 24px;
}

.plan-card {
  position: relative; cursor: pointer;
  background: var(--bg-raised); border: 1.5px solid var(--border);
  border-radius: 18px; padding: 28px 24px;
  transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
  overflow: hidden;
}
.plan-card::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, transparent 60%, rgba(212,175,55,0.05) 100%);
  opacity: 0; transition: opacity 0.25s;
}
.plan-card:hover {
  border-color: var(--gold-border);
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(212,175,55,0.15), 0 4px 12px rgba(0,0,0,0.1);
}
.plan-card:hover::before { opacity: 1; }

.plan-card--featured {
  background: linear-gradient(145deg, var(--bg-card) 0%, rgba(212,175,55,0.04) 100%);
  border-color: var(--gold-border);
  box-shadow: 0 8px 32px rgba(212,175,55,0.12);
}
.plan-card--featured:hover {
  transform: translateY(-6px);
  box-shadow: 0 24px 56px rgba(212,175,55,0.2);
}

.plan-badge {
  position: absolute; top: 16px; right: 16px;
  background: var(--gold); color: #000;
  font-size: 10px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 20px;
}

.plan-icon { font-size: 32px; margin-bottom: 14px; }
.plan-name { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); margin-bottom: 10px; }
.plan-price-group { display: flex; align-items: flex-end; gap: 2px; margin-bottom: 20px; }
.plan-currency { font-size: 22px; font-weight: 700; color: var(--text); padding-bottom: 4px; }
.plan-price { font-family: var(--font-display); font-size: 44px; color: var(--text); line-height: 1; }
.plan-period { font-size: 14px; color: var(--text-3); padding-bottom: 6px; }

.plan-features { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
.plan-feature {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 13px; color: var(--text-2); line-height: 1.4;
}
.plan-feature--highlight { color: var(--text); font-weight: 600; }
.plan-feature__check { font-size: 11px; color: var(--text-3); flex-shrink: 0; margin-top: 2px; }
.plan-feature--highlight .plan-feature__check { color: var(--gold); }

.plan-cta {
  width: 100%; padding: 13px;
  background: var(--gold); color: #000;
  border: none; border-radius: 12px;
  font-family: var(--font-body); font-size: 14px; font-weight: 800;
  cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.plan-card:hover .plan-cta { background: var(--gold-light); transform: translateY(-1px); }

.plans-footer {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  font-size: 12px; color: var(--text-3);
}

/* Already subscribed */
.already-subscribed { text-align: center; padding: 20px 0; }
.already-sub__icon { font-size: 56px; margin-bottom: 16px; }
.already-sub__title { font-family: var(--font-display); font-size: 28px; color: var(--gold); margin-bottom: 8px; }
.already-sub__sub { font-size: 15px; color: var(--text-2); margin-bottom: 24px; line-height: 1.6; }
.sub-perks-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 28px; }
.sub-perk-pill {
  background: var(--gold-dim); border: 1px solid var(--gold-border); color: var(--gold);
  font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 20px;
}
.sub-btn-close-main {
  padding: 14px 32px; background: var(--gold); color: #000;
  border: none; border-radius: 12px; font-family: var(--font-body);
  font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.sub-btn-close-main:hover { background: var(--gold-light); transform: translateY(-1px); }

/* ═══════ PAYMENT STEP ═══════ */
.step-payment { padding: 40px 36px 32px; }

.back-btn {
  background: none; border: none; color: var(--text-3); cursor: pointer;
  font-size: 13px; font-weight: 600; margin-bottom: 24px;
  display: flex; align-items: center; gap: 4px; padding: 0;
  transition: color 0.15s;
}
.back-btn:hover { color: var(--text); }

.pay-header { text-align: center; margin-bottom: 28px; }
.pay-plan-badge {
  display: inline-block; background: var(--gold-dim); border: 1px solid var(--gold-border);
  color: var(--gold); font-size: 12px; font-weight: 700; padding: 5px 14px;
  border-radius: 20px; margin-bottom: 12px;
}
.pay-amount {
  font-family: var(--font-display); font-size: 42px; color: var(--text); line-height: 1;
}
.pay-amount span { font-size: 18px; color: var(--text-3); }
.pay-subtitle { font-size: 13px; color: var(--text-3); margin-top: 6px; }

.pay-methods {
  display: flex; gap: 8px; margin-bottom: 24px;
  background: var(--bg-raised); padding: 4px; border-radius: 12px;
}
.pay-method-btn {
  flex: 1; padding: 10px 8px; border: none; border-radius: 9px; cursor: pointer;
  font-family: var(--font-body); font-size: 13px; font-weight: 600;
  background: transparent; color: var(--text-3);
  transition: all 0.15s;
}
.pay-method-btn.active { background: var(--bg-card); color: var(--text); box-shadow: var(--shadow-sm); }

.pay-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
.pay-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pay-field { display: flex; flex-direction: column; gap: 6px; }
.pay-field label { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-3); }

.pay-input {
  width: 100%; padding: 13px 16px;
  background: var(--bg-input); border: 1.5px solid var(--border-md);
  border-radius: 10px; color: var(--text);
  font-family: var(--font-mono); font-size: 15px; font-weight: 500;
  outline: none; transition: border-color 0.15s;
}
.pay-input::placeholder { color: var(--text-3); font-family: var(--font-body); font-weight: 400; }
.pay-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-dim); }

.upi-hint { font-size: 12px; color: var(--text-3); text-align: center; padding: 8px 0; }

.netbank-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.netbank-btn {
  padding: 14px; background: var(--bg-raised); border: 1.5px solid var(--border);
  border-radius: 10px; text-align: center; font-size: 14px; font-weight: 600;
  color: var(--text-2); cursor: pointer; transition: all 0.15s;
}
.netbank-btn:hover { border-color: var(--gold-border); color: var(--gold); background: var(--gold-dim); }

.pay-error {
  background: var(--red-dim); border: 1px solid rgba(214,48,49,0.3);
  border-radius: 10px; padding: 10px 16px;
  font-size: 13px; color: var(--red); font-weight: 600;
  margin-bottom: 16px;
}

.pay-submit {
  width: 100%; padding: 16px;
  background: linear-gradient(135deg, var(--gold) 0%, #C9A227 100%);
  color: #000; border: none; border-radius: 14px;
  font-family: var(--font-body); font-size: 16px; font-weight: 800;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 6px 20px rgba(212,175,55,0.3);
  margin-bottom: 12px;
}
.pay-submit:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(212,175,55,0.4); }
.pay-security {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 12px; color: var(--text-3);
}

/* ═══════ PROCESSING STEP ═══════ */
.step-processing {
  padding: 60px 36px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 400px; text-align: center;
}

.processing-ring {
  position: relative; width: 80px; height: 80px;
  margin-bottom: 24px;
}
.processing-ring::before {
  content: ''; position: absolute; inset: 0;
  border-radius: 50%;
  border: 3px solid var(--border-md);
  border-top-color: var(--gold);
  animation: spin 1s linear infinite;
}
.processing-ring__inner {
  position: absolute; inset: 8px;
  border-radius: 50%;
  border: 2px solid var(--border);
  border-bottom-color: var(--gold-light);
  animation: spin 1.5s linear infinite reverse;
}
@keyframes spin { to { transform: rotate(360deg); } }

.processing-logo { position: absolute; font-size: 28px; }
.processing-title { font-family: var(--font-display); font-size: 22px; color: var(--text); margin-bottom: 8px; }
.processing-sub { font-size: 14px; color: var(--text-3); margin-bottom: 28px; }

.processing-steps { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; width: 100%; max-width: 280px; }
.proc-step { font-size: 13px; font-weight: 600; }
.proc-step--done  { color: var(--green); }
.proc-step--active { color: var(--gold); animation: pulse 1.2s ease infinite; }
.proc-step--pending { color: var(--text-3); }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

/* ═══════ SUCCESS STEP ═══════ */
.step-success {
  padding: 48px 36px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 400px; text-align: center; position: relative; overflow: hidden;
}

.success-confetti {
  position: absolute; inset: 0; pointer-events: none; overflow: hidden;
}
.success-confetti span {
  position: absolute;
  color: var(--gold);
  font-size: 16px;
  animation: confettiFall 3s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.25s);
  left: calc(var(--i) * 8%);
  top: -20px;
  opacity: 0;
}
@keyframes confettiFall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(600px) rotate(720deg); opacity: 0; }
}

.success-icon { font-size: 64px; margin-bottom: 16px; animation: popIn 0.5s cubic-bezier(0.16,1,0.3,1); }
@keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.success-title {
  font-family: var(--font-display); font-size: 36px;
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  margin-bottom: 6px;
}
.success-plan { font-size: 14px; color: var(--text-3); margin-bottom: 28px; }

.success-perks {
  display: flex; flex-direction: column; gap: 12px;
  width: 100%; max-width: 360px; margin-bottom: 32px;
}
.success-perk {
  display: flex; align-items: center; gap: 14px;
  background: var(--bg-raised); border: 1px solid var(--border);
  border-radius: 12px; padding: 14px 18px; text-align: left;
  animation: slideUp 0.4s ease both;
}
.success-perk:nth-child(2) { animation-delay: 0.1s; }
.success-perk:nth-child(3) { animation-delay: 0.2s; }
@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

.success-perk__icon { font-size: 24px; flex-shrink: 0; }
.success-perk__label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); margin-bottom: 3px; }
.success-perk__val { font-size: 14px; font-weight: 700; color: var(--text); }

.success-cta {
  padding: 16px 40px;
  background: linear-gradient(135deg, var(--gold) 0%, #C9A227 100%);
  color: #000; border: none; border-radius: 16px;
  font-family: var(--font-body); font-size: 16px; font-weight: 800;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 8px 24px rgba(212,175,55,0.35);
}
.success-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(212,175,55,0.45); }

/* ═══════ TRANSITIONS ═══════ */
.sub-modal-enter-active { animation: subModalIn 0.4s cubic-bezier(0.16,1,0.3,1); }
.sub-modal-leave-active { animation: subModalOut 0.25s ease; }
@keyframes subModalIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes subModalOut {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.95); }
}

/* ═══════ RESPONSIVE ═══════ */
@media (max-width: 640px) {
  .step-plans, .step-payment { padding: 32px 20px 24px; }
  .plan-cards { grid-template-columns: 1fr; }
  .sub-modal { max-height: 95vh; border-radius: 20px 20px 0 0; align-self: flex-end; }
  .sub-overlay { padding: 0; align-items: flex-end; }
  .pay-row { grid-template-columns: 1fr; }
}
</style>
