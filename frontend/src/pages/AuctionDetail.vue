<template>
  <div style="background-color: var(--bg-page); min-height: 100vh;" v-if="!loading && auction">
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

    <div style="max-width: 1280px; margin: 0 auto; padding: 24px 16px;">
      <div class="d-flex flex-wrap-reverse flex-lg-nowrap" style="gap: 32px; align-items: flex-start;">

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
          <div style="margin-top: 24px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <v-chip size="small" variant="tonal" color="primary" class="font-weight-black uppercase tracking-widest">{{ auction.category }}</v-chip>
              <div style="font-family: 'DM Mono', monospace; color: var(--text-muted); font-size: 12px; font-weight: 700;">LOT-{{ auction.id.slice(0, 8).toUpperCase() }}</div>
            </div>
            
            <h1 class="font-display" style="font-size: clamp(28px, 4vw, 42px); color: var(--text-primary); margin: 0 0 16px; font-weight: 400; line-height: 1.1; letter-spacing: -0.02em;">
              {{ auction.title }}
            </h1>
            <p style="color: var(--text-secondary); font-size: 16px; line-height: 1.8; margin: 0; font-weight: 400;">{{ auction.description }}</p>

            <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid var(--border-color); display: flex; gap: 40px; flex-wrap: wrap;">
              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800;">Starting Valuation</div>
                <div style="font-weight: 400; color: var(--text-primary); margin-top: 8px; font-size: 24px; font-family: 'DM Serif Display', serif;">₹{{ (auction.minBid || 0).toLocaleString() }}</div>
              </div>
              <div v-if="auction.sellerId && auction.sellerId !== 'admin'">
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800;">Consignor Node</div>
                <div style="font-weight: 700; color: var(--primary); margin-top: 8px; font-size: 16px; font-family: 'DM Sans', sans-serif;">{{ auction.sellerId.slice(0, 8) }}...</div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800;">Safeguard Status</div>
                <div style="font-weight: 700; color: var(--success); margin-top: 8px; font-size: 16px; display: flex; align-items: center; gap: 6px;">
                  <v-icon size="20">mdi-shield-check</v-icon> Escrow Protected
                </div>
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

          <!-- Bid Momentum Chart (NEW) -->
          <div style="margin-top: 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 24px; text-align: left;">
            <div class="d-flex align-center justify-space-between mb-6">
              <div>
                <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">Market Momentum</h3>
                <p style="font-size: 11px; color: var(--text-muted); margin: 2px 0 0;">Price action since auction inception</p>
              </div>
              <v-icon color="success" size="20">mdi-trending-up</v-icon>
            </div>
            
            <div style="height: 140px; position: relative;">
              <Line v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
              <div v-else style="height: 100%; display: flex; align-items: center; justify-content: center; background: var(--bg-subtle); border-radius: 8px;">
                <p class="text-caption text-muted">Awaiting initial market data...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Bidding Panel -->
        <div class="bidding-panel-wrapper animate-in animate-in-delay-2" style="z-index: 10;">
          
          <!-- AI Market Sentiment (Alpha Prediction) -->
          <div v-if="aiSentiment" style="background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%); border: 1px solid var(--accent-soft); border-radius: 14px; padding: 20px; margin-bottom: 24px; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -10px; right: -10px; opacity: 0.05; transform: rotate(15deg);">
              <v-icon size="80" color="accent">mdi-robot-vacuum-variant</v-icon>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <v-chip size="x-small" color="accent" variant="flat" class="font-weight-black">AI ALPHA</v-chip>
              <span style="font-size: 11px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em;">Market Sentiment Prediction</span>
            </div>
            <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 24px; font-weight: 800; color: var(--text-primary);">₹{{ aiSentiment.predictedPrice.toLocaleString() }}</span>
              <span style="font-size: 12px; font-weight: 500; color: var(--text-muted);">Target Price</span>
            </div>
            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4; margin: 0;">"{{ aiSentiment.analysis }}"</p>
            <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px;">
              <div style="flex: 1; height: 4px; background: var(--bg-subtle); border-radius: 2px;">
                <div :style="{ width: (aiSentiment.confidence * 100) + '%', height: '100%', background: 'var(--accent)', borderRadius: '2px' }"></div>
              </div>
              <span style="font-size: 11px; font-weight: 700; color: var(--text-muted);">{{ Math.round(aiSentiment.confidence * 100) }}% CONFIDENCE</span>
            </div>
          </div>

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
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 32px; margin-bottom: 24px; position: relative; overflow: hidden;" :style="showPriceFlash ? 'border-color: var(--accent); box-shadow: 0 0 30px rgba(99, 102, 241, 0.15);' : ''">
              <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--accent); transition: opacity 0.3s;" :style="showPriceFlash ? 'opacity: 1' : 'opacity: 0'"></div>
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; font-weight: 800;">Current Highest Bid</div>
              <div class="bid-amount font-display" style="font-size: 48px; transition: color 0.3s ease; line-height: 1;" :style="showPriceFlash ? 'color: var(--accent)' : 'color: var(--text-primary)'">
                ₹{{ highestBid.toLocaleString() }}
              </div>
              <div v-if="lastBidStatus" style="margin-top: 12px; font-size: 13px; color: var(--success); display: flex; align-items: center; gap: 6px; font-weight: 700;">
                <v-icon size="16">mdi-check-circle</v-icon>
                {{ lastBidStatus }}
              </div>
            </div>

            <!-- Quick Bid Buttons -->
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.1em;">Rapid Execution</div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
                  <button
                    v-for="inc in [1000, 5000, 10000, 25000, 50000, 100000]"
                    :key="inc"
                    @click="placeBid(highestBid + inc)"
                    :disabled="processingBid || auction?.status !== 'active' || timeLeft === 'Ended'"
                    style="padding: 12px 8px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 10px; font-size: 14px; font-weight: 700; color: var(--text-primary); cursor: pointer; transition: all 0.15s ease; font-family: 'DM Sans', sans-serif; text-align: center;"
                    class="quick-bid-btn"
                  >
                    +₹{{ inc >= 1000 ? (inc/1000)+'K' : inc }}
                  </button>
                </div>
  
                <div style="border-top: 1px solid var(--border-color); padding-top: 20px;">
                  <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Custom Capital</div>
                  <div style="display: flex; gap: 12px;">
                    <div style="flex: 1; display: flex; align-items: center; gap: 8px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 10px; padding: 0 16px;">
                      <span style="color: var(--text-muted); font-weight: 600;">₹</span>
                      <input
                        v-model.number="customBidAmount"
                        type="number"
                        :placeholder="suggestedBid.toLocaleString()"
                        :disabled="auction?.status !== 'active' || timeLeft === 'Ended'"
                        style="flex: 1; border: none; background: transparent; color: var(--text-primary); font-size: 16px; font-weight: 600; outline: none; padding: 12px 0; font-family: 'DM Serif Display', serif;"
                        @keyup.enter="placeBid(customBidAmount)"
                      />
                    </div>
                    <button
                      @click="placeBid(customBidAmount)"
                      :disabled="!customBidAmount || customBidAmount < suggestedBid || processingBid || auction?.status !== 'active' || timeLeft === 'Ended'"
                      style="background: var(--accent); color: white; border: none; padding: 0 24px; border-radius: 10px; font-size: 15px; font-weight: 800; cursor: pointer; transition: background 0.15s; font-family: 'DM Sans', sans-serif; white-space: nowrap; opacity: 1;"
                      :style="(!customBidAmount || customBidAmount < suggestedBid || auction?.status !== 'active' || timeLeft === 'Ended') ? 'opacity: 0.4; cursor: not-allowed;' : ''"
                    >
                      EXECUTE BID
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

            <!-- Buy It Now -->
            <div v-if="auction.buyItNow && (!auction.bidCount || auction.bidCount === 0)" style="background: var(--bg-card); border: 2px solid var(--accent); border-radius: 14px; padding: 20px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div>
                  <div style="font-size: 13px; font-weight: 700; color: var(--accent); text-transform: uppercase;">Direct Purchase</div>
                  <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">₹{{ auction.buyItNow.toLocaleString() }}</div>
                </div>
                <button @click="buyItNow" :disabled="processingBid" style="background: var(--accent); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: transform 0.1s;">
                  BUY IT NOW
                </button>
              </div>
              <p style="font-size: 11px; color: var(--text-muted); margin: 0;">Skip the bidding and secure this item immediately.</p>
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
                  <input v-model.number="proxyCeiling" type="number" :placeholder="'Max (Min: ₹' + (highestBid + 5000) + ')'" style="flex: 1; border: none; background: transparent; color: var(--text-primary); font-size: 14px; outline: none; padding: 10px 0; font-family: 'DM Sans', sans-serif;" />
                </div>
                <button @click="setProxy" :disabled="!proxyCeiling || processingBid" style="background: var(--bg-elevated); color: var(--accent); border: 1px solid var(--border-color); padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap;">
                  Set Max
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading / Error State -->
  <div v-else-if="loading" style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--bg-page);">
    <div style="text-align: center;">
      <v-progress-circular indeterminate color="primary" size="64" width="4"></v-progress-circular>
      <p style="color: var(--text-muted); margin-top: 24px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Decrypting Floor Assets...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import socket from '../services/socket'
