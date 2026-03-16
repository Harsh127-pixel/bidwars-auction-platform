<!-- FILE: frontend/src/pages/Wallet.vue -->
<script setup>
import PaymentForm from '../components/PaymentForm.vue'

const authStore = useAuthStore()
const notification = useNotification()
const history = ref([])
const loading = ref(true)
const topupAmount = ref(100000)
const topupLoading = ref(false)
const showTopup = ref(false)
const historyFilter = ref('all')

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
const totalWealth = computed(() => (authStore.user?.credits || 0) + (authStore.user?.heldCredits || 0))
const availablePct = computed(() => totalWealth.value ? Math.round((authStore.user?.credits || 0) / totalWealth.value * 100) : 100)

const quickAmounts = [25000, 100000, 500000, 1000000]
const fmtQuick = (n) => n >= 1000000 ? (n / 1000000) + 'M' : (n / 1000) + 'K'
const txTypes = { all: 'All', credit: 'Credits', debit: 'Debits' }

const filteredHistory = computed(() => {
  if (historyFilter.value === 'credit') return history.value.filter(t => t.amount >= 0)
  if (historyFilter.value === 'debit')  return history.value.filter(t => t.amount < 0)
  return history.value
})

const simulateTopup = async () => {
  if (!topupAmount.value || topupAmount.value <= 0) return
  topupLoading.value = true
  try {
    await api.post('/api/wallet/topup', { amount: topupAmount.value })
    notification.add(`₹${Number(topupAmount.value).toLocaleString()} added!`, 'success')
    showTopup.value = false
    await fetchHistory()
  } catch { notification.add('Top-up failed.', 'error') }
  finally { topupLoading.value = false }
}

const fetchHistory = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/wallet/history')
    history.value = res.data
  } catch { notification.add('Could not load history.', 'error') }
  finally { loading.value = false }
}

const fmtDate = (ts) => {
  if (!ts) return ''
  try {
    const d = ts._seconds ? new Date(ts._seconds * 1000) : (ts.toDate ? ts.toDate() : new Date(ts))
    if (isNaN(d.getTime())) return ''
    const diff = Date.now() - d
    if (diff < 60000)    return 'Just now'
    if (diff < 3600000)  return Math.floor(diff / 60000) + 'm ago'
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '' }
}

const fmtType = (type) => ({
  WALLET_TOPUP: 'Deposit', BID_HOLD: 'Bid Reserved', BID_REFUND: 'Bid Refunded',
  BUY_IT_NOW: 'Buy It Now', BID_WIN_FINAL: 'Auction Won', ESCROW_PAYOUT: 'Escrow Released',
  DISPUTE_REFUND: 'Dispute Refund', ADMIN_TOPUP: 'Admin Adjustment',
}[type] || type?.replace(/_/g, ' ') || 'Transaction')

const txIcon = (type) => ({ WALLET_TOPUP:'↓', BID_HOLD:'⊠', BID_REFUND:'↩',
  BUY_IT_NOW:'⚡', BID_WIN_FINAL:'★', ESCROW_PAYOUT:'✓', DISPUTE_REFUND:'↩', ADMIN_TOPUP:'⊕' }[type] || '•')

onMounted(fetchHistory)
</script>

