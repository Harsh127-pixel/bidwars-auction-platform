<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'
import api from '../services/api'

const authStore = useAuthStore()
const notification = useNotification()
const history = ref([])
const loading = ref(true)
const historyFilter = ref('all')
const selectedTx = ref(null)
const showTxModal = ref(false)
const showDisputeModal = ref(false)
const disputeReason = ref('')
const disputeLoading = ref(false)

const txTypes = { all: 'All', credit: 'Credits', debit: 'Debits' }

const filteredHistory = computed(() => {
  if (historyFilter.value === 'credit') return history.value.filter(t => t.amount >= 0)
  if (historyFilter.value === 'debit')  return history.value.filter(t => t.amount < 0)
  return history.value
})

const fetchHistory = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/wallet/history')
    history.value = Array.isArray(res.data) ? res.data : []
  } catch (err) { 
    notification.add('Could not load history', 'error') 
  }
  finally { loading.value = false }
}

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

const fmtDate = (ts) => {
  if (!ts) return ''
  const d = ts._seconds ? new Date(ts._seconds * 1000) : (ts.toDate ? ts.toDate() : new Date(ts))
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtFullDate = (ts) => {
  if (!ts) return ''
  const d = ts._seconds ? new Date(ts._seconds * 1000) : (ts.toDate ? ts.toDate() : new Date(ts))
  return d.toLocaleString('en-IN', { 
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const fmtType = (type) => ({
  WALLET_TOPUP: 'Deposit', BID_HOLD: 'Bid Reserved', BID_REFUND: 'Bid Refunded',
  BID_WIN_FINAL: 'Auction Won', WITHDRAWAL_REQUEST: 'Withdrawal', ADMIN_TOPUP: 'Admin Adjustment'
}[type] || type?.replace(/_/g, ' ') || 'Transaction')

const txIcon = (type) => ({ WALLET_TOPUP:'↓', BID_HOLD:'⊠', BID_REFUND:'↩',
  BID_WIN_FINAL:'★', WITHDRAWAL_REQUEST:'↑', ADMIN_TOPUP:'⊕' }[type] || '•')

const openTxDetails = (tx) => {
  selectedTx.value = tx
  showTxModal.value = true
}

const canDispute = (tx) => {
  if (!tx) return false
  if (tx.disputed || tx.disputeId) return false
  // Most actionable disputes are auction-related debits
  return !!tx.auctionId && tx.amount < 0
}

const openDispute = () => {
  disputeReason.value = ''
  showDisputeModal.value = true
}

const submitDispute = async () => {
  if (!selectedTx.value || !disputeReason.value.trim()) return
  disputeLoading.value = true
  try {
    await api.post('/api/support/disputes', {
      transactionId: selectedTx.value.id,
      auctionId: selectedTx.value.auctionId,
      reason: disputeReason.value.trim()
    })
    notification.add('Dispute submitted successfully.', 'success')
    showDisputeModal.value = false
    showTxModal.value = false
    await fetchHistory()
  } catch (err) {
    notification.add(err.response?.data?.error || 'Failed to submit dispute.', 'error')
  } finally {
    disputeLoading.value = false
  }
}

onMounted(fetchHistory)
</script>

<template>
  <div class="transactions-page">
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">Financial Ledger</h1>
        <p class="page-sub">Comprehensive history of all your credit movements and settlement records.</p>
      </div>
    </div>

    <div class="container py-8">
      <div class="history-card">
        <div class="history-head">
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
          <div v-for="n in 8" :key="n" class="tx-skel"></div>
        </div>

        <div v-else-if="filteredHistory.length" class="tx-list">
          <div v-for="tx in filteredHistory" :key="tx.id" class="tx-row" @click="openTxDetails(tx)">
            <div class="tx-ico" :class="tx.amount >= 0 ? 'tx-ico--cr' : 'tx-ico--db'">{{ txIcon(tx.type) }}</div>
            <div class="tx-info">
              <div class="tx-name">{{ fmtType(tx.type) }}</div>
              <div class="tx-date">{{ fmtDate(tx.createdAt) }}</div>
            </div>
            <div class="tx-right">
              <div class="tx-amt" :class="tx.amount >= 0 ? 'tx-amt--cr' : 'tx-amt--db'">
                {{ tx.amount >= 0 ? '+' : '' }}{{ fmt(tx.amount) }}
              </div>
              <div class="tx-bal">Balance: {{ fmt(tx.newBalance) }}</div>
            </div>
          </div>
        </div>

        <div v-else class="tx-empty">
          <div class="tx-empty__icon">◈</div>
          <p>No transaction records found.</p>
        </div>
      </div>
    </div>

    <!-- DETAILS MODAL -->
    <Teleport to="body">
      <div v-if="showTxModal" class="modal-overlay" @click.self="showTxModal = false">
        <div class="modal tx-modal">
          <div class="modal-head">
            <h3>Transaction Details</h3>
            <button @click="showTxModal = false">✕</button>
          </div>
          <div v-if="selectedTx" class="modal-body">
            <div class="receipt-header">
              <div class="receipt-icon" :class="selectedTx.amount >= 0 ? 'cr' : 'db'">{{ txIcon(selectedTx.type) }}</div>
              <div class="receipt-amt" :class="selectedTx.amount >= 0 ? 'cr' : 'db'">
                {{ selectedTx.amount >= 0 ? '+' : '' }}{{ fmt(selectedTx.amount) }}
              </div>
              <div class="receipt-type">{{ fmtType(selectedTx.type) }}</div>
            </div>
            
            <div class="receipt-details">
              <div class="rd-row"><span>Reference</span><span class="t-mono">{{ selectedTx.id }}</span></div>
              <div v-if="selectedTx.auctionId" class="rd-row"><span>Auction ID</span><span class="t-mono">{{ selectedTx.auctionId }}</span></div>
              <div class="rd-row"><span>Timestamp</span><span>{{ fmtFullDate(selectedTx.createdAt) }}</span></div>
              <div class="rd-row"><span>Status</span><span class="badge badge-success">COMPLETED</span></div>
              <div v-if="selectedTx.disputed || selectedTx.disputeId" class="rd-row"><span>Dispute</span><span class="badge badge-dispute">Raised</span></div>
              <div class="rd-divider"></div>
              <div class="rd-row"><span>Previous</span><span>{{ fmt(selectedTx.prevBalance) }}</span></div>
              <div class="rd-row"><span>New Balance</span><span class="font-bold">{{ fmt(selectedTx.newBalance) }}</span></div>

              <div class="rd-actions">
                <button v-if="canDispute(selectedTx)" class="btn-dispute" @click="openDispute">Raise Dispute</button>
                <div v-else-if="!selectedTx.auctionId" class="rd-hint">Dispute available for auction-linked debits only.</div>
                <div v-else-if="selectedTx.disputed || selectedTx.disputeId" class="rd-hint">A dispute is already linked to this transaction.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- DISPUTE MODAL -->
    <Teleport to="body">
      <div v-if="showDisputeModal" class="modal-overlay" @click.self="showDisputeModal = false">
        <div class="modal tx-modal">
          <div class="modal-head">
            <h3>Raise Transaction Dispute</h3>
            <button @click="showDisputeModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="field-wrap">
              <label class="field-label">Reason</label>
              <textarea v-model="disputeReason" rows="4" class="field" placeholder="Describe the issue with this transaction..."></textarea>
            </div>
            <div class="rd-actions" style="margin-top:14px; justify-content:flex-end">
              <button class="btn-cancel" @click="showDisputeModal = false">Cancel</button>
              <button class="btn-dispute" :disabled="disputeLoading || !disputeReason.trim()" @click="submitDispute">
                {{ disputeLoading ? 'Submitting...' : 'Submit Dispute' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.transactions-page { min-height: 100vh; background: var(--bg); }
.page-header { background: var(--bg-raised); border-bottom: 1px solid var(--border); padding: 48px 0; }
.page-title { font-family: var(--font-display); font-size: 32px; font-weight: 800; color: var(--text); margin-bottom: 8px; }
.page-sub { color: var(--text-3); font-size: 16px; max-width: 600px; }

.history-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.history-head { padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.history-filters { display: flex; gap: 8px; }

.fpill { padding: 6px 16px; border-radius: 20px; border: 1px solid var(--border); background: transparent; color: var(--text-2); font-size: 13px; font-weight: 600; cursor: pointer; }
.fpill--on { background: var(--yellow-dim); border-color: var(--yellow); color: var(--yellow); }

.tx-list { padding: 8px 0; }
.tx-row { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-bottom: 1px solid var(--border); transition: background 0.2s; cursor: pointer; }
.tx-row:hover { background: var(--bg-raised); }
.tx-ico { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.tx-ico--cr { background: var(--green-dim); color: var(--green); }
.tx-ico--db { background: var(--red-dim); color: var(--red); }

.tx-info { flex: 1; }
.tx-name { font-weight: 600; color: var(--text); font-size: 15px; }
.tx-date { font-size: 12px; color: var(--text-3); }

.tx-right { text-align: right; }
.tx-amt { font-weight: 700; font-size: 16px; }
.tx-amt--cr { color: var(--green); }
.tx-amt--db { color: var(--red); }
.tx-bal { font-size: 12px; color: var(--text-3); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.tx-modal { background: var(--bg-card); border: 1px solid var(--border-md); border-radius: 16px; width: 100%; max-width: 400px; overflow: hidden; }
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); }
.receipt-header { padding: 32px 20px; text-align: center; background: var(--bg-raised); }
.receipt-icon { width: 60px; height: 60px; margin: 0 auto 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.receipt-icon.cr { background: var(--green-dim); color: var(--green); }
.receipt-icon.db { background: var(--red-dim); color: var(--red); }
.receipt-amt { font-size: 32px; font-weight: 800; font-family: var(--font-display); }
.receipt-type { font-size: 13px; color: var(--text-3); text-transform: uppercase; margin-top: 4px; }
.receipt-details { padding: 20px; }
.rd-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 13px; }
.rd-divider { height: 1px; background: var(--border); margin: 12px 0; }

.container { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
.py-8 { padding-top: 32px; padding-bottom: 32px; }
.badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
.badge-success { background: var(--green-dim); color: var(--green); }
.badge-dispute { background: var(--orange-dim); color: var(--orange); }
.font-bold { font-weight: 700; }
.t-mono { font-family: var(--font-mono); }

.rd-actions { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.rd-hint { font-size: 12px; color: var(--text-3); }
.btn-dispute {
  border: 1px solid rgba(225,112,85,0.35);
  background: var(--orange-dim);
  color: var(--orange);
  border-radius: 8px;
  font-weight: 700;
  font-size: 12px;
  padding: 8px 12px;
  cursor: pointer;
}
.btn-dispute:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-cancel {
  border: 1px solid var(--border-md);
  background: transparent;
  color: var(--text-2);
  border-radius: 8px;
  font-size: 12px;
  padding: 8px 12px;
  cursor: pointer;
}
</style>