import { useNotification } from '../services/notification'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler)

const notification = useNotification()
const authStore = useAuthStore()
const route = useRoute()

const auction = ref(null)
const highestBid = ref(0)
const lastIncrement = ref(1000)
const proxyCeiling = ref(null)
const isJoined = ref(false)
const joining = ref(false)
const timeLeft = ref("--:--:--")
const isExtended = ref(false)
const processingBid = ref(false)
const showPriceFlash = ref(false)
const lastBidStatus = ref('')
const customBidAmount = ref(null)
const placeholderImage = 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?auto=format&fit=crop&q=80&w=800'
const aiSentiment = ref(null)

const fetchAISentiment = async () => {
  try {
    const res = await api.get(`/api/auctions/${route.params.id}/sentiment`)
    aiSentiment.value = res.data
  } catch (err) {
    console.error("Alpha signal lost", err)
  }
}

const bidHistory = ref([])
const chartData = reactive({
  labels: [],
  datasets: [{
    label: 'Price (₹)',
    data: [],
    borderColor: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    fill: true,
    tension: 0.4,
    pointRadius: 0
  }]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: {
    x: { display: false },
    y: { display: false }
  }
}

const userId = computed(() => authStore.user?.uid || 'anonymous')
const suggestedBid = computed(() => (highestBid.value || (auction.value?.minBid ?? 0)) + 1000)

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

const fetchBidHistory = async () => {
  try {
    const res = await api.get(`/api/auctions/${route.params.id}/bids`)
    bidHistory.value = res.data
    updateChart()
  } catch (err) {
    console.error("Historical data extraction failed", err)
  }
}

const updateChart = () => {
  if (bidHistory.value.length === 0) return
  chartData.labels = bidHistory.value.map(b => new Date(b.timestamp).toLocaleTimeString())
  chartData.datasets[0].data = bidHistory.value.map(b => b.amount)
}

const loading = ref(true)
const router = useRouter()

const fetchAuction = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/auctions')
    const found = res.data.find(a => String(a.id) === String(route.params.id))
    if (found) {
      // Normalize Firestore Timestamp objects to ISO strings for the timer
      if (found.endTime && typeof found.endTime === 'object' && found.endTime._seconds) {
        found.endTime = new Date(found.endTime._seconds * 1000).toISOString()
      }
      // If no endTime, give auction 24 hours from now
      if (!found.endTime || isNaN(new Date(found.endTime).getTime())) {
        found.endTime = new Date(Date.now() + 86400000).toISOString()
      }
      auction.value = found
      highestBid.value = found.highestBid || found.minBid
    } else {
      notification.add('Asset not found or restricted.', 'error')
      router.push('/auctions')
    }
  } catch {
    notification.add('Connection failure. Returning to floor.', 'error')
    router.push('/auctions')
  } finally {
    loading.value = false
  }
}