<template>
  <div class="wallet-page">

    <!-- HERO -->
    <div class="balance-hero">
      <div class="balance-hero__glow"></div>
      <div class="page-wrap">
        <div class="balance-hero__inner">
          <div class="balance-hero__left">
            <div class="hero-eyebrow">Available Balance</div>
            <div class="hero-amount">{{ fmt(authStore.user?.credits) }}</div>
            <div class="hero-chips">
              <span class="hero-chip">
                <span class="chip-dot chip-dot--orange"></span>
                {{ fmt(authStore.user?.heldCredits) }} in escrow
              </span>
              <span class="hero-chip">
                <span class="chip-dot chip-dot--muted"></span>
                {{ fmt(totalWealth) }} total
              </span>
            </div>
          </div>
          <div class="balance-hero__right">
            <div class="ring-wrap">
              <svg viewBox="0 0 80 80" class="ring-svg">
                <circle cx="40" cy="40" r="34" class="ring-track"/>
                <circle cx="40" cy="40" r="34" class="ring-fill"
                  :style="`stroke-dashoffset:${213.6 - 213.6 * availablePct / 100}`"/>
              </svg>
              <div class="ring-label">
                <div class="ring-pct">{{ availablePct }}%</div>
                <div class="ring-sub">free</div>
              </div>
            </div>
            <button class="btn-add" @click="showTopup = true">
              <span class="btn-add__plus">+</span> Add Funds
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="page-wrap wallet-body">

      <!-- STAT TILES -->
      <div class="stat-row fade-up">
        <div class="stat-tile fade-up" v-for="(tile, i) in [
          { icon:'↓', cls:'--orange', val: history.filter(t=>t.amount>0).length,  label:'Deposits'  },
          { icon:'↑', cls:'--red',    val: history.filter(t=>t.amount<0).length,  label:'Debits'    },
          { icon:'★', cls:'--green',  val: history.filter(t=>t.type==='BID_WIN_FINAL').length, label:'Wins' },
          { icon:'Σ', cls:'--muted',  val: history.length,                         label:'All Txns'  },
        ]" :key="i" :style="`animation-delay:${i*0.06}s`">
          <div class="tile-icon" :class="`tile-icon${tile.cls}`">{{ tile.icon }}</div>
          <div class="tile-val">{{ tile.val }}</div>
          <div class="tile-label">{{ tile.label }}</div>
        </div>
      </div>

      <!-- PAYMENT FORM -->
      <div class="payment-section fade-up fade-up-1">
        <PaymentForm @payment-success="fetchHistory" />
      </div>

      <!-- HISTORY -->
      <div class="history-card fade-up fade-up-2">
        <div class="history-head">
          <h2 class="history-title">Transactions</h2>
          <div class="history-filters">
            <button v-for="(label, key) in txTypes" :key="key"
              class="fpill" :class="{'fpill--on': historyFilter === key}"
              @click="historyFilter = key">{{ label }}</button>
          </div>
          <button class="refresh-btn" @click="fetchHistory" :disabled="loading">
            <span :class="{'spin': loading}">↻</span>
          </button>
        </div>

        <div v-if="loading" class="tx-list">
          <div v-for="n in 5" :key="n" class="tx-skel"></div>
        </div>

        <TransitionGroup v-else-if="filteredHistory.length" name="tx" tag="div" class="tx-list">
          <div v-for="tx in filteredHistory" :key="tx.id" class="tx-row">
            <div class="tx-ico" :class="tx.amount >= 0 ? 'tx-ico--cr' : 'tx-ico--db'">{{ txIcon(tx.type) }}</div>
            <div class="tx-info">
              <div class="tx-name">{{ fmtType(tx.type) }}</div>
              <div class="tx-sub">
                <span v-if="tx.auctionId" class="tx-id">{{ tx.auctionId.slice(0,8).toUpperCase() }}</span>
                <span class="tx-date">{{ fmtDate(tx.createdAt) }}</span>
              </div>
            </div>
            <div class="tx-right">
              <div class="tx-amt" :class="tx.amount >= 0 ? 'tx-amt--cr' : 'tx-amt--db'">
                {{ tx.amount >= 0 ? '+' : '' }}{{ fmt(tx.amount) }}
              </div>
              <div class="tx-bal">{{ fmt(tx.newBalance) }}</div>
            </div>
          </div>
        </TransitionGroup>

        <div v-else class="tx-empty">
          <div class="tx-empty__icon">◈</div>
          <div class="tx-empty__title">No transactions yet</div>
          <div class="tx-empty__sub">Add funds to get started</div>
          <button class="btn-add btn-add--sm" style="margin-top:16px" @click="showTopup=true">+ Add Funds</button>
        </div>
      </div>

    </div>

    <!-- ADD FUNDS DRAWER -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="showTopup" class="drawer-overlay" @click.self="showTopup = false">
          <div class="drawer">
            <div class="drawer-handle"></div>
            <div class="drawer-head">
              <h3 class="drawer-title">Add Funds</h3>
              <button class="drawer-close" @click="showTopup = false">✕</button>
            </div>
            <div class="drawer-body">

              <div class="balance-preview">
                <div class="preview-label">Current Balance</div>
                <div class="preview-val">{{ fmt(authStore.user?.credits) }}</div>
                <Transition name="fade">
                  <div v-if="topupAmount > 0" class="preview-after">
                    → {{ fmt((authStore.user?.credits || 0) + topupAmount) }} after deposit
                  </div>
                </Transition>
              </div>

              <div class="quick-grid">
                <button v-for="amt in quickAmounts" :key="amt"
                  class="quick-chip" :class="{'quick-chip--on': topupAmount === amt}"
                  @click="topupAmount = amt">
                  ₹{{ fmtQuick(amt) }}
                </button>
              </div>

              <div class="field-wrap" style="margin-top:20px">
                <label class="field-label">Custom amount</label>
                <div class="amt-wrap">
                  <span class="amt-prefix">₹</span>
                  <input v-model.number="topupAmount" type="number" min="100"
                    class="field amt-field" placeholder="0" />
                </div>
              </div>

              <button class="btn-deposit" :disabled="topupLoading || !topupAmount || topupAmount <= 0" @click="simulateTopup">
                <span v-if="topupLoading" class="dep-spin"></span>
                <span v-else>↓</span>
                {{ topupLoading ? 'Processing…' : `Deposit ${topupAmount > 0 ? fmt(topupAmount) : ''}` }}
              </button>

              <div class="drawer-note">No processing fees · Instant credit</div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.wallet-page { min-height: 100vh; background: var(--bg); }

