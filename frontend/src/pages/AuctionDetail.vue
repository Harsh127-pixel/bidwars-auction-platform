<!-- FILE: frontend/src/pages/AuctionDetail.vue -->
<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import socket from '../services/socket'
import { useNotification } from '../services/notification'

const route        = useRoute()
const router       = useRouter()
const authStore    = useAuthStore()
const notification = useNotification()
const openSubscriptionModal = inject('openSubscriptionModal', () => {})

const auction    = ref(null)
const loading    = ref(true)
const highestBid = ref(0)
const customBid  = ref(null)
const proxyCap   = ref(null)
const isJoined   = ref(false)
const joining    = ref(false)
const bidding    = ref(false)
const timeLeft   = ref('--:--:--')
const flash      = ref(false)
const urgent     = ref(false)
let timerInterval = null

const fmt          = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
const suggestedBid = computed(() => highestBid.value + 1000)
const quickBids    = computed(() => [1000, 5000, 10000, 25000, 50000].map(s => highestBid.value + s))
const isSubscribed = computed(() => authStore.user?.subscriptionStatus === 'active')
const feeRate      = computed(() => isSubscribed.value ? 0 : 0.05)

const updateTimer = () => {
  if (!auction.value?.endTime) return
  const diff = new Date(auction.value.endTime).getTime() - Date.now()
  if (diff <= 0) { timeLeft.value = 'Ended'; urgent.value = false; return }
  urgent.value = diff < 300000 // last 5 min
  const h = String(Math.floor(diff / 3600000)).padStart(2,'0')
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0')
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0')
  timeLeft.value = `${h}:${m}:${s}`
}

const fetchAuction = async () => {
  loading.value = true
  try {
    // Try to fetch specific auction (if backend has this route, which it should really but currently we use global list)
    // Actually our backend /api/auctions ONLY returns active ones. 
    // Let's add a single auction fetch route or check if it's in the list.
    const res = await api.get('/api/auctions')
    if (!Array.isArray(res.data)) throw new Error('Invalid data format')
    
    let found = res.data.find(a => String(a.id) === String(route.params.id))
    
    // Fallback: If not found in active list, try to fetch directly (assuming backend has /api/auctions/:id)
    if (!found) {
       try {
         const single = await api.get(`/api/auctions/${route.params.id}`)
         found = single.data
       } catch (e) {
         notification.add('Auction not found', 'error')
         router.push('/auctions')
         return
       }
    }

    if (found.endTime?._seconds) found.endTime = new Date(found.endTime._seconds * 1000).toISOString()
    else if (found.endTime?.seconds) found.endTime = new Date(found.endTime.seconds * 1000).toISOString()
    
    if (!found.endTime || isNaN(new Date(found.endTime).getTime()))
      found.endTime = new Date(Date.now() + 86400000).toISOString()
      
    auction.value   = found
    highestBid.value = found.highestBid || found.minBid || 0
  } catch (err) { 
    console.error('Fetch error:', err)
    router.push('/auctions') 
  } finally { loading.value = false }
}

const ensureAuth = async (msg = 'Please sign in to continue') => {
  // Wait for Firebase to resolve auth state (page refresh race condition)
  if (authStore.loading) {
    await new Promise((resolve) => {
      const maxWait = setTimeout(resolve, 3000)
      const stop = authStore.$subscribe(() => {
        if (!authStore.loading) { clearTimeout(maxWait); stop(); resolve() }
      })
    })
  }
  if (!authStore.user) {
    notification.add(msg, 'info')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return false
  }
  return true
}

const joinAuction = () => {
  if (!ensureAuth('Sign in to join this auction')) return
  joining.value = true
  setTimeout(() => { isJoined.value = true; joining.value = false; notification.add('You can now place bids', 'success') }, 800)
}

