<template>
  <div style="background: var(--bg-page); min-height: 100vh; padding: 32px 16px;">
    <div style="max-width: 1280px; margin: 0 auto;">

      <!-- Header -->
      <div class="animate-in" style="margin-bottom: 32px;">
        <h1 class="font-display" style="font-size: 36px; color: var(--text-primary); margin: 0 0 8px; font-weight: 400;">
          My Dashboard
        </h1>
        <p style="color: var(--text-secondary); font-size: 15px; margin: 0;">
          Hello, <strong>{{ authStore.user?.username || 'Bidder' }}</strong> — here's your bidding activity
        </p>
      </div>

      <!-- Stats Grid -->
      <div class="animate-in animate-in-delay-1" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px;">
        <!-- Wallet Balance -->
        <div style="background: var(--accent); border-radius: 14px; padding: 24px; color: white; grid-column: span 1;">
          <div style="font-size: 12px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <v-icon size="14">mdi-wallet-outline</v-icon>
            Wallet Balance
          </div>
          <div class="bid-amount" style="font-size: 34px; color: white; margin-bottom: 4px;">₹{{ (authStore.user?.credits || 0).toLocaleString() }}</div>
          <div style="font-size: 12px; opacity: 0.6;">Available to bid</div>
          <router-link to="/wallet" style="display: inline-flex; align-items: center; gap: 4px; margin-top: 16px; background: rgba(255,255,255,0.15); color: white; padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; transition: background 0.15s;">
            Add funds →
          </router-link>
        </div>

        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px;">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <v-icon size="14" style="color: var(--text-muted);">mdi-lock-clock</v-icon>
            In Escrow
          </div>
          <div class="bid-amount" style="font-size: 34px; color: var(--text-primary); margin-bottom: 4px;">₹{{ (authStore.user?.heldCredits || 0).toLocaleString() }}</div>
          <div style="font-size: 12px; color: var(--text-muted);">Reserved for active bids</div>
        </div>

        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px;">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <v-icon size="14" style="color: var(--text-muted);">mdi-gavel</v-icon>
            Active Bids
          </div>
          <div class="bid-amount" style="font-size: 34px; color: var(--text-primary); margin-bottom: 4px;">{{ activeBidsCount }}</div>
          <div style="font-size: 12px; color: var(--text-muted);">Currently leading</div>
        </div>

        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px;">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <v-icon size="14" style="color: var(--success);">mdi-trophy-outline</v-icon>
            Items Won
          </div>
          <div class="bid-amount" style="font-size: 34px; color: var(--text-primary); margin-bottom: 4px;">{{ itemsWonCount }}</div>
          <div style="font-size: 12px; color: var(--text-muted);">All time</div>
        </div>
      </div>

      <!-- Verification Banner (if not verified) -->
      <div v-if="!authStore.user?.isVerified" class="animate-in animate-in-delay-2" style="background: var(--warning-soft); border: 1px solid var(--warning); border-radius: 12px; padding: 20px 24px; margin-bottom: 32px; display: flex; flex-wrap: wrap; align-items: center; gap: 16px;">
        <v-icon size="24" style="color: var(--warning);">mdi-shield-alert-outline</v-icon>
        <div style="flex: 1; min-width: 200px;">
          <div style="font-weight: 700; color: var(--text-primary); font-size: 15px; margin-bottom: 4px;">Verify your account to unlock premium auctions</div>
          <div style="font-size: 13px; color: var(--text-secondary);">Add your PAN/GST to bid on government repossessions and high-value lots.</div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <input
            v-model="verifyCode"
            placeholder="Enter PAN / GST number"
            style="padding: 9px 14px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif; width: 220px;"
          />
          <button @click="verifyAccount" :disabled="verifying" style="background: var(--warning); color: white; border: none; padding: 9px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 6px;">
            <v-progress-circular v-if="verifying" size="14" width="2" indeterminate color="white"></v-progress-circular>
            {{ verifying ? 'Verifying...' : 'Verify Now' }}
          </button>
        </div>
      </div>

      <div v-if="authStore.user?.isVerified" class="animate-in animate-in-delay-2" style="background: var(--success-soft); border: 1px solid var(--success); border-radius: 12px; padding: 16px 20px; margin-bottom: 32px; display: flex; align-items: center; gap: 12px;">
        <v-icon size="20" style="color: var(--success);">mdi-check-decagram</v-icon>
        <span style="font-weight: 600; color: var(--text-primary); font-size: 14px;">Verified account — you have access to all auction categories</span>
      </div>

      <!-- Active Bids Table -->
      <div class="animate-in animate-in-delay-3" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
        <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 style="font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--text-primary); margin: 0 0 4px; font-weight: 400;">My Active Bids</h2>
            <p style="font-size: 13px; color: var(--text-muted); margin: 0;">Auctions where you're currently the highest bidder</p>
          </div>
          <router-link to="/auctions" style="background: var(--bg-elevated); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; transition: all 0.15s;">
            Browse More →
          </router-link>
        </div>

        <div v-if="biddingHistory.length === 0" style="padding: 64px 24px; text-align: center;">
          <div style="width: 60px; height: 60px; background: var(--bg-subtle); border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <v-icon size="28" style="color: var(--text-muted);">mdi-gavel</v-icon>
          </div>
          <h3 style="font-size: 17px; color: var(--text-primary); margin: 0 0 8px; font-weight: 600;">No active bids yet</h3>
          <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 20px;">Start bidding on items you love.</p>
          <router-link to="/auctions" style="display: inline-block; background: var(--accent); color: white; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">
            Browse Auctions
          </router-link>
        </div>

        <table v-else style="width: 100%; border-collapse: collapse;" class="clean-table">
          <thead>
            <tr>
              <th style="text-align: left;">Item</th>
              <th style="text-align: right;">Your Bid</th>
              <th style="text-align: center;">Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in biddingHistory" :key="item.id">
              <td>
                <div style="display: flex; align-items: center; gap: 14px;">
                  <div style="width: 52px; height: 40px; border-radius: 8px; overflow: hidden; background: var(--bg-subtle); flex-shrink: 0;">
                    <v-img :src="item.image" cover style="width: 100%; height: 100%;"></v-img>
                  </div>
                  <div>
                    <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">{{ item.item }}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">ID: {{ item.id.slice(0,8).toUpperCase() }}</div>
                  </div>
                </div>
              </td>
              <td style="text-align: right;">
                <span class="bid-amount" style="font-size: 16px; color: var(--text-primary);">₹{{ item.amount }}</span>
              </td>
              <td style="text-align: center;">
                <span style="background: var(--success-soft); color: var(--success); padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">Leading</span>
              </td>
              <td style="text-align: right;">
                <router-link :to="'/auction/' + item.id" style="color: var(--accent); font-size: 13px; font-weight: 600; text-decoration: none;">View →</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { useNotification } from '../services/notification'

const authStore = useAuthStore()
const notification = useNotification()
const rawAuctions = ref([])
const verifying = ref(false)
const verifyCode = ref('')

const fetchData = async () => {
  try {
    const res = await api.get('/api/auctions')
    rawAuctions.value = res.data
  } catch (err) { console.error(err) }
}

const verifyAccount = async () => {
  if (!verifyCode.value) return notification.add('Please enter your PAN/GST number', 'error')
  verifying.value = true
  try {
    await authStore.verifyKYC()
    notification.add('Account verified! All auction categories unlocked.', 'success')
    verifyCode.value = ''
  } catch (err) {
    notification.add('Verification failed. Please try again.', 'error')
    console.error(err)
  } finally {
    verifying.value = false
  }
}

const biddingHistory = computed(() => {
  const uid = authStore.user?.uid
  if (!uid) return []
  return rawAuctions.value
    .filter(a => a.highestBidder === uid)
    .map(a => ({
      id: a.id, item: a.title,
      amount: a.highestBid.toLocaleString(),
      image: a.imageUrl || 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?auto=format&fit=crop&q=80&w=200'
    }))
})

const activeBidsCount = computed(() => biddingHistory.value.length)
const itemsWonCount = computed(() => authStore.user?.totalWins || 0)

onMounted(fetchData)
</script>