<!-- FILE: frontend/src/pages/Wallet.vue -->
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'
import api from '../services/api'
import socket from '../services/socket'
import PaymentForm from '../components/PaymentForm.vue'
import RazorpayModal from '../components/RazorpayModal.vue'

const authStore = useAuthStore()
const notification = useNotification()
const history = ref([])
const loading = ref(true)
const topupAmount = ref(100)
const topupLoading = ref(false)
const showTopup = ref(false)
const showRzp = ref(false)
const rzpData = ref({ orderId: '', key: '', amount: 0 })
const historyFilter = ref('all')
const selectedTx = ref(null)
const showTxModal = ref(false)
const showDisputeModal = ref(false)
const disputeReason = ref('')
const disputeLoading = ref(false)

const showWithdraw = ref(false)
const withdrawAmount = ref('')
const bankDetails = ref({ accountNo: '', confirmAccountNo: '', ifsc: '', name: '' })
const withdrawLoading = ref(false)

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

const handleTopup = async () => {
  if (!topupAmount.value || topupAmount.value < 100) return notification.add('Min ₹100', 'error')
  topupLoading.value = true
  try {
    const res = await api.post('/api/payments/create-order', { amount: topupAmount.value })
    rzpData.value = { 
      orderId: res.data.orderId || res.data.id, 
      key: res.data.key, 
      amount: res.data.amount 
    }
    showRzp.value = true
  } catch {
    notification.add('Failed to initiate topup.', 'error')
  } finally {
    topupLoading.value = false
  }
}

const simulateTopup = handleTopup

const handlePaymentSuccess = async (data) => {
  topupLoading.value = true
  try {
    await api.post('/api/payments/verify', data)
    notification.add(`₹${Number(topupAmount.value).toLocaleString()} added to your wallet! (No Processing Fee)`, 'success')
    authStore.init() // Refresh user data for balance
    await fetchHistory()
  } catch (e) {
    notification.add('Payment verification failed.', 'error')
  } finally {
    topupLoading.value = false
  }
}

const handlePaymentError = (err) => {
  notification.add(err.message || 'Payment failed', 'error')
}

const handlePaymentClose = () => {
  // notification.add('Payment cancelled', 'info')
}

const fetchHistory = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/wallet/history')
    history.value = Array.isArray(res.data) ? res.data : []
    console.log('[Wallet] History loaded:', history.value.length)
  } catch (err) { 
    console.error('[Wallet] Load Error:', err)
    notification.add('Could not load history: ' + (err.message || 'Unknown error'), 'error') 
  }
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

const openTxDetails = (tx) => {
  selectedTx.value = tx
  showTxModal.value = true
}

const handleWithdraw = async () => {
  const amt = Number(withdrawAmount.value)
  if (!amt || amt < 100) return notification.add('Min withdrawal ₹100', 'error')
  if (amt > (authStore.user?.credits || 0)) return notification.add('Insufficient funds', 'error')
  if (bankDetails.value.accountNo !== bankDetails.value.confirmAccountNo) return notification.add('Account numbers do not match', 'error')
  if (!bankDetails.value.ifsc || !bankDetails.value.name || !bankDetails.value.accountNo) return notification.add('Please fill all bank details', 'error')

  withdrawLoading.value = true
  try {
    const res = await api.post('/api/wallet/withdraw', {
      amount: amt,
      method: 'bank',
      details: {
        accountNo: bankDetails.value.accountNo,
        ifsc: bankDetails.value.ifsc,
        name: bankDetails.value.name
      }
    })
    const deduction = res.data?.totalDeduction || (amt * 1.01)
    const fee = deduction - amt
    notification.add(`Withdrawal Requested: ₹${amt}. Processing Fee: ₹${fee}. Total Deduction: ₹${deduction}.`, 'success')
    showWithdraw.value = false
    withdrawAmount.value = ''
    bankDetails.value = { accountNo: '', confirmAccountNo: '', ifsc: '', name: '' }
    authStore.init() // refresh balance
    await fetchHistory()
  } catch (e) {
    notification.add(e.response?.data?.error || 'Withdrawal failed', 'error')
  } finally {
    withdrawLoading.value = false
  }
}

