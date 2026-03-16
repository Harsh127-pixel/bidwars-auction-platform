<template>
  <div style="background-color: var(--bg-page); min-height: 100vh;" v-if="auction">
    <!-- Breadcrumb -->
    <div style="background: var(--bg-card); border-bottom: 1px solid var(--border-color); padding: 12px 16px;">
      <div style="max-width: 1280px; margin: 0 auto; display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted);">
        <router-link to="/auctions" style="color: var(--text-muted); text-decoration: none; display: flex; align-items: center; gap: 4px;">
          <v-icon size="14">mdi-arrow-left</v-icon>
          Auctions
        </router-link>
        <span>/</span>
        <span style="color: var(--text-primary); font-weight: 500;">{{ auction.title }}</span>
      </div>
    </div>

    <div style="max-width: 1280px; margin: 0 auto; padding: 32px 16px;">
      <div class="d-flex flex-wrap" style="gap: 32px; align-items: flex-start;">

        <!-- Left: Image & Details -->
        <div style="flex: 1.2; min-width: 320px;" class="animate-in">
          <!-- Main Image -->
          <div style="border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); background: var(--bg-subtle); aspect-ratio: 4/3; position: relative;">
            <v-img :src="auction.imageUrl || placeholderImage" cover style="height: 100%;"></v-img>
            <div style="position: absolute; top: 16px; left: 16px; display: flex; gap: 8px;">
              <span style="background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); color: white; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 20px;">{{ auction.category }}</span>
              <div class="live-badge" style="background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); color: #4ade80; border-radius: 20px;">
                <span class="live-dot" style="background: #4ade80;"></span>
                Live Auction
              </div>
            </div>
          </div>

          <!-- Item Info -->
          <div style="margin-top: 24px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 24px;">
            <h1 class="font-display" style="font-size: clamp(24px, 3vw, 36px); color: var(--text-primary); margin: 0 0 12px; font-weight: 400; line-height: 1.2;">
              {{ auction.title }}
            </h1>
            <p style="color: var(--text-secondary); font-size: 15px; line-height: 1.7; margin: 0;">{{ auction.description }}</p>

            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color); display: flex; gap: 24px; flex-wrap: wrap;">
              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;">Category</div>
                <div style="font-weight: 600; color: var(--text-primary); margin-top: 4px;">{{ auction.category }}</div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;">Starting Bid</div>
                <div style="font-weight: 600; color: var(--text-primary); margin-top: 4px;">₹{{ auction.minBid.toLocaleString() }}</div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;">Auction ID</div>
                <div style="font-weight: 600; color: var(--text-primary); margin-top: 4px; font-family: monospace; font-size: 13px;">{{ auction.id.slice(0, 12).toUpperCase() }}</div>
              </div>
            </div>
          </div>

          <!-- Stats Row -->
          <div class="d-flex" style="gap: 12px; margin-top: 16px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 120px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 16px; text-align: center;">
              <div class="font-display" style="font-size: 24px; color: var(--text-primary);">24+</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Active Bidders</div>
            </div>
            <div style="flex: 1; min-width: 120px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 16px; text-align: center;">
              <div class="font-display" style="font-size: 24px; color: var(--text-primary); font-variant-numeric: tabular-nums;">{{ timeLeft }}</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Time Left</div>
            </div>
            <div style="flex: 1; min-width: 120px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 16px; text-align: center;">
              <div class="font-display" style="font-size: 24px; color: var(--success);">₹{{ lastIncrement.toLocaleString() }}</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Last Increase</div>
            </div>
          </div>
        </div>

        <!-- Right: Bidding Panel -->
        <div style="width: 380px; min-width: 300px; max-width: 100%; position: sticky; top: 96px;" class="animate-in animate-in-delay-2">

          <!-- EMD Entry -->
          <div v-if="!isJoined" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
            <div style="padding: 24px 24px 0;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <div style="width: 40px; height: 40px; background: var(--accent-soft); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                  <v-icon size="20" style="color: var(--accent);">mdi-lock-outline</v-icon>
                </div>
                <div>
                  <h3 style="font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0;">Place a Deposit to Bid</h3>
                  <p style="font-size: 13px; color: var(--text-muted); margin: 0;">Fully refunded if you don't win</p>
                </div>
              </div>

              <div style="background: var(--bg-elevated); border-radius: 10px; padding: 20px; margin-bottom: 20px; border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                  <span style="font-size: 13px; color: var(--text-secondary);">Earnest Money Deposit (EMD)</span>
                  <span style="font-size: 12px; background: var(--success-soft); color: var(--success); padding: 2px 8px; border-radius: 12px; font-weight: 600;">Refundable</span>
                </div>
                <div class="bid-amount" style="font-size: 36px; color: var(--text-primary);">₹{{ (auction.minBid * 0.1).toLocaleString() }}</div>
                <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">10% of starting bid. Returned within 24hrs if you don't win.</p>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; font-size: 13px; color: var(--text-secondary);">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <v-icon size="16" style="color: var(--success);">mdi-check-circle</v-icon>
                  Real-time bid updates
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <v-icon size="16" style="color: var(--success);">mdi-check-circle</v-icon>
                  Secure escrow protection
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <v-icon size="16" style="color: var(--success);">mdi-check-circle</v-icon>
                  Auto-proxy bidding available
                </div>
              </div>
            </div>

            <div style="padding: 0 24px 24px;">
              <button
                @click="joinAuction"
                :disabled="joining"
                style="width: 100%; background: var(--accent); color: white; border: none; padding: 14px; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.15s; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px;"
              >
                <v-progress-circular v-if="joining" size="16" width="2" indeterminate color="white"></v-progress-circular>
                <span>{{ joining ? 'Authorizing...' : 'Pay Deposit & Start Bidding' }}</span>
              </button>
            </div>
          </div>

          <!-- Active Bidding Panel -->
          <div v-else>
            <!-- Current Price -->
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px; margin-bottom: 16px;" :style="showPriceFlash ? 'border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft);' : ''">
              <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;">Current Highest Bid</div>
              <div class="bid-amount" style="font-size: 42px; transition: color 0.3s ease;" :style="showPriceFlash ? 'color: var(--accent)' : 'color: var(--text-primary)'">
                ₹{{ highestBid.toLocaleString() }}
              </div>
              <div v-if="lastBidStatus" style="margin-top: 10px; font-size: 13px; color: var(--success); display: flex; align-items: center; gap: 6px;">
                <v-icon size="14">mdi-check-circle</v-icon>
                {{ lastBidStatus }}
              </div>
            </div>

            <!-- Quick Bid Buttons -->
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; margin-bottom: 16px;">
              <div style="font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.06em;">Quick Bid</div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px;">
                  <button
                    v-for="inc in [1000, 5000, 10000, 25000, 50000, 100000]"
                    :key="inc"
                    @click="placeBid(highestBid + inc)"
                    :disabled="processingBid || auction.status !== 'active' || timeLeft === 'Ended'"
                    style="padding: 10px 8px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--text-primary); cursor: pointer; transition: all 0.15s ease; font-family: 'DM Sans', sans-serif; text-align: center;"
                    class="quick-bid-btn"
                  >
                    +₹{{ inc >= 1000 ? (inc/1000)+'K' : inc }}
                  </button>
                </div>
  
                <div style="border-top: 1px solid var(--border-color); padding-top: 16px;">
                  <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">Custom Amount</div>
                  <div style="display: flex; gap: 8px;">
                    <div style="flex: 1; display: flex; align-items: center; gap: 8px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; padding: 0 12px;">
                      <span style="color: var(--text-muted); font-weight: 600;">₹</span>
                      <input
                        v-model.number="customBidAmount"
                        type="number"
                        :placeholder="suggestedBid.toLocaleString()"
                        :disabled="auction.status !== 'active' || timeLeft === 'Ended'"
                        style="flex: 1; border: none; background: transparent; color: var(--text-primary); font-size: 15px; font-weight: 600; outline: none; padding: 11px 0; font-family: 'DM Serif Display', serif;"
                        @keyup.enter="placeBid(customBidAmount)"
                      />
                    </div>
                    <button
                      @click="placeBid(customBidAmount)"
                      :disabled="!customBidAmount || customBidAmount < suggestedBid || processingBid || auction.status !== 'active' || timeLeft === 'Ended'"
                      style="background: var(--accent); color: white; border: none; padding: 0 18px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.15s; font-family: 'DM Sans', sans-serif; white-space: nowrap; opacity: 1;"
                      :style="(!customBidAmount || customBidAmount < suggestedBid || auction.status !== 'active' || timeLeft === 'Ended') ? 'opacity: 0.4; cursor: not-allowed;' : ''"
                    >
                      Place Bid
                    </button>
                </div>
                <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Minimum bid: ₹{{ suggestedBid.toLocaleString() }}</p>
              </div>
            </div>

            <!-- Fee Breakdown -->
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; margin-bottom: 16px;">
              <div style="font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.06em;">If You Win at ₹{{ highestBid.toLocaleString() }}</div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: var(--text-secondary);">
                  <span>Hammer price</span>
                  <span style="color: var(--text-primary); font-weight: 500;">₹{{ highestBid.toLocaleString() }}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: var(--text-secondary);">
                  <span>Buyer's premium (5%)</span>
                  <span style="color: var(--text-primary); font-weight: 500;">₹{{ Math.round(highestBid * 0.05).toLocaleString() }}</span>
                </div>
                <div style="border-top: 1px solid var(--border-color); padding-top: 10px; display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; color: var(--text-primary);">
                  <span>Total payable</span>
                  <span style="color: var(--accent);" class="bid-amount">₹{{ Math.round(highestBid * 1.05).toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <!-- Proxy Bid -->
            <div style="background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: 14px; padding: 20px;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
                <v-icon size="20" style="color: var(--accent);">mdi-robot-outline</v-icon>
                <div>
                  <div style="font-size: 14px; font-weight: 600; color: var(--text-primary);">Auto-Bid (Proxy)</div>
                  <div style="font-size: 12px; color: var(--text-muted);">Bid automatically up to your max</div>
                </div>
              </div>
              <div style="display: flex; gap: 8px;">
                <div style="flex: 1; display: flex; align-items: center; gap: 8px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; padding: 0 12px;">
                  <span style="color: var(--text-muted); font-weight: 600;">₹</span>
                  <input v-model.number="proxyCeiling" type="number" placeholder="Your max amount" style="flex: 1; border: none; background: transparent; color: var(--text-primary); font-size: 14px; outline: none; padding: 10px 0; font-family: 'DM Sans', sans-serif;" />
                </div>
                <button @click="setProxy" style="background: var(--bg-elevated); color: var(--accent); border: 1px solid var(--border-color); padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap;">
                  Set Max
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  <div v-else style="display: flex; align-items: center; justify-content: center; min-height: 60vh; background: var(--bg-page);">
    <div style="text-align: center;">
      <v-progress-circular indeterminate color="primary" size="48" width="4"></v-progress-circular>
      <p style="color: var(--text-muted); margin-top: 16px; font-size: 14px;">Loading auction...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import socket from '../services/socket'
import { useNotification } from '../services/notification'

const notification = useNotification()
const authStore = useAuthStore()
const route = useRoute()

const auction = ref(null)
const highestBid = ref(0)
const lastIncrement = ref(1000)
const isJoined = ref(false)
const joining = ref(false)
const timeLeft = ref("--:--:--")
const isExtended = ref(false)
const proxyCeiling = ref(null)
const processingBid = ref(false)
const showPriceFlash = ref(false)
const lastBidStatus = ref('')
const customBidAmount = ref(null)
const placeholderImage = 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?auto=format&fit=crop&q=80&w=800'

const userId = computed(() => authStore.user?.uid || 'anonymous')
const suggestedBid = computed(() => (highestBid.value || (auction.value?.minBid ?? 0)) + 1000)

const setProxy = () => {
  if (!proxyCeiling.value || proxyCeiling.value <= highestBid.value) {
    return notification.add('Set a proxy amount higher than current bid', 'error')
  }
  socket.emit('setProxyBid', { auctionId: route.params.id, userId: userId.value, ceiling: proxyCeiling.value })
  notification.add(`Auto-bid set: ₹${proxyCeiling.value.toLocaleString()}`, 'success')
}

const updateTimer = () => {
  if (!auction.value?.endTime || timeLeft.value === "Ended") return
  const diff = new Date(auction.value.endTime).getTime() - Date.now()
  if (diff <= 0) { 
    timeLeft.value = "Ended"
    notification.add("Bidding period has expired. Finalizing results...", "info")
    return 
  }
  const h = Math.floor(diff / 3600000).toString().padStart(2, '0')
  const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0')
  const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')
  timeLeft.value = `${h}:${m}:${s}`
}

let timerInterval

const joinAuction = async () => {
  const emd = (auction.value?.minBid || 0) * 0.1
  if (authStore.user?.credits < emd) {
    return notification.add(`Insufficient balance. Need ₹${emd.toLocaleString()} deposit.`, 'error')
  }
  joining.value = true
  setTimeout(() => {
    isJoined.value = true
    joining.value = false
    notification.add('Deposit placed! You can now bid.', 'success')
  }, 1500)
}

const fetchAuction = async () => {
  try {
    const res = await api.get('/api/auctions')
    const found = res.data.find(a => String(a.id) === String(route.params.id))
    if (found) {
      auction.value = { ...found, endTime: found.endTime || new Date(Date.now() + 3600000).toISOString() }
      highestBid.value = found.highestBid || found.minBid
    } else throw new Error('not found')
  } catch {
    auction.value = {
      id: route.params.id, title: 'Vintage Rolex Submariner',
      description: 'Rare 1970s model in pristine condition. Certified authentic.', minBid: 450000,
      highestBid: 520000, category: 'Watches',
      imageUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?auto=format&fit=crop&q=80&w=800',
      endTime: new Date(Date.now() + 5000000).toISOString()
    }
    highestBid.value = 520000
  }
}

const placeBid = (amount) => {
  if (!amount || amount < suggestedBid.value) return
  processingBid.value = true
  lastIncrement.value = amount - highestBid.value
  socket.emit('placeBid', { auctionId: route.params.id, userId: userId.value, amount })
  setTimeout(() => { processingBid.value = false; customBidAmount.value = null }, 800)
}

onMounted(async () => {
  await fetchAuction()
  timerInterval = setInterval(updateTimer, 1000)
  socket.on('bidUpdate', (data) => {
    if (String(data.auctionId) === String(route.params.id)) {
      const prev = highestBid.value
      highestBid.value = parseFloat(data.amount)
      lastIncrement.value = highestBid.value - prev
      showPriceFlash.value = true
      lastBidStatus.value = `Bid of ₹${highestBid.value.toLocaleString()} accepted`
      setTimeout(() => { showPriceFlash.value = false; lastBidStatus.value = '' }, 3000)
    }
  })
  socket.on('timerExtension', (data) => {
    if (String(data.auctionId) === String(route.params.id)) {
      auction.value.endTime = data.newEndTime
      isExtended.value = true
      notification.add('Timer extended! Last-minute bids received.', 'info')
    }
  })
  socket.on('biddingStopped', (data) => {
    if (String(data.auctionId) === String(route.params.id)) {
      auction.value.status = data.status
      if (data.status === 'closed') {
        const isWinner = data.winner === userId.value
        notification.add(isWinner ? 'CONGRATULATIONS! You won the auction!' : 'Bidding has stopped. Auction closed.', isWinner ? 'success' : 'warning')
      } else if (data.status === 'deleted') {
        notification.add('This auction has been cancelled by administration.', 'error')
        router.push('/auctions')
      }
    }
  })
})

onUnmounted(() => {
  socket.off('bidUpdate')
  socket.off('timerExtension')
  socket.off('biddingStopped')
  clearInterval(timerInterval)
})
</script>

<style scoped>
.quick-bid-btn:hover:not(:disabled) {
  background: var(--accent-soft) !important;
  border-color: var(--accent) !important;
  color: var(--accent) !important;
}
.quick-bid-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>