const placeBid = (amount, isProxy = false) => {
  if (!amount || (!isProxy && amount < suggestedBid.value)) {
    notification.add(`Minimum bid is ₹${suggestedBid.value.toLocaleString()}`, 'warning')
    return
  }
  if (!authStore.user) {
    notification.add('Please sign in to place a bid.', 'error')
    return
  }
  processingBid.value = true
  lastIncrement.value = amount - highestBid.value
  socket.emit('placeBid', { auctionId: route.params.id, userId: userId.value, amount, isProxy })
  setTimeout(() => { processingBid.value = false; customBidAmount.value = null }, 2000)
}

const setProxy = () => {
  if (!proxyCeiling.value || proxyCeiling.value <= highestBid.value) {
    notification.add('Max bid must be higher than current price.', 'warning');
    return;
  }
  placeBid(proxyCeiling.value, true);
  notification.add(`Smart-Proxy engaged at ₹${proxyCeiling.value.toLocaleString()}`, 'success');
  proxyCeiling.value = null;
}

const buyItNow = async () => {
  if (!confirm(`Confirm immediate purchase for ₹${auction.value.buyItNow.toLocaleString()}?`)) return
  processingBid.value = true
  try {
    await api.post(`/api/auctions/buy-it-now/${route.params.id}`)
    notification.add('Purchase successful! Redirecting to checkout...', 'success')
  } catch (err) {
    notification.add(err.response?.data?.message || 'Purchase failed', 'error')
  } finally {
    processingBid.value = false
  }
}

onMounted(async () => {
  await fetchAuction()
  fetchBidHistory()
  fetchAISentiment()
  timerInterval = setInterval(updateTimer, 1000)
  socket.on('bidUpdate', (data) => {
    if (String(data.auctionId) === String(route.params.id)) {
      const prev = highestBid.value
      highestBid.value = parseFloat(data.amount)
      lastIncrement.value = highestBid.value - prev
      showPriceFlash.value = true
      lastBidStatus.value = `Bid of ₹${highestBid.value.toLocaleString()} accepted`
      
      // Update Chart Realtime
      bidHistory.value.push({ amount: highestBid.value, timestamp: new Date().toISOString() })
      updateChart()

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
  socket.on('error', (err) => {
    processingBid.value = false
    notification.add(err.message || 'Bid was rejected by the exchange.', 'error')
    lastBidStatus.value = ''
  })
})

onUnmounted(() => {
  socket.off('bidUpdate')
  socket.off('timerExtension')
  socket.off('biddingStopped')
  socket.off('error')
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

.bidding-panel-wrapper {
  width: 380px;
  min-width: 300px;
  position: sticky;
  top: 96px;
}

@media (max-width: 1024px) {
  .bidding-panel-wrapper {
    width: 100%;
    position: relative !important;
    top: 0 !important;
    margin-bottom: 32px;
  }
}
</style>