const disputeReasons = [
  'Incorrect amount charged',
  'Transaction not recognized',
  'Double charged',
  'Service not received',
  'Unauthorized transaction',
  'Price mismatch',
  'Other'
]
const selectedDisputeReason = ref('')

const raiseDispute = () => {
  disputeReason.value = ''
  selectedDisputeReason.value = ''
  showDisputeModal.value = true
}

const submitDispute = async () => {
  const reason = selectedDisputeReason.value === 'Other' 
    ? disputeReason.value.trim() 
    : selectedDisputeReason.value
  if (!reason) return notification.add('Please select or enter a reason', 'error')
  disputeLoading.value = true
  try {
    // 1. Create the dispute
    await api.post('/api/disputes', {
      transactionId: selectedTx.value.id,
      auctionId: selectedTx.value.auctionId,
      reason
    })
    // 2. Auto-create a support ticket (chat) linked to the dispute
    await api.post('/api/support/tickets', {
      subject: `Dispute: ${fmtType(selectedTx.value.type)} — ${fmt(selectedTx.value.amount)}`,
      message: `I am disputing transaction ${selectedTx.value.id}.\n\nReason: ${reason}\n\nTransaction details:\n- Type: ${fmtType(selectedTx.value.type)}\n- Amount: ${fmt(selectedTx.value.amount)}\n- Date: ${fmtFullDate(selectedTx.value.createdAt)}`
    })
    notification.add('Dispute raised & support chat created. Check your chat for updates.', 'success')
    showDisputeModal.value = false
    showTxModal.value = false
    await fetchHistory()
  } catch {
    notification.add('Failed to raise dispute.', 'error')
  } finally {
    disputeLoading.value = false
  }
}

const openSupportChat = () => {
  showTxModal.value = false
  // Trigger the floating chat to open by emitting a custom event
  window.dispatchEvent(new CustomEvent('open-support-chat'))
}