/* HERO */
.balance-hero { position: relative; padding: 44px 0 52px; overflow: hidden; }
.balance-hero__glow {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 70% 120% at 5% 60%, rgba(251,146,60,0.09) 0%, transparent 65%),
              radial-gradient(ellipse 50% 70% at 95% 10%, rgba(251,146,60,0.05) 0%, transparent 55%);
}
.balance-hero__inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.hero-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--orange); margin-bottom: 12px; }
.hero-amount {
  font-family: var(--font-display); font-size: clamp(38px, 6vw, 68px);
  font-weight: 600; color: var(--text); letter-spacing: -0.02em; line-height: 1; margin-bottom: 18px;
  animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes slideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
.hero-chips { display: flex; gap: 10px; flex-wrap: wrap; }
.hero-chip {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--text-2);
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 5px 13px;
}
.chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.chip-dot--orange { background: var(--orange); }
.chip-dot--muted  { background: var(--text-3); }

.balance-hero__right { display: flex; align-items: center; gap: 24px; flex-shrink: 0; }

/* Ring */
.ring-wrap { position: relative; width: 80px; height: 80px; flex-shrink: 0; }
.ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-track { fill: none; stroke: var(--bg-raised); stroke-width: 8; }
.ring-fill {
  fill: none; stroke: var(--orange); stroke-width: 8; stroke-linecap: round;
  stroke-dasharray: 213.6; transition: stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1);
}
.ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ring-pct { font-size: 15px; font-weight: 700; color: var(--text); line-height: 1; }
.ring-sub { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; }

/* Add button */
.btn-add {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 22px; background: var(--orange); color: #fff;
  border: none; border-radius: 12px; font-family: var(--font-body); font-size: 14px; font-weight: 700;
  cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(251,146,60,0.3);
}
.btn-add:hover { background: #f97316; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(251,146,60,0.4); }
.btn-add:active { transform: translateY(0); }
.btn-add--sm { padding: 9px 18px; font-size: 13px; }
.btn-add__plus {
  width: 20px; height: 20px; background: rgba(255,255,255,0.25); border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 15px; line-height: 1;
}

/* BODY */
.wallet-body { padding-bottom: 64px; }

/* STAT TILES */
.stat-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 28px; }
.stat-tile {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px;
  padding: 18px 20px; display: flex; flex-direction: column; gap: 5px;
  transition: border-color 0.2s, transform 0.2s;
}
.stat-tile:hover { border-color: var(--border-md); transform: translateY(-2px); }
.tile-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; margin-bottom: 4px; }
.tile-icon--orange { background: var(--orange-dim); color: var(--orange); }
.tile-icon--red    { background: var(--red-dim);    color: var(--red); }
.tile-icon--green  { background: var(--green-dim);  color: var(--green); }
.tile-icon--muted  { background: var(--bg-raised);  color: var(--text-2); }
.tile-val   { font-family: var(--font-display); font-size: 26px; color: var(--text); line-height: 1; }
.tile-label { font-size: 12px; color: var(--text-3); }