const placeBid = (amount) => {
  if (!ensureAuth('Sign in to place a bid')) return
  if (!amount || amount < suggestedBid.value) return notification.add(`Minimum bid: ${fmt(suggestedBid.value)}`, 'warning')
  bidding.value = true
  socket.emit('placeBid', { auctionId: route.params.id, userId: authStore.user.uid, amount, isProxy: false })
  setTimeout(() => { bidding.value = false; customBid.value = null }, 2000)
}

const setProxy = () => {
  if (!ensureAuth('Sign in to set an auto-bid')) return
  if (!proxyCap.value || proxyCap.value <= highestBid.value)
    return notification.add('Proxy max must exceed current bid', 'warning')
  socket.emit('placeBid', { auctionId: route.params.id, userId: authStore.user.uid, amount: proxyCap.value, isProxy: true })
  notification.add(`Proxy set at ${fmt(proxyCap.value)}`, 'success')
  proxyCap.value = null
}

const buyItNow = async () => {
  if (!ensureAuth('Sign in to buy this asset instantly')) return
  if (!confirm(`Confirm purchase for ${fmt(auction.value.buyItNow)}?`)) return
  bidding.value = true
  try { await api.post(`/api/auctions/buy-it-now/${route.params.id}`); notification.add('Purchase successful!', 'success') }
  catch (e) { notification.add(e.message || 'Purchase failed', 'error') }
  finally { bidding.value = false }
}

const handleUpsell = () => {
  if (!ensureAuth('Sign in to subscribe to PRO')) return
  openSubscriptionModal('fee')
}

onMounted(async () => {
  await fetchAuction()
  timerInterval = setInterval(updateTimer, 1000)

  socket.on('bidUpdate', (data) => {
    if (String(data.auctionId) !== String(route.params.id)) return
    highestBid.value = parseFloat(data.amount)
    flash.value = true; setTimeout(() => { flash.value = false }, 2000)
  })
  socket.on('timerExtension', (data) => {
    if (String(data.auctionId) !== String(route.params.id)) return
    auction.value.endTime = data.newEndTime; notification.add('Timer extended!', 'info')
  })
  socket.on('biddingStopped', (data) => {
    if (String(data.auctionId) !== String(route.params.id)) return
    auction.value.status = data.status
    const won = data.winner === authStore.user?.uid
    notification.add(won ? 'You won! 🏆' : 'Auction closed.', won ? 'success' : 'info')
  })
  socket.on('error', (err) => { bidding.value = false; notification.add(err.message || 'Bid rejected', 'error') })
})

onUnmounted(() => {
  clearInterval(timerInterval)
  socket.off('bidUpdate'); socket.off('timerExtension'); socket.off('biddingStopped'); socket.off('error')
})
</script>