const fmtFullDate = (ts) => {
  if (!ts) return ''
  const d = ts._seconds ? new Date(ts._seconds * 1000) : (ts.toDate ? ts.toDate() : new Date(ts))
  return d.toLocaleString('en-IN', { 
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const copyUid = () => {
  if (!authStore.user?.uid) return
  navigator.clipboard.writeText(authStore.user.uid)
  notification.add('Wallet ID copied to clipboard', 'info')
}

// Real-time wallet updates via Socket.IO
const handleWalletUpdate = (data) => {
  if (data.userId === authStore.user?.uid) {
    authStore.init() // Refresh balance
    fetchHistory()   // Refresh transactions
    notification.add(`Wallet updated: ${fmtType(data.type)}`, 'info')
  }
}

const handleDisputeUpdate = (data) => {
  if (data.userId === authStore.user?.uid) {
    notification.add(`Dispute update: ${data.status}`, data.status === 'resolved' ? 'success' : 'info')
    fetchHistory()
  }
}

onMounted(() => {
  fetchHistory()
  socket.on('walletUpdate', handleWalletUpdate)
  socket.on('disputeUpdate', handleDisputeUpdate)
})

onUnmounted(() => {
  socket.off('walletUpdate', handleWalletUpdate)
  socket.off('disputeUpdate', handleDisputeUpdate)
})
</script>

<template>
  <div class="wallet-page">

    <!-- HERO -->
    <div class="balance-hero balance-hero--centered">
      <div class="balance-hero__glow"></div>
      <div class="page-wrap hero-wrap">
          <div class="balance-card fade-up">
            <div class="card-glow"></div>
            <div class="bc-label">Available Balance</div>
            <div class="bc-val bc-val--huge">{{ fmt(authStore.user?.credits) }}</div>
            <div class="bc-sub">Escrow (Held): {{ fmt(authStore.user?.heldCredits) }}</div>
            
            <div v-if="authStore.user?.uid" class="wallet-id-tag" title="Click to copy Wallet ID" @click="copyUid">
              ID: {{ authStore.user.uid.slice(0, 8) }}...{{ authStore.user.uid.slice(-4) }}
              <v-icon size="12" class="ml-1">mdi-content-copy</v-icon>
            </div>

            <div class="wallet-actions">
              <button class="btn-add-funds" @click="showTopup = true">
                Add Funds +
              </button>
              <button class="btn-withdraw" @click="showWithdraw = true">
                Withdraw ↑
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
          <div v-for="tx in filteredHistory" :key="tx.id" class="tx-row" @click="openTxDetails(tx)">
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
            <!-- Inline Dispute Action -->
            <div v-if="authStore.role !== 'admin' && authStore.role !== 'employee'" class="tx-inline-actions" @click.stop>
              <div v-if="tx.disputed" class="disputed-badge-inline" title="Dispute Active" @click="openSupportChat">
                <span style="font-size:14px">⚠️</span>
              </div>
              <button v-else-if="tx.status !== 'pending' && tx.type !== 'WALLET_TOPUP'" class="btn-dispute-inline" @click.stop="openTxDetails(tx); raiseDispute()">
                Dispute
              </button>
            </div>
          </div>
        </TransitionGroup>

        <div v-else class="tx-empty">
          <div class="tx-empty__icon">◈</div>
          <div class="tx-empty__title">No transactions yet</div>
          <div class="tx-empty__sub">Add funds to get started</div>
        </div>
      </div>

    </div>

    <RazorpayModal
      v-model="showRzp"
      :amount="rzpData.amount"
      :order-id="rzpData.orderId"
      :razorpay-key="rzpData.key"
      @success="handlePaymentSuccess"
      @error="handlePaymentError"
      @close="handlePaymentClose"
    />

    <!-- ADD FUNDS MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showTopup" class="modal-overlay" @click.self="showTopup = false">
          <div class="modal deposit-modal fade-up">
            <div class="modal-head">
              <h3 class="modal-title">Add Funds</h3>
              <button class="modal-close" @click="showTopup = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="quick-grid">
                <button v-for="amt in quickAmounts" :key="amt"
                  class="quick-chip" :class="{'quick-chip--on': topupAmount === amt}"
                  @click="topupAmount = amt">
                  ₹{{ fmtQuick(amt) }}
                </button>
              </div>

              <div class="field-wrap" style="margin-top:20px">
                <label class="field-label">CUSTOM AMOUNT</label>
                <div class="amt-wrap">
                  <span class="amt-prefix">₹</span>
                  <input v-model.number="topupAmount" type="number" min="100"
                    class="field amt-field" placeholder="0" />
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="showTopup = false">Cancel</button>
              <button class="btn btn-primary btn-deposit-full" 
                :disabled="topupLoading || !topupAmount || topupAmount < 100" 
                @click="handleTopup">
                <span v-if="topupLoading" class="dep-spin"></span>
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- WITHDRAW FUNDS MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showWithdraw" class="modal-overlay" @click.self="showWithdraw = false">
          <div class="modal deposit-modal fade-up" style="max-height: 90vh; display: flex; flex-direction: column;">
            <div class="modal-head">
              <h3 class="modal-title">Withdraw to Bank</h3>
              <button class="modal-close" @click="showWithdraw = false">✕</button>
            </div>
            <div class="modal-body" style="overflow-y: auto; flex: 1;">
              <div class="field-wrap">
                <label class="field-label">AMOUNT TO WITHDRAW (₹)</label>
                <div class="amt-wrap">
                  <span class="amt-prefix">₹</span>
                  <input v-model.number="withdrawAmount" type="number" min="100" class="field amt-field" placeholder="100" />
                </div>
                <div style="font-size: 11px; color: var(--text-3); margin-top: 4px;">Available balance: {{ fmt(authStore.user?.credits) }}</div>
              </div>

              <div class="field-wrap" style="margin-top:16px">
                <label class="field-label">ACCOUNT HOLDER NAME</label>
                <input v-model="bankDetails.name" type="text" class="field" placeholder="e.g. John Doe" />
              </div>
              
              <div class="field-wrap" style="margin-top:16px">
                <label class="field-label">ACCOUNT NUMBER</label>
                <input v-model="bankDetails.accountNo" type="password" class="field" placeholder="Enter Account Number" />
              </div>

              <div class="field-wrap" style="margin-top:16px">
                <label class="field-label">CONFIRM ACCOUNT NUMBER</label>
                <input v-model="bankDetails.confirmAccountNo" type="text" class="field" placeholder="Confirm Account Number" />
                <div v-if="bankDetails.accountNo && bankDetails.confirmAccountNo && bankDetails.accountNo !== bankDetails.confirmAccountNo" style="font-size: 11px; color: var(--red); margin-top: 4px;">
                  Account numbers do not match
                </div>
              </div>

              <div class="field-wrap" style="margin-top:16px">
                <label class="field-label">IFSC CODE</label>
                <input v-model="bankDetails.ifsc" type="text" class="field" placeholder="e.g. SBIN0001234" />
              </div>
              
              <div class="dispute-info-note" style="margin-top:16px">
                <span>ℹ️</span> Withdrawals may take 1-3 business days to reflect in your chosen bank account. A 1% processing fee applies.
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="showWithdraw = false">Cancel</button>
              <button class="btn btn-primary btn-deposit-full" 
                :disabled="withdrawLoading || !withdrawAmount || withdrawAmount < 100 || bankDetails.accountNo !== bankDetails.confirmAccountNo || !bankDetails.accountNo || !bankDetails.ifsc || !bankDetails.name" 
                @click="handleWithdraw">
                <span v-if="withdrawLoading" class="dep-spin"></span>
                Submit Request
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- TRANSACTION DETAILS MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showTxModal" class="modal-overlay" @click.self="showTxModal = false">
          <div class="modal tx-modal fade-up">
            <div class="modal-head">
              <h3 class="modal-title">Transaction Receipt</h3>
              <button class="modal-close" @click="showTxModal = false">✕</button>
            </div>
            <div v-if="selectedTx" class="modal-body">
              <div class="receipt-header">
                <div class="receipt-icon" :class="selectedTx.amount >= 0 ? 'cr' : 'db'">{{ txIcon(selectedTx.type) }}</div>
                <div class="receipt-type">{{ fmtType(selectedTx.type) }}</div>
                <div class="receipt-amt" :class="selectedTx.amount >= 0 ? 'cr' : 'db'">
                   {{ selectedTx.amount >= 0 ? '+' : '' }}{{ fmt(selectedTx.amount) }}
                </div>
              </div>
              
              <div class="receipt-details">
                <div class="rd-row"><span class="rd-key">Reference ID</span><span class="rd-val t-mono">{{ selectedTx.id }}</span></div>
                <div v-if="selectedTx.auctionId" class="rd-row"><span class="rd-key">Asset ID</span><span class="rd-val t-mono">{{ selectedTx.auctionId }}</span></div>
                <div class="rd-row"><span class="rd-key">User ID</span><span class="rd-val t-mono" style="font-size:10px">{{ selectedTx.userId }}</span></div>
                <div class="rd-row"><span class="rd-key">Status</span><span class="rd-val"><span class="badge" :class="selectedTx.status === 'failed' ? 'badge-red' : 'badge-live'">{{ (selectedTx.status || 'SUCCESS').toUpperCase() }}</span></span></div>
                <div class="rd-row"><span class="rd-key">Date & Time</span><span class="rd-val">{{ fmtFullDate(selectedTx.createdAt) }}</span></div>
                <v-divider class="my-2"></v-divider>
                <div class="rd-row"><span class="rd-key">Previous Balance</span><span class="rd-val">{{ fmt(selectedTx.prevBalance) }}</span></div>
                <div class="rd-row"><span class="rd-key">Change Amount</span><span class="rd-val" :class="selectedTx.amount >= 0 ? 'cr' : 'db'">{{ selectedTx.amount >= 0 ? '+' : '' }}{{ fmt(selectedTx.amount) }}</span></div>
                <div class="rd-row" style="border:none"><span class="rd-key">New Balance</span><span class="rd-val" style="font-weight:700; font-size:16px">{{ fmt(selectedTx.newBalance) }}</span></div>
              </div>

              <div v-if="authStore.role !== 'admin' && authStore.role !== 'employee'" class="receipt-footer">
                <div v-if="selectedTx.disputed" class="disputed-badge">
                  <span>⚠️ Dispute Active</span>
                  <button class="btn-chat-support" @click="openSupportChat">Chat with Support →</button>
                </div>
                <template v-else>
                  <button class="btn-dispute-full" @click="raiseDispute">Raise a Dispute</button>
                  <button class="btn-chat-support" style="margin-top:8px" @click="openSupportChat">Chat with Support</button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- DISPUTE MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDisputeModal" class="modal-overlay" @click.self="showDisputeModal = false">
          <div class="modal fade-up">
            <div class="modal-head">
              <h3 class="modal-title">Raise a Dispute</h3>
              <button class="modal-close" @click="showDisputeModal = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="field-wrap">
                <label class="field-label">Select a reason</label>
                <div class="dispute-reason-grid">
                  <button v-for="r in disputeReasons" :key="r"
                    class="reason-chip" :class="{ 'reason-chip--active': selectedDisputeReason === r }"
                    @click="selectedDisputeReason = r">
                    {{ r }}
                  </button>
                </div>
              </div>
              <div v-if="selectedDisputeReason === 'Other'" class="field-wrap" style="margin-top:12px">
                <label class="field-label">Describe your issue</label>
                <textarea v-model="disputeReason" class="field" rows="3" placeholder="Please provide details..."></textarea>
              </div>
              <div class="dispute-info-note">
                <span>ℹ️</span> This will also open a support chat so our team can assist you in real-time.
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn-cancel" @click="showDisputeModal = false">Cancel</button>
              <button class="btn-submit-dispute" :disabled="(!selectedDisputeReason || (selectedDisputeReason === 'Other' && !disputeReason.trim())) || disputeLoading" @click="submitDispute">
                {{ disputeLoading ? 'Submitting...' : 'Submit Dispute & Open Chat' }}
              </button>
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
.balance-hero { position: relative; padding: 64px 0 82px; overflow: hidden; background: var(--bg-raised); border-bottom: 1px solid var(--border); }
.balance-hero--centered .hero-wrap { justify-content: center; }
.hero-wrap { display: flex; align-items: stretch; gap: 24px; flex-wrap: wrap; }
.balance-hero__glow {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 70% 120% at 50% 60%, rgba(212,175,55,0.08) 0%, transparent 65%),
              radial-gradient(ellipse 50% 70% at 95% 10%, rgba(212,175,55,0.03) 0%, transparent 55%);
}

.balance-card {
  position: relative; background: var(--bg-card);
  border: 1px solid var(--gold-border);
  border-radius: 24px; padding: 40px; color: var(--text); overflow: hidden;
  max-width: 480px; width: 100%;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  box-shadow: 0 40px 80px rgba(0,0,0,0.3);
}
.bc-label { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: var(--text-3); margin-bottom: 16px; }
.bc-val { font-family: var(--font-display); font-size: 52px; color: var(--text); margin-bottom: 8px; line-height: 1; }
.bc-val--huge { font-size: 72px; font-weight: 800; color: var(--gold); text-shadow: 0 4px 20px rgba(212,175,55,0.2); }
.bc-sub { font-size: 16px; color: var(--text-3); font-weight: 500; margin-bottom: 24px; }

.btn-add-funds {
  background: var(--gold); color: #000; border: none; border-radius: 14px;
  padding: 14px 28px; font-size: 15px; font-weight: 700; cursor: pointer;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 20px rgba(212,175,55,0.3);
}
.btn-add-funds:hover { transform: translateY(-2px); scale: 1.05; box-shadow: 0 12px 24px rgba(212,175,55,0.4); }
.btn-add-funds:active { transform: translateY(0); scale: 0.98; }

.wallet-actions { display: flex; gap: 12px; justify-content: center; margin-top: 4px; }
.btn-withdraw {
  background: transparent; color: var(--gold); border: 1.5px solid var(--gold); border-radius: 14px;
  padding: 14px 28px; font-size: 15px; font-weight: 700; cursor: pointer;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.btn-withdraw:hover { background: rgba(212,175,55,0.1); transform: translateY(-2px); scale: 1.05; }
.btn-withdraw:active { transform: translateY(0); scale: 0.98; }

.wallet-id-tag {
  background: var(--bg-raised); border: 1px solid var(--border-md);
  border-radius: 8px; padding: 4px 10px; font-size: 11px; font-family: var(--font-mono);
  color: var(--text-3); cursor: pointer; margin-bottom: 24px; transition: all 0.2s;
  display: flex; align-items: center; gap: 4px;
}
.wallet-id-tag:hover { background: var(--bg-hover); color: var(--text-2); border-color: var(--border-strong); }

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
  padding: 16px; background: #5D2E1F; color: var(--gold); border: none; border-radius: 12px;
  font-family: var(--font-body); font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 20px;
  transition: all 0.2s; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}
.btn-deposit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
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

.drawer-leave-to .drawer { transform: translateY(100%); }

/* RECEIPT MODAL */
.tx-modal { max-width: 400px; border-radius: 18px; overflow: hidden; }
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 999;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.tx-inline-actions { margin-left: 14px; flex-shrink: 0; }
.btn-dispute-inline {
  padding: 6px 12px; background: var(--red-dim); border: 1px solid rgba(248,113,113,0.3);
  border-radius: 8px; color: var(--red); font-family: var(--font-body); font-size: 11px; font-weight: 700;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.btn-dispute-inline:hover { background: rgba(248,113,113,0.2); }
.disputed-badge-inline {
  background: var(--orange-dim); border: 1px solid rgba(251,146,60,0.3);
  border-radius: 8px; padding: 6px 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.modal { background: var(--bg-card); border: 1px solid var(--border-md); width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--border); }
.modal-title { font-size: 16px; font-weight: 700; color: var(--text); }
.modal-close { background: none; border: none; font-size: 16px; color: var(--text-3); cursor: pointer; }
.receipt-header { padding: 32px 20px; text-align: center; background: var(--bg-raised); }
.receipt-icon {
  width: 56px; height: 56px; margin: 0 auto 12px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 24px;
}
.receipt-icon.cr { background: var(--green-dim); color: var(--green); }
.receipt-icon.db { background: var(--red-dim); color: var(--red); }
.receipt-type { font-size: 13px; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
.receipt-amt { font-family: var(--font-display); font-size: 32px; font-weight: 700; }
.receipt-amt.cr { color: var(--green); }
.receipt-amt.db { color: var(--red); }

.receipt-details { padding: 20px; }
.rd-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
.rd-key { font-size: 12px; color: var(--text-3); }
.rd-val { font-size: 13px; color: var(--text); font-weight: 500; }

.receipt-footer { padding: 0 20px 24px; }
.btn-dispute-full {
  width: 100%; padding: 12px; background: var(--red-dim); border: 1px solid rgba(248,113,113,0.3);
  border-radius: 10px; color: var(--red); font-family: var(--font-body); font-size: 14px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
}
.btn-dispute-full:hover { background: rgba(248,113,113,0.2); }
.btn-chat-support {
  width: 100%; padding: 12px; background: var(--gold-dim); border: 1px solid var(--gold-border);
  border-radius: 10px; color: var(--gold); font-family: var(--font-body); font-size: 14px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
}
.btn-chat-support:hover { background: rgba(212,175,55,0.15); }
.disputed-badge {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: var(--orange-dim); border: 1px solid rgba(251,146,60,0.3);
  border-radius: 10px; padding: 10px 14px; margin-bottom: 8px;
  font-size: 13px; color: var(--orange); font-weight: 600;
}
.dispute-reason-grid {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
}
.reason-chip {
  padding: 8px 14px; border-radius: 20px; border: 1px solid var(--border-md);
  background: var(--bg-raised); color: var(--text-2); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.15s; font-family: var(--font-body);
}
.reason-chip:hover { background: var(--bg-hover); color: var(--text); }
.reason-chip--active { background: var(--orange-dim); border-color: rgba(251,146,60,0.4); color: var(--orange); font-weight: 700; }
.dispute-info-note {
  display: flex; align-items: flex-start; gap: 8px; margin-top: 16px;
  padding: 10px 12px; background: var(--bg-raised); border-radius: 8px;
  font-size: 12px; color: var(--text-3); line-height: 1.5;
}

.modal-foot { display: flex; gap: 10px; justify-content: flex-end; padding: 0 24px 24px; }
.btn-cancel { padding: 10px 20px; background: var(--bg-raised); border: 1px solid var(--border-md); border-radius: 10px; color: var(--text-2); cursor: pointer; }
.btn-submit-dispute { padding: 10px 20px; background: var(--orange); color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }

/* RESPONSIVE */
@media (max-width: 640px) {
  .stat-row { grid-template-columns: repeat(2,1fr); }
  .balance-hero { padding: 40px 0; }
  .bc-val--huge { font-size: 52px; }
  .balance-card { padding: 32px 20px; }
  .quick-grid { grid-template-columns: repeat(2,1fr); }
  .tx-row { padding: 12px 16px; gap: 10px; }
  .history-head { padding: 14px 16px; }
}
</style>