/* HISTORY CARD */
.history-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
.history-head {
  display: flex; align-items: center; gap: 12px;
  padding: 18px 24px; border-bottom: 1px solid var(--border); flex-wrap: wrap;
}
.history-title { font-family: var(--font-display); font-size: 18px; font-weight: 600; color: var(--text); flex: 1; min-width: 80px; }
.history-filters { display: flex; gap: 5px; }
.fpill {
  padding: 5px 13px; border-radius: 20px; border: 1px solid var(--border-md);
  background: transparent; color: var(--text-2); font-family: var(--font-body); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.fpill:hover { background: var(--bg-hover); color: var(--text); }
.fpill--on { background: var(--orange-dim); border-color: rgba(251,146,60,0.3); color: var(--orange); }
.refresh-btn {
  width: 32px; height: 32px; background: var(--bg-raised); border: 1px solid var(--border-md);
  border-radius: 8px; cursor: pointer; color: var(--text-2); font-size: 15px;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0;
}
.refresh-btn:hover { color: var(--text); }
.spin { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.tx-list { padding: 6px 0; }
.tx-skel {
  height: 62px; margin: 4px 16px; border-radius: 10px;
  background: linear-gradient(90deg, var(--bg-raised) 25%, var(--bg-hover) 50%, var(--bg-raised) 75%);
  background-size: 200% 100%; animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer { to { background-position: -200% 0; } }

.tx-row {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 24px; border-bottom: 1px solid var(--border); transition: background 0.15s;
}
.tx-row:last-child { border-bottom: none; }
.tx-row:hover { background: var(--bg-raised); }
.tx-ico {
  width: 38px; height: 38px; flex-shrink: 0; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 15px;
}
.tx-ico--cr { background: var(--green-dim); color: var(--green); }
.tx-ico--db { background: var(--red-dim);   color: var(--red); }
.tx-info { flex: 1; min-width: 0; }
.tx-name { font-size: 14px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tx-sub  { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
.tx-id   { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); }
.tx-date { font-size: 12px; color: var(--text-3); }
.tx-right { text-align: right; flex-shrink: 0; }
.tx-amt  { font-size: 15px; font-weight: 700; }
.tx-amt--cr { color: var(--green); }
.tx-amt--db { color: var(--red); }
.tx-bal  { font-size: 12px; color: var(--text-3); margin-top: 2px; }
.tx-enter-active { transition: all 0.25s ease; }
.tx-enter-from   { opacity: 0; transform: translateX(-10px); }

.tx-empty { padding: 52px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.tx-empty__icon  { font-size: 32px; color: var(--text-3); opacity: 0.35; }
.tx-empty__title { font-family: var(--font-display); font-size: 17px; color: var(--text-2); }
.tx-empty__sub   { font-size: 13px; color: var(--text-3); }

/* DRAWER */
.drawer-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 400;
  display: flex; align-items: flex-end; justify-content: center;
}
.drawer {
  width: 100%; max-width: 520px; background: var(--bg-card);
  border: 1px solid var(--border-md); border-radius: 24px 24px 0 0;
  max-height: 92vh; overflow-y: auto;
  padding-bottom: max(env(safe-area-inset-bottom, 0px), 16px);
}
.drawer-handle { width: 40px; height: 4px; background: var(--border-strong); border-radius: 2px; margin: 12px auto 0; }
.drawer-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px;
}
.drawer-title { font-family: var(--font-display); font-size: 20px; font-weight: 600; color: var(--text); }
.drawer-close {
  width: 32px; height: 32px; background: var(--bg-raised); border: none; border-radius: 50%;
  color: var(--text-2); font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: background 0.15s;
}
.drawer-close:hover { background: var(--bg-hover); color: var(--text); }
.drawer-body { padding: 0 24px 24px; }

.balance-preview {
  background: var(--bg-raised); border: 1px solid var(--border-md);
  border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;
}
.preview-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); margin-bottom: 4px; }
.preview-val   { font-family: var(--font-display); font-size: 28px; color: var(--text); }
.preview-after { font-size: 13px; color: var(--orange); margin-top: 6px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }

.quick-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
.quick-chip {
  padding: 10px 4px; background: var(--bg-raised); border: 1px solid var(--border-md); border-radius: 10px;
  color: var(--text-2); font-family: var(--font-body); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; text-align: center;
}
.quick-chip:hover { background: var(--bg-hover); color: var(--text); }
.quick-chip--on { background: var(--orange-dim); border-color: rgba(251,146,60,0.3); color: var(--orange); }

.amt-wrap { position: relative; }
.amt-prefix { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; color: var(--text-2); pointer-events: none; }
.amt-field { padding-left: 30px !important; font-size: 18px !important; font-weight: 600; }

.btn-deposit {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 16px; background: var(--orange); color: #fff; border: none; border-radius: 12px;
  font-family: var(--font-body); font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 20px;
  transition: all 0.2s; box-shadow: 0 4px 20px rgba(251,146,60,0.28);
}
.btn-deposit:hover:not(:disabled) { background: #f97316; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(251,146,60,0.4); }
.btn-deposit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
.dep-spin { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
.drawer-note { margin-top: 14px; font-size: 12px; color: var(--text-3); text-align: center; line-height: 1.6; }

/* Drawer animation */
.drawer-enter-active, .drawer-leave-active { transition: opacity 0.25s ease; }
.drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); }
.drawer-enter-from { opacity: 0; }
.drawer-enter-from .drawer { transform: translateY(100%); }
.drawer-leave-to { opacity: 0; }
.drawer-leave-to .drawer { transform: translateY(100%); }

/* RESPONSIVE */
@media (max-width: 640px) {
  .stat-row { grid-template-columns: repeat(2,1fr); }
  .balance-hero__right { display: none; }
  .quick-grid { grid-template-columns: repeat(2,1fr); }
  .tx-row { padding: 12px 16px; gap: 10px; }
  .history-head { padding: 14px 16px; }
}
</style>