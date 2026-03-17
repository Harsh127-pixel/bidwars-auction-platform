// FILE: src/composables/useWallet.js
import { ref, computed } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'

export function useWallet() {
  const authStore = useAuthStore()
  const notification = useNotification()

  const history = ref([])
  const loading = ref(true)
  const topupLoading = ref(false)
  const rzpData = ref({ orderId: '', key: '', amount: 0 })
  const showRzp = ref(false)
  const historyFilter = ref('all')

  const filteredHistory = computed(() => {
    if (historyFilter.value === 'credit') return history.value.filter(t => t.amount >= 0)
    if (historyFilter.value === 'debit')  return history.value.filter(t => t.amount < 0)
    return history.value
  })

  const totalWealth = computed(() => (authStore.user?.credits || 0) + (authStore.user?.heldCredits || 0))

  const fetchHistory = async () => {
    loading.value = true
    try {
      const res = await api.get('/api/wallet/history')
      history.value = Array.isArray(res.data) ? res.data : []
    } catch (err) {
      notification.add('Could not load history', 'error')
    } finally { loading.value = false }
  }

  const initiateTopup = async (amount) => {
    if (!amount || amount < 100) { notification.add('Min ₹100', 'error'); return }
    topupLoading.value = true
    try {
      const res = await api.post('/api/payments/create-order', { amount: amount * 100 })
      rzpData.value = { orderId: res.data.orderId || res.data.id, key: res.data.key, amount: res.data.amount }
      showRzp.value = true
    } catch { notification.add('Failed to initiate payment', 'error') }
    finally { topupLoading.value = false }
  }

  const verifyPayment = async (data, amount) => {
    topupLoading.value = true
    try {
      await api.post('/api/payments/verify', data)
      notification.add(`₹${Number(amount).toLocaleString('en-IN')} added to wallet!`, 'success')
      authStore.init()
      await fetchHistory()
    } catch { notification.add('Payment verification failed', 'error') }
    finally { topupLoading.value = false }
  }

  const fmtDate = (ts) => {
    if (!ts) return ''
    try {
      const d = ts._seconds ? new Date(ts._seconds * 1000) : (ts.toDate ? ts.toDate() : new Date(ts))
      if (isNaN(d.getTime())) return ''
      const diff = Date.now() - d
      if (diff < 60000) return 'Just now'
      if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
      if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return '' }
  }

  const fmtType = (type) => ({
    WALLET_TOPUP: 'Deposit', BID_HOLD: 'Bid Hold', BID_REFUND: 'Refund',
    BUY_IT_NOW: 'Buy Now', BID_WIN_FINAL: 'Won', ESCROW_PAYOUT: 'Payout',
    DISPUTE_REFUND: 'Dispute', ADMIN_TOPUP: 'Adjustment',
  }[type] || type?.replace(/_/g, ' ') || 'Transaction')

  return {
    history, loading, topupLoading, rzpData, showRzp, historyFilter,
    filteredHistory, totalWealth,
    fetchHistory, initiateTopup, verifyPayment, fmtDate, fmtType
  }
}