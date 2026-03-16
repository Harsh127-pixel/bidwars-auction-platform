<template>
  <v-container class="py-12 px-6 animate-fade" max-width="1280">
    <!-- Treasury Hero Intelligence -->
    <v-row class="mb-10">
      <v-col cols="12" lg="8">
        <v-card 
          elevation="24" 
          class="rounded-2xl overflow-hidden border-subtle relative bg-primary text-white h-100"
          style="min-height: 280px;"
        >
          <div class="position-absolute inset-0 opacity-10 bg-gradient-to-br from-white to-transparent z-0"></div>
          
          <v-row class="pa-10 relative z-10" align="center">
            <v-col cols="12" md="7">
              <div class="d-flex align-center gap-3 mb-6">
                <v-chip color="white" size="small" variant="flat" class="text-primary font-weight-black text-[10px] tracking-[0.2em] px-3">
                  INSTITUTIONAL TREASURY
                </v-chip>
                <v-chip v-if="authStore.user?.isVerified" color="warning" size="small" variant="flat" class="font-weight-black text-[10px] tracking-[0.2em]">
                   SECURE
                </v-chip>
              </div>
              <h1 class="text-h3 font-weight-black tracking-tighter italic ma-0 leading-tight">
                Current <span class="not-italic opacity-70">Liquidity</span>
              </h1>
              <div class="d-flex align-end gap-3 mt-4">
                <span class="text-h2 font-weight-black tracking-tighter italic">₹{{ (authStore.user?.credits || 0).toLocaleString() }}</span>
                <span class="text-h6 font-weight-bold opacity-60 mb-2 italic">INR Liquid</span>
              </div>
              <p class="text-body-2 font-weight-medium opacity-70 mt-4 max-w-sm">
                Total available capital for spot acquisitions and floor operations. Protected by BWC Escrow protocols.
              </p>
            </v-col>
            <v-col cols="12" md="5" class="d-flex justify-center justify-md-end">
              <div class="text-right">
                <p class="text-overline font-weight-black opacity-60 ma-0 tracking-widest">ASSET ALLOCATION</p>
                <div class="mt-4 space-y-4">
                  <div class="d-flex justify-end align-center gap-4">
                    <div class="text-right">
                      <p class="text-caption font-weight-black mb-0 opacity-70">In Escrow</p>
                      <p class="text-h6 font-weight-black italic ma-0">₹{{ (authStore.user?.heldCredits || 0).toLocaleString() }}</p>
                    </div>
                    <v-avatar color="white" variant="tonal" size="40" rounded="lg">
                      <v-icon icon="mdi-lock-outline" size="20"></v-icon>
                    </v-avatar>
                  </div>
                  <div class="d-flex justify-end align-center gap-4">
                    <div class="text-right">
                      <p class="text-caption font-weight-black mb-0 opacity-70">Total Wealth</p>
                      <p class="text-h6 font-weight-black italic ma-0">₹{{ totalWealth.toLocaleString() }}</p>
                    </div>
                    <v-avatar color="white" variant="tonal" size="40" rounded="lg">
                      <v-icon icon="mdi-bank-outline" size="20"></v-icon>
                    </v-avatar>
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- Tier Privileges -->
      <v-col cols="12" lg="4">
        <v-card variant="outlined" class="rounded-2xl pa-10 bg-surface border-subtle shadow-sm h-100 flex-column d-flex overflow-hidden relative">
          <div class="position-absolute rotate-12 -right-10 -top-10 opacity-5">
             <v-icon icon="mdi-crown" size="200" color="primary"></v-icon>
          </div>
          <div class="relative z-10">
            <p class="text-overline font-weight-black text-muted-custom tracking-widest mb-6">CURATOR CLASS STATUS</p>
            <div class="d-flex align-center gap-4 mb-8">
              <v-avatar color="primary" size="64" variant="tonal" rounded="xl">
                <v-icon :icon="tierIcon" size="32"></v-icon>
              </v-avatar>
              <div>
                <h3 class="text-h4 font-weight-black italic ma-0">{{ authStore.user?.membershipTier || 'Bronze' }}</h3>
                <p class="text-caption font-weight-bold text-primary uppercase tracking-widest">Institutional Access</p>
              </div>
            </div>
            
            <v-divider class="mb-6"></v-divider>
            
            <div class="space-y-4">
              <div class="d-flex justify-space-between">
                <span class="text-caption font-weight-black text-muted-custom uppercase">Platform Fee</span>
                <span class="text-caption font-weight-black text-primary">{{ commissionRate }}%</span>
              </div>
              <div class="d-flex justify-space-between">
                <span class="text-caption font-weight-black text-muted-custom uppercase">Treasury Limit</span>
                <span class="text-caption font-weight-black text-primary">UNLIMITED</span>
              </div>
              <div class="d-flex justify-space-between">
                <span class="text-caption font-weight-black text-muted-custom uppercase">Settlement Speed</span>
                <span class="text-caption font-weight-black text-primary">INSTANT</span>
              </div>
            </div>

            <v-btn block variant="tonal" color="primary" class="rounded-xl mt-8 font-weight-black" height="48">
              UPGRADE STATUS
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Treasury Operations -->
      <v-col cols="12" lg="4">
        <div class="space-y-8">
          <v-card variant="outlined" class="rounded-2xl pa-10 bg-surface border-subtle shadow-sm relative overflow-hidden">
            <div class="d-flex align-center gap-4 mb-8">
              <v-avatar color="success" variant="tonal" rounded="lg" size="48">
                <v-icon icon="mdi-bank-transfer-in" size="24"></v-icon>
              </v-avatar>
              <div>
                <h3 class="text-h5 font-weight-black italic tracking-tight">Add <span class="text-success not-italic">Capital</span></h3>
                <p class="text-[10px] font-weight-bold text-muted-custom uppercase tracking-widest leading-none mt-1">Instant funding via secure gateway</p>
              </div>
            </div>

            <v-row class="mb-6">
              <v-col cols="6" v-for="amount in [25000, 100000, 500000, 1000000]" :key="amount" class="pa-1">
                <v-btn 
                  block 
                  variant="tonal" 
                  :color="topupAmount === amount ? 'primary' : 'grey'"
                  class="rounded-xl font-weight-black border"
                  :class="{'border-primary': topupAmount === amount}"
                  @click="topupAmount = amount"
                >
                  ₹{{ amount >= 1000000 ? (amount/1000000)+'M' : (amount/1000)+'K' }}
                </v-btn>
              </v-col>
            </v-row>

            <v-text-field
              v-model.number="topupAmount"
              prefix="₹"
              label="Custom Amount"
              variant="outlined"
              class="rounded-xl mb-6"
              hide-details
            ></v-text-field>

            <div class="bg-grey-lighten-5 rounded-xl pa-6 mb-6 border border-subtle">
              <div class="d-flex justify-space-between mb-4">
                <span class="text-caption font-weight-black text-muted-custom uppercase">Processing Fee</span>
                <span class="text-caption font-weight-black text-success">0 (FREE)</span>
              </div>
              <div class="d-flex justify-space-between pt-4 border-t border-subtle">
                <span class="text-caption font-weight-black text-primary uppercase">Effective Top-up</span>
                <span class="text-h6 font-weight-black italic">₹{{ (topupAmount || 0).toLocaleString() }}</span>
              </div>
            </div>

            <v-btn 
              block 
              color="primary" 
              class="rounded-pill" 
              height="56" 
              @click="simulateTopup"
              :loading="topupLoading"
            >
              FINALIZE DEPOSIT
            </v-btn>
          </v-card>

          <!-- Security Matrix -->
          <v-card variant="outlined" class="rounded-2xl pa-10 bg-surface border-subtle shadow-sm">
            <p class="text-overline font-weight-black text-primary tracking-[0.2em] mb-6 uppercase">Treasury Security</p>
            <div class="space-y-4">
              <div class="d-flex align-center gap-4 pa-4 bg-grey-lighten-5 rounded-xl">
                 <v-icon icon="mdi-shield-check" color="success"></v-icon>
                 <div>
                   <p class="text-caption font-weight-black ma-0">Escrow Safeguard</p>
                   <p class="text-[10px] font-weight-bold text-muted-custom uppercase">Active for all bids</p>
                 </div>
              </div>
              <div class="d-flex align-center gap-4 pa-4 bg-grey-lighten-5 rounded-xl">
                 <v-icon icon="mdi-sync" color="primary"></v-icon>
                 <div>
                   <p class="text-caption font-weight-black ma-0">Forensic Sync</p>
                   <p class="text-[10px] font-weight-bold text-muted-custom uppercase">Real-time ledger audit</p>
                 </div>
              </div>
            </div>
          </v-card>
        </div>
      </v-col>

      <!-- Forensic Audit Trail -->
      <v-col cols="12" lg="8">
        <v-card variant="outlined" class="rounded-2xl bg-surface border-subtle shadow-sm overflow-hidden h-100 flex-column d-flex text-left">
          <div class="pa-8 d-flex align-center justify-space-between bg-grey-lighten-5 border-b border-subtle">
            <div>
              <h3 class="text-h5 font-weight-black italic ma-0 tracking-tighter">Forensic Audit <span class="text-primary not-italic">Trail</span></h3>
              <p class="text-[10px] font-weight-bold text-muted-custom uppercase tracking-widest mt-1">Cryptographic record of all wealth movements</p>
            </div>
            <v-btn variant="tonal" rounded="pill" color="primary" icon="mdi-refresh" @click="fetchHistory" :loading="loading"></v-btn>
          </div>

          <div class="flex-grow-1 overflow-y-auto" style="max-height: 800px;">
            <div v-if="loading" class="pa-12 text-center">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
            <div v-else-if="history.length === 0" class="pa-20 text-center text-muted-custom">
               <v-icon icon="mdi-receipt-text-outline" size="64" class="mb-4 opacity-20"></v-icon>
               <p class="text-h6 font-weight-black italic">No transaction history detected</p>
            </div>
            <div v-else>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: var(--bg-page);">
                    <th class="pa-6 text-left text-[10px] font-weight-black uppercase text-muted-custom tracking-widest">Operation</th>
                    <th class="pa-6 text-left text-[10px] font-weight-black uppercase text-muted-custom tracking-widest">Date & Identity</th>
                    <th class="pa-6 text-right text-[10px] font-weight-black uppercase text-muted-custom tracking-widest">Delta</th>
                    <th class="pa-6 text-right text-[10px] font-weight-black uppercase text-muted-custom tracking-widest">Treasury Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tx in history" :key="tx.id" class="border-b border-subtle hover:bg-grey-lighten-5 transition-colors">
                    <td class="pa-6">
                      <div class="d-flex align-center gap-3">
                        <v-avatar :color="tx.amount > 0 ? 'success-soft' : 'error-soft'" size="32" rounded="lg">
                          <v-icon :icon="tx.amount > 0 ? 'mdi-plus' : 'mdi-minus'" :color="tx.amount > 0 ? 'success' : 'error'" size="16"></v-icon>
                        </v-avatar>
                        <div>
                          <p class="text-caption font-weight-black ma-0">{{ formatType(tx.type) }}</p>
                          <p v-if="tx.auctionId" class="text-[9px] font-weight-bold text-primary uppercase">Ref: {{ tx.auctionId.slice(0,12) }}...</p>
                        </div>
                      </div>
                    </td>
                    <td class="pa-6">
                      <p class="text-caption font-weight-bold ma-0">{{ formatDate(tx.createdAt) }}</p>
                      <p class="text-[9px] font-weight-black text-muted-custom uppercase">BWC Protocol V2.1</p>
                    </td>
                    <td class="pa-6 text-right">
                      <span :class="tx.amount > 0 ? 'text-success' : 'text-error'" class="text-caption font-weight-black">
                        {{ tx.amount > 0 ? '+' : '' }}₹{{ Math.abs(tx.amount).toLocaleString() }}
                      </span>
                    </td>
                    <td class="pa-6 text-right">
                      <span class="text-caption font-weight-black italic">₹{{ tx.newBalance.toLocaleString() }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
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
const topupAmount = ref(100000)
const topupLoading = ref(false)

const totalWealth = computed(() => {
  return (authStore.user?.credits || 0) + (authStore.user?.heldCredits || 0)
})

const commissionRate = computed(() => {
  const tier = authStore.user?.membershipTier || 'Bronze'
  if (tier === 'Gold') return 1
  if (tier === 'Silver') return 3
  return 5
})

const tierIcon = computed(() => {
  const tier = authStore.user?.membershipTier || 'Bronze'
  if (tier === 'Gold') return 'mdi-crown'
  if (tier === 'Silver') return 'mdi-medal'
  return 'mdi-certificate'
})

const simulateTopup = async () => {
  if (!topupAmount.value || topupAmount.value <= 0) return
  topupLoading.value = true
  try {
    await api.post('/api/wallet/topup', { amount: topupAmount.value })
    notification.add(`Treasury expanded by ₹${topupAmount.value.toLocaleString()}`, 'success')
    topupAmount.value = 100000
    await fetchHistory()
    // The auth store uses onSnapshot, so balance will update automatically
  } catch {
    notification.add('Treasury deposit failed.', 'error')
  } finally {
    topupLoading.value = false 
  }
}

const fetchHistory = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/wallet/history')
    history.value = res.data
  } catch { 
    notification.add('Forensic link failure.', 'error') 
  } finally { 
    loading.value = false 
  }
}