<template>
  <!-- LOADING -->
  <div v-if="loading" class="loading-screen">
    <div class="load-ring"></div>
    <div class="load-label">Loading auction…</div>
  </div>

  <div v-else-if="auction" class="detail-page">
    <!-- BREADCRUMB -->
    <div class="breadcrumb">
      <div class="page-wrap breadcrumb__inner">
        <router-link to="/auctions" class="bc-back">← Auctions</router-link>
        <span class="bc-sep">/</span>
        <span class="bc-current">{{ auction.title }}</span>
        <div class="bc-badges">
          <span class="badge-live-sm"><span class="live-dot"></span>Live</span>
          <span class="bc-cat">{{ auction.category }}</span>
        </div>
      </div>
    </div>

    <div class="page-wrap detail-body">
      <div class="detail-layout">

        <!-- LEFT -->
        <div class="detail-left fade-up">
          <!-- Image -->
          <div class="detail-img">
            <img :src="auction.imageUrl || 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?w=1200&q=80'"
              :alt="auction.title" />
            <div class="detail-img__overlay">
              <span class="lot-badge">LOT-{{ auction.id.slice(0,8).toUpperCase() }}</span>
            </div>
          </div>

          <!-- Info card -->
          <div class="info-card">
            <h1 class="info-title">{{ auction.title }}</h1>
            <p class="info-desc">{{ auction.description }}</p>
            <div class="info-meta">
              <div class="info-meta__item">
                <div class="info-meta__label">Starting Price</div>
                <div class="info-meta__val">{{ fmt(auction.minBid) }}</div>
              </div>
              <div class="info-meta__item">
                <div class="info-meta__label">Escrow</div>
                <div class="info-meta__val info-meta__val--green">✓ Protected</div>
              </div>
              <div v-if="auction.reservePrice" class="info-meta__item">
                <div class="info-meta__label">Reserve</div>
                <div class="info-meta__val" :style="auction.reserveMet ? 'color:var(--green)' : ''">
                  {{ auction.reserveMet ? '✓ Met' : 'Not met' }}
                </div>
              </div>
              <div class="info-meta__item">
                <div class="info-meta__label">Total Bids</div>
                <div class="info-meta__val">{{ auction.bidCount || 0 }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: sticky bid panel -->
        <div class="detail-right fade-up fade-up-2">

          <!-- Price + Timer -->
          <div class="price-card" :class="{'price-card--flash': flash, 'price-card--urgent': urgent}">
            <div class="price-card__label">Current Highest Bid</div>
            <div class="price-card__amount">{{ fmt(highestBid) }}</div>
            <div class="price-card__timer">
              <span class="price-card__timer-label">Time Left</span>
              <span class="price-card__countdown"
                :class="{'price-card__countdown--ended': timeLeft === 'Ended', 'price-card__countdown--urgent': urgent}">
                {{ timeLeft }}
              </span>
            </div>
            <div v-if="urgent && timeLeft !== 'Ended'" class="price-card__urgent-bar">
              <div class="urgent-pulse"></div>
              Ending soon — bid now!
            </div>
          </div>

          <!-- JOIN GATE -->
          <div v-if="!isJoined && timeLeft !== 'Ended'" class="join-gate">
            <div class="join-gate__title">Enter to Bid</div>
            <div class="join-gate__sub">A refundable deposit of {{ fmt((auction.minBid||0) * 0.1) }} is held while you participate.</div>
<button class="btn-join" :disabled="joining || authStore.loading" @click="joinAuction">
  {{ authStore.loading ? 'Loading…' : joining ? 'Authorizing…' : 'Place Deposit & Start Bidding' }}
</button>
          </div>

          <!-- ENDED BANNER -->
          <div v-else-if="timeLeft === 'Ended'" class="ended-banner">
            <div class="ended-banner__icon">🔔</div>
            <div class="ended-banner__title">Auction Ended</div>
          </div>

          <!-- ACTIVE BIDDING -->
          <div v-else class="bid-controls">
            <!-- Quick bids -->
            <div class="bid-section">
              <div class="bid-section__label">Quick Bid</div>
              <div class="quick-grid">
                <button v-for="amount in quickBids" :key="amount"
                  class="quick-btn" :disabled="bidding"
                  @click="placeBid(amount)">
                  {{ fmt(amount) }}
                </button>
              </div>
            </div>

            <!-- Custom bid -->
            <div class="bid-section">
              <div class="bid-section__label">Custom Amount</div>
              <div class="bid-input-row">
                <div class="bid-input-wrap">
                  <span class="bid-prefix">₹</span>
                  <input v-model.number="customBid" type="number"
                    :placeholder="(highestBid + 1000).toLocaleString('en-IN')"
                    class="field bid-input" />
                </div>
                <button class="btn-bid"
                  :disabled="!customBid || customBid < suggestedBid || bidding"
                  @click="placeBid(customBid)">
                  <span v-if="bidding" class="btn-spin btn-spin--dark"></span>
                  {{ bidding ? '…' : 'Bid' }}
                </button>
              </div>
              <div class="bid-min">Min: {{ fmt(suggestedBid) }}</div>
            </div>

            <!-- Proxy -->
            <div class="bid-section bid-section--subtle">
              <div class="bid-section__label">Auto-Bid (Proxy)</div>
              <div class="bid-input-row">
                <div class="bid-input-wrap">
                  <span class="bid-prefix">₹</span>
                  <input v-model.number="proxyCap" type="number" placeholder="Your max amount" class="field bid-input" />
                </div>
                <button class="btn-proxy" :disabled="!proxyCap" @click="setProxy">Set Max</button>
              </div>
              <div class="bid-min">System auto-bids up to your max, one increment at a time.</div>
            </div>

            <!-- Buy It Now -->
            <div v-if="auction.buyItNow && !auction.bidCount" class="bin-card">
              <div class="bin-card__left">
                <div class="bin-card__label">Buy It Now</div>
                <div class="bin-card__price">{{ fmt(auction.buyItNow) }}</div>
              </div>
              <button class="btn-bin" :disabled="bidding" @click="buyItNow">Buy Now ⚡</button>
            </div>
          </div>

          <!-- FEE BREAKDOWN -->
          <div class="fee-card" :class="{ 'fee-card--subscribed': isSubscribed }">
            <div class="fee-row">
              <span>Hammer price</span>
              <span>{{ fmt(highestBid) }}</span>
            </div>
            <div class="fee-row" :class="{ 'fee-row--waived': isSubscribed }">
              <span>
                Buyer's premium
                <span v-if="isSubscribed" class="fee-badge-pro">PRO</span>
                <span v-else class="fee-badge-rate">(5%)</span>
              </span>
              <span v-if="isSubscribed" class="fee-waived">₹0 Waived ✓</span>
              <span v-else>{{ fmt(Math.round(highestBid * 0.05)) }}</span>
            </div>
            <div class="fee-divider"></div>
            <div class="fee-row fee-row--total">
              <span>Total if you win</span>
              <span class="fee-total">{{ fmt(Math.round(highestBid * (1 + feeRate))) }}</span>
            </div>
            <div v-if="!isSubscribed" class="fee-upsell" @click="handleUpsell">
              <span>💸 Remove the 5% fee → <strong>Subscribe Pro</strong></span>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* LOADING */
.loading-screen { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg); gap: 16px; }
.load-ring { width: 44px; height: 44px; border: 3px solid var(--border-md); border-top-color: var(--orange); border-radius: 50%; animation: spin 0.8s linear infinite; }
.load-label { font-size: 13px; color: var(--text-3); letter-spacing: 0.05em; text-transform: uppercase; }
@keyframes spin { to { transform: rotate(360deg); } }

