// FILE: src/composables/useBidding.js
// All bidding logic extracted from AuctionDetail.vue
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import socket from '../services/socket'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'

export function useBidding(auctionId) {
  const router = useRouter()
  const authStore = useAuthStore()
  const notification = useNotification()

  const auction = ref(null)
  const loading = ref(true)
  const highestBid = ref(0)
  const isJoined = ref(false)
  const joining = ref(false)
  const bidding = ref(false)
  const timeLeft = ref('--:--:--')
  const isFlashing = ref(false)
  const isUrgent = ref(false)
  let timerInterval = null

  const isSubscribed = computed(() => authStore.user?.subscriptionStatus === 'active')
  const feeRate = computed(() => isSubscribed.value ? 0 : 0.05)
  const suggestedBid = computed(() => highestBid.value + 1000)
  const quickBidAmounts = computed(() =>
    [1000, 5000, 10000, 25000, 50000].map(s => highestBid.value + s)
  )
  const totalIfWin = computed(() => Math.round(highestBid.value * (1 + feeRate.value)))

  const updateTimer = () => {
    if (!auction.value?.endTime) return
    const diff = new Date(auction.value.endTime).getTime() - Date.now()
    if (diff <= 0) { timeLeft.value = 'ENDED'; isUrgent.value = false; return }
    isUrgent.value = diff < 300000
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
    timeLeft.value = `${h}:${m}:${s}`
  }

  const fetchAuction = async () => {
    loading.value = true
    try {
      const res = await api.get('/api/auctions')
      let found = res.data.find(a => String(a.id) === String(auctionId))
      if (!found) {
        const single = await api.get(`/api/auctions/${auctionId}`)
        found = single.data
      }
      if (!found) { router.push('/auctions'); return }
      if (found.endTime?._seconds) found.endTime = new Date(found.endTime._seconds * 1000).toISOString()
      else if (found.endTime?.seconds) found.endTime = new Date(found.endTime.seconds * 1000).toISOString()
      if (!found.endTime || isNaN(new Date(found.endTime).getTime()))
        found.endTime = new Date(Date.now() + 86400000).toISOString()
      auction.value = found
      highestBid.value = found.highestBid || found.minBid || 0
    } catch { router.push('/auctions') }
    finally { loading.value = false }
  }

  const ensureAuth = async (msg = 'Sign in to continue') => {
    if (authStore.loading) {
      await new Promise(resolve => {
        const t = setTimeout(resolve, 3000)
        const stop = authStore.$subscribe(() => {
          if (!authStore.loading) { clearTimeout(t); stop(); resolve() }
        })
      })
    }
    if (!authStore.user) {
      notification.add(msg, 'info')
      router.push({ path: '/login', query: { redirect: `/auction/${auctionId}` } })
      return false
    }
    return true
  }

  const joinAuction = async () => {
    if (!(await ensureAuth('Sign in to join this auction'))) return
    joining.value = true
    await new Promise(r => setTimeout(r, 600))
    isJoined.value = true
    joining.value = false
    notification.add('You can now place bids', 'success')
  }

  const placeBid = async (amount) => {
    if (!(await ensureAuth('Sign in to place a bid'))) return
    if (!amount || amount < suggestedBid.value) {
      notification.add(`Minimum bid: ₹${suggestedBid.value.toLocaleString('en-IN')}`, 'warning')
      return
    }
    bidding.value = true
    socket.emit('placeBid', {
      auctionId,
      userId: authStore.user.uid,
      amount,
      isProxy: false
    })
    setTimeout(() => { bidding.value = false }, 2000)
  }

  const setProxyBid = (proxyCap) => {
    if (!authStore.user) { notification.add('Sign in to set an auto-bid', 'info'); return }
    if (!proxyCap || proxyCap <= highestBid.value) {
      notification.add('Proxy max must exceed current bid', 'warning')
      return
    }
    socket.emit('placeBid', { auctionId, userId: authStore.user.uid, amount: proxyCap, isProxy: true })
    notification.add(`Auto-bid set at ₹${proxyCap.toLocaleString('en-IN')}`, 'success')
  }

  const buyItNow = async () => {
    if (!(await ensureAuth('Sign in to buy instantly'))) return
    if (!confirm(`Confirm purchase for ₹${auction.value.buyItNow?.toLocaleString('en-IN')}?`)) return
    bidding.value = true
    try {
      await api.post(`/api/auctions/buy-it-now/${auctionId}`)
      notification.add('Purchase successful!', 'success')
    } catch (e) {
      notification.add(e.message || 'Purchase failed', 'error')
    } finally { bidding.value = false }
  }

  const setupSocketListeners = () => {
    socket.on('bidUpdate', (data) => {
      if (String(data.auctionId) !== String(auctionId)) return
      highestBid.value = parseFloat(data.amount)
      isFlashing.value = true
      setTimeout(() => { isFlashing.value = false }, 1500)
    })
    socket.on('timerExtension', (data) => {
      if (String(data.auctionId) !== String(auctionId)) return
      auction.value.endTime = data.newEndTime
      notification.add('Timer extended!', 'info')
    })
    socket.on('biddingStopped', (data) => {
      if (String(data.auctionId) !== String(auctionId)) return
      auction.value.status = data.status
      const won = data.winner === authStore.user?.uid
      notification.add(won ? 'You won! 🏆' : 'Auction closed.', won ? 'success' : 'info')
    })
    socket.on('error', (err) => {
      bidding.value = false
      notification.add(err.message || 'Bid rejected', 'error')
    })
  }

  const teardownSocketListeners = () => {
    socket.off('bidUpdate')
    socket.off('timerExtension')
    socket.off('biddingStopped')
    socket.off('error')
  }

  onMounted(async () => {
    await fetchAuction()
    timerInterval = setInterval(updateTimer, 1000)
    setupSocketListeners()
  })

  onUnmounted(() => {
    clearInterval(timerInterval)
    teardownSocketListeners()
  })

  return {
    auction, loading, highestBid, isJoined, joining, bidding,
    timeLeft, isFlashing, isUrgent,
    isSubscribed, feeRate, suggestedBid, quickBidAmounts, totalIfWin,
    joinAuction, placeBid, setProxyBid, buyItNow
  }
}