const formatDate = (ts) => {
  if (!ts) return ''
  const d = ts._seconds ? new Date(ts._seconds * 1000) : (ts.toDate ? ts.toDate() : new Date(ts))
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatType = (type) => {
  const map = { 
    topup: 'Capital Deposit', 
    bid_hold: 'Escrow Reserve', 
    bid_release: 'Reserve Released', 
    win: 'Asset Settlement',
    WALLET_TOPUP: 'Capital Deposit',
    BID_HOLD: 'Escrow Reserve',
    BID_RELEASE: 'Reserve Released',
    AUCTION_WIN: 'Asset Settlement',
    DISPUTE_REFUND: 'Manual Settlement'
  }
  return map[type] || (type || 'Transaction').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

onMounted(() => {
  fetchHistory()
})
</script>

<style scoped>
.animate-fade {
  animation: fadeIn 0.6s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.shadow-sm {
  box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05) !important;
}

.border-subtle {
  border-color: rgba(0,0,0,0.08) !important;
}

.italic {
  font-family: 'DM Serif Display', serif;
}

.not-italic {
  font-family: 'DM Sans', sans-serif;
  font-style: normal;
}

.text-muted-custom {
  color: #64748b;
}

.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.z-0 { z-index: 0; }
.z-10 { z-index: 10; }

.success-soft { background: #ecfdf5; }
.error-soft { background: #fef2f2; }

.space-y-4 > :not([hidden]) ~ :not([hidden]) {
  margin-top: 1rem;
}
.space-y-8 > :not([hidden]) ~ :not([hidden]) {
  margin-top: 2rem;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}

table tr:last-child {
  border-bottom: none;
}
</style>