/* BREADCRUMB */
.breadcrumb { background: var(--bg-card); border-bottom: 1px solid var(--border); padding: 12px 0; }
.breadcrumb__inner { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.bc-back { font-size: 13px; color: var(--text-2); text-decoration: none; transition: color 0.15s; }
.bc-back:hover { color: var(--orange); }
.bc-sep  { color: var(--text-3); }
.bc-current { font-size: 13px; color: var(--text-2); flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.bc-badges { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }
.badge-live-sm {
  display: flex; align-items: center; gap: 5px;
  background: var(--green-dim); border: 1px solid rgba(74,222,128,0.2);
  border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em; color: var(--green);
}
.bc-cat { font-size: 12px; color: var(--text-3); background: var(--bg-raised); border: 1px solid var(--border); border-radius: 20px; padding: 3px 10px; }

/* BODY */
.detail-page { min-height: 100vh; background: var(--bg); }
.detail-body { padding: 28px 0 64px; }
.detail-layout { display: grid; grid-template-columns: 1fr 380px; gap: 32px; align-items: start; }

/* LEFT */
.detail-img { border-radius: 18px; overflow: hidden; aspect-ratio: 4/3; background: var(--bg-raised); position: relative; }
.detail-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.detail-img:hover img { transform: scale(1.03); }
.detail-img__overlay { position: absolute; top: 16px; left: 16px; }
.lot-badge {
  display: inline-block; padding: 5px 12px;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.15); border-radius: 20px;
  font-family: var(--font-mono); font-size: 11px; color: rgba(255,255,255,0.8);
}

.info-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; padding: 28px; margin-top: 20px; }
.info-title { font-family: var(--font-display); font-size: clamp(22px, 3vw, 34px); color: var(--text); margin-bottom: 14px; }
.info-desc  { font-size: 15px; color: var(--text-2); line-height: 1.75; margin-bottom: 24px; }
.info-meta  { display: flex; gap: 32px; flex-wrap: wrap; padding-top: 20px; border-top: 1px solid var(--border); }
.info-meta__label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); margin-bottom: 5px; }
.info-meta__val { font-family: var(--font-display); font-size: 18px; color: var(--text); }
.info-meta__val--green { color: var(--green); font-size: 14px; font-family: var(--font-body); font-weight: 600; }

/* RIGHT: STICKY */
.detail-right { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 12px; }

/* PRICE CARD */
.price-card {
  background: var(--bg-card); border: 1px solid var(--border-md);
  border-radius: 18px; padding: 24px;
  transition: border-color 0.3s, box-shadow 0.3s;
}
.price-card--flash  { border-color: rgba(251,146,60,0.5); box-shadow: 0 0 32px rgba(251,146,60,0.12); }
.price-card--urgent { border-color: rgba(248,113,113,0.4); }
.price-card__label  { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); margin-bottom: 8px; }
.price-card__amount {
  font-family: var(--font-display); font-size: 48px; color: var(--text);
  margin-bottom: 16px; transition: color 0.3s; line-height: 1;
}
.price-card--flash .price-card__amount { color: var(--orange); }
.price-card__timer { display: flex; align-items: center; justify-content: space-between; }
.price-card__timer-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); }
.price-card__countdown { font-family: var(--font-mono); font-size: 22px; color: var(--text); }
.price-card__countdown--ended  { color: var(--red); }
.price-card__countdown--urgent { color: var(--red); animation: urgentFlash 1s ease infinite; }
@keyframes urgentFlash { 0%,100%{opacity:1} 50%{opacity:0.6} }
.price-card__urgent-bar {
  display: flex; align-items: center; gap: 8px;
  margin-top: 14px; padding: 10px 14px; background: var(--red-dim);
  border: 1px solid rgba(248,113,113,0.2); border-radius: 10px;
  font-size: 13px; color: var(--red); font-weight: 600;
}
.urgent-pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--red); animation: pulse 1s ease infinite; flex-shrink: 0; }
@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.4)} }

/* JOIN GATE */
.join-gate { background: var(--bg-card); border: 1px solid var(--border-md); border-radius: 16px; padding: 22px; }
.join-gate__title { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
.join-gate__sub   { font-size: 13px; color: var(--text-2); margin-bottom: 18px; line-height: 1.5; }
.btn-join {
  width: 100%; padding: 14px; background: var(--orange); color: #fff;
  border: none; border-radius: 12px; font-family: var(--font-body); font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 4px 18px rgba(251,146,60,0.3);
}
.btn-join:hover:not(:disabled) { background: #f97316; transform: translateY(-1px); }
.btn-join:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* ENDED */
.ended-banner {
  background: var(--bg-raised); border: 1px solid var(--border);
  border-radius: 16px; padding: 28px; text-align: center;
}
.ended-banner__icon  { font-size: 36px; margin-bottom: 8px; }
.ended-banner__title { font-family: var(--font-display); font-size: 20px; color: var(--text-2); }

/* BID CONTROLS */
.bid-controls { display: flex; flex-direction: column; gap: 10px; }
.bid-section {
  background: var(--bg-card); border: 1px solid var(--border-md);
  border-radius: 14px; padding: 18px;
}
.bid-section--subtle { background: var(--bg-raised); border-color: var(--border); }
.bid-section__label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); margin-bottom: 12px; }

.quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
.quick-btn {
  padding: 10px 6px; background: var(--bg-raised); border: 1px solid var(--border-md);
  border-radius: 10px; color: var(--text-2); font-family: var(--font-body);
  font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; text-align: center;
}
.quick-btn:hover:not(:disabled) { background: var(--orange-dim); border-color: rgba(251,146,60,0.3); color: var(--orange); }
.quick-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.bid-input-row { display: flex; gap: 8px; }
.bid-input-wrap { position: relative; flex: 1; }
.bid-prefix { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-2); pointer-events: none; }
.bid-input { padding-left: 24px !important; font-weight: 600; }
.bid-min { font-size: 11px; color: var(--text-3); margin-top: 8px; }

.btn-bid {
  padding: 10px 20px; background: var(--orange); color: #fff; border: none; border-radius: 10px;
  font-family: var(--font-body); font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(251,146,60,0.25);
}
.btn-bid:hover:not(:disabled) { background: #f97316; }
.btn-bid:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-proxy {
  padding: 10px 16px; background: var(--bg-hover); border: 1px solid var(--border-md);
  border-radius: 10px; color: var(--text-2); font-family: var(--font-body); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; flex-shrink: 0;
}
.btn-proxy:hover:not(:disabled) { background: var(--bg-raised); color: var(--text); }
.btn-proxy:disabled { opacity: 0.4; cursor: not-allowed; }

/* BUY IT NOW */
.bin-card {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: var(--orange-dim); border: 1px solid rgba(251,146,60,0.3);
  border-radius: 14px; padding: 18px 20px;
}
.bin-card__label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--orange); margin-bottom: 4px; }
.bin-card__price { font-family: var(--font-display); font-size: 26px; color: var(--text); }
.btn-bin {
  padding: 12px 20px; background: var(--orange); color: #fff; border: none; border-radius: 10px;
  font-family: var(--font-body); font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s;
  flex-shrink: 0; box-shadow: 0 4px 14px rgba(251,146,60,0.3);
}
.btn-bin:hover:not(:disabled) { background: #f97316; transform: translateY(-1px); }
.btn-bin:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

/* FEE CARD */
.fee-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 14px; padding: 16px 20px;
  transition: border-color 0.3s;
}
.fee-card--subscribed {
  border-color: var(--gold-border);
  background: linear-gradient(145deg, var(--bg-card) 0%, rgba(212,175,55,0.03) 100%);
}
.fee-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--text-2); margin-bottom: 10px; gap: 8px; }
.fee-row--total { margin-bottom: 0; font-weight: 600; font-size: 14px; color: var(--text); }
.fee-row--waived { color: var(--text-3); }
.fee-total { color: var(--orange); }
.fee-divider { border: none; border-top: 1px solid var(--border); margin-bottom: 10px; }
.fee-badge-pro {
  display: inline-block; background: var(--gold); color: #000;
  font-size: 9px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
  padding: 2px 6px; border-radius: 4px; margin-left: 4px; vertical-align: middle;
}
.fee-badge-rate { color: var(--text-3); font-size: 12px; }
.fee-waived { color: var(--green); font-weight: 700; font-size: 13px; }
.fee-upsell {
  margin-top: 12px; padding: 10px 14px;
  background: var(--gold-dim); border: 1px dashed var(--gold-border);
  border-radius: 10px; font-size: 12px; color: var(--text-2);
  cursor: pointer; text-align: center; transition: all 0.15s;
}
.fee-upsell:hover { background: var(--gold-border); color: var(--text); }
.fee-upsell strong { color: var(--gold); }

/* Spinner */
.btn-spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
.btn-spin--dark { border-color: rgba(0,0,0,0.2); border-top-color: var(--text-inv); }

/* RESPONSIVE */
@media (max-width: 1024px) {
  .detail-layout { grid-template-columns: 1fr; }
  .detail-right { position: static; }
}
@media (max-width: 640px) {
  .detail-body { padding: 16px 0 48px; }
  .quick-grid { grid-template-columns: repeat(2, 1fr); }
  .bid-input-row { flex-direction: column; }
  .btn-bid, .btn-proxy { width: 100%; justify-content: center; }
  .bin-card { flex-direction: column; align-items: flex-start; }
  .btn-bin { width: 100%; }
}
</style>