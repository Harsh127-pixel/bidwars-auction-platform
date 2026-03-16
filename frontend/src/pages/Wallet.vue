<template>
  <div style="background: var(--bg-page); min-height: 100vh; padding: 32px 16px;">
    <div style="max-width: 1280px; margin: 0 auto;">

      <div class="animate-in" style="margin-bottom: 32px;">
        <h1 class="font-display" style="font-size: 36px; color: var(--text-primary); margin: 0 0 8px; font-weight: 400;">Wallet</h1>
        <p style="color: var(--text-secondary); font-size: 15px; margin: 0;">Manage your funds and view transaction history</p>
      </div>

      <!-- Balance Cards -->
      <div class="animate-in animate-in-delay-1" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px;">
        <div style="background: var(--accent); border-radius: 14px; padding: 28px; color: white;">
          <div style="font-size: 12px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;">Available Balance</div>
          <div class="bid-amount" style="font-size: 40px; color: white;">₹{{ (authStore.user?.credits || 0).toLocaleString() }}</div>
          <div style="font-size: 13px; opacity: 0.6; margin-top: 8px;">Ready to bid</div>
        </div>
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 28px;">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;">In Escrow</div>
          <div class="bid-amount" style="font-size: 40px; color: var(--text-primary);">₹{{ (authStore.user?.heldCredits || 0).toLocaleString() }}</div>
          <div style="font-size: 13px; color: var(--text-muted); margin-top: 8px;">Reserved for bids</div>
        </div>
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 28px;">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;">Total Portfolio</div>
          <div class="bid-amount" style="font-size: 40px; color: var(--text-primary);">₹{{ ((authStore.user?.credits || 0) + (authStore.user?.heldCredits || 0)).toLocaleString() }}</div>
          <div style="font-size: 13px; color: var(--text-muted); margin-top: 8px;">Combined value</div>
        </div>
      </div>

      <div class="d-flex flex-wrap" style="gap: 24px;">
        <!-- Add Funds Card -->
        <div class="animate-in animate-in-delay-2" style="flex: 0 0 380px; min-width: 280px;">
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
            <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color);">
              <h2 style="font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--text-primary); margin: 0; font-weight: 400;">Add Funds</h2>
            </div>
            <div style="padding: 24px;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 20px;">
                <button
                  v-for="amount in [5000, 25000, 100000, 500000]"
                  :key="amount"
                  @click="topupAmount = amount"
                  :style="{
                    padding: '12px',
                    borderRadius: '8px',
                    border: topupAmount === amount ? 'none' : '1px solid var(--border-color)',
                    background: topupAmount === amount ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: topupAmount === amount ? 'white' : 'var(--text-primary)',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'DM Sans, sans-serif'
                  }"
                >₹{{ amount >= 1000 ? (amount/1000)+'K' : amount }}</button>
              </div>

              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 13px; color: var(--text-secondary); font-weight: 600; margin-bottom: 8px;">Or enter custom amount</label>
                <div style="display: flex; align-items: center; gap: 8px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; padding: 0 14px;">
                  <span style="color: var(--text-muted); font-weight: 600; font-size: 16px;">₹</span>
                  <input
                    v-model.number="topupAmount"
                    type="number"
                    placeholder="0"
                    style="flex: 1; border: none; background: transparent; color: var(--text-primary); font-size: 16px; outline: none; padding: 12px 0; font-family: 'DM Serif Display', serif; font-variant-numeric: tabular-nums;"
                  />
                </div>
              </div>

              <div style="background: var(--bg-elevated); border-radius: 8px; padding: 14px; margin-bottom: 16px; border: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">
                  <span>Amount</span>
                  <span style="color: var(--text-primary); font-weight: 500;">₹{{ (topupAmount || 0).toLocaleString() }}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">
                  <span>Processing fee</span>
                  <span style="color: var(--success); font-weight: 600;">Free</span>
                </div>
                <div style="border-top: 1px solid var(--border-color); padding-top: 8px; display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; color: var(--text-primary);">
                  <span>You receive</span>
                  <span style="color: var(--accent);">₹{{ (topupAmount || 0).toLocaleString() }}</span>
                </div>
              </div>

              <button
                @click="simulateTopup"
                :disabled="!topupAmount || topupAmount <= 0 || topupLoading"
                style="width: 100%; background: var(--accent); color: white; border: none; padding: 13px; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.15s; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px;"
                :style="(!topupAmount || topupAmount <= 0) ? 'opacity: 0.4; cursor: not-allowed;' : ''"
              >
                <v-progress-circular v-if="topupLoading" size="16" width="2" indeterminate color="white"></v-progress-circular>
                {{ topupLoading ? 'Processing...' : 'Add Funds' }}
              </button>

              <p style="text-align: center; font-size: 12px; color: var(--text-muted); margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                <v-icon size="12">mdi-shield-check</v-icon>
                Simulated payments — safe to test
              </p>
            </div>
          </div>
        </div>

        <!-- Transaction History -->
        <div class="animate-in animate-in-delay-3" style="flex: 1; min-width: 300px;">
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
            <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
              <h2 style="font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--text-primary); margin: 0; font-weight: 400;">Transaction History</h2>
              <button @click="fetchHistory" style="background: var(--bg-elevated); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 6px;">
                <v-icon size="14">mdi-refresh</v-icon>
                Refresh
              </button>
            </div>

            <div v-if="loading" style="padding: 48px; text-align: center;">
              <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
              <p style="color: var(--text-muted); margin-top: 12px; font-size: 14px;">Loading transactions...</p>
            </div>

            <div v-else-if="history.length === 0" style="padding: 64px 24px; text-align: center;">
              <div style="width: 56px; height: 56px; background: var(--bg-subtle); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                <v-icon size="26" style="color: var(--text-muted);">mdi-receipt-text-outline</v-icon>
              </div>
              <p style="color: var(--text-muted); font-size: 14px; margin: 0;">No transactions yet. Add funds to get started.</p>
            </div>

            <div v-else>
              <div
                v-for="tx in history"
                :key="tx.id"
                style="padding: 16px 24px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 16px; transition: background 0.15s;"
                @mouseover="$event.currentTarget.style.background = 'var(--bg-subtle)'"
                @mouseleave="$event.currentTarget.style.background = 'transparent'"
              >
                <div :style="{
                  width: '40px', height: '40px',
                  background: tx.amount > 0 ? 'var(--success-soft)' : 'var(--accent-soft)',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }">
                  <v-icon size="18" :style="{ color: tx.amount > 0 ? 'var(--success)' : 'var(--accent)' }">
                    {{ tx.amount > 0 ? 'mdi-plus' : 'mdi-minus' }}
                  </v-icon>
                </div>

                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 600; color: var(--text-primary); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ formatType(tx.type) }}</div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">{{ formatDate(tx.createdAt) }}</div>
                </div>

                <div style="text-align: right; flex-shrink: 0;">
                  <div :style="{ fontFamily: 'DM Serif Display, serif', fontSize: '16px', fontVariantNumeric: 'tabular-nums', color: tx.amount > 0 ? 'var(--success)' : 'var(--accent)', fontWeight: 400 }">
                    {{ tx.amount > 0 ? '+' : '' }}₹{{ Math.abs(tx.amount).toLocaleString() }}
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Bal: ₹{{ tx.newBalance.toLocaleString() }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { useNotification } from '../services/notification'

const notification = useNotification()
const authStore = useAuthStore()
const history = ref([])
const loading = ref(true)
const topupAmount = ref(25000)
const topupLoading = ref(false)

const simulateTopup = async () => {
  if (!topupAmount.value || topupAmount.value <= 0) return
  topupLoading.value = true
  try {
    await api.post('/api/wallet/topup', { amount: topupAmount.value })
    notification.add(`₹${topupAmount.value.toLocaleString()} added to your wallet!`, 'success')
    topupAmount.value = 25000
    await fetchHistory()
    await authStore.init()
  } catch {
    notification.add('Payment failed. Please try again.', 'error')
  } finally {
    topupLoading.value = false }
}

const fetchHistory = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/wallet/history')
    history.value = res.data
  } catch { notification.add('Failed to load transactions.', 'error') }
  finally { loading.value = false }
}

const formatDate = (ts) => {
  if (!ts) return ''
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatType = (type) => {
  const map = { topup: 'Funds Added', bid_hold: 'Bid Placed (Held)', bid_release: 'Bid Released', win: 'Won Auction' }
  return map[type] || (type || 'Transaction').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

onMounted(fetchHistory)
</script>