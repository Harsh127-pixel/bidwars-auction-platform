<template>
  <v-container class="py-12 px-6 animate-fade" max-width="1440">
    <!-- Header Architecture -->
    <v-row class="mb-16 align-end">
      <v-col cols="12" md="8" class="text-left">
        <p class="text-overline font-weight-black text-primary tracking-[0.4em] mb-4 uppercase">Institutional Portfolio</p>
        <h1 class="text-h1 font-weight-black tracking-tighter italic ma-0 leading-none">
          Sector <span class="text-primary not-italic">Intelligence</span>
        </h1>
        <p class="text-h6 font-weight-medium text-muted-custom mt-6 max-w-xl leading-relaxed">
          Welcome back, <span class="text-primary font-weight-black">{{ authStore.user?.username || 'Legacy Member' }}</span>. Your market positions are being monitored by the BWC Core in real-time.
        </p>
      </v-col>
      
      <v-col cols="12" md="4" class="d-flex justify-md-end">
        <v-card variant="outlined" class="rounded-pill px-8 py-4 border-subtle bg-surface d-flex align-center gap-6 shadow-sm group hover-border-primary transition-all">
          <v-avatar color="primary" size="64" class="rounded-2xl shadow-lg position-relative rotate-3 group-hover:rotate-0 transition-transform duration-500">
            <span class="text-h4 font-weight-black text-white italic">
              {{ (authStore.user?.username || 'J')[0].toUpperCase() }}
            </span>
            <v-icon
              v-if="authStore.user?.isVerified"
              icon="mdi-check-decagram"
              color="warning"
              size="24"
              class="position-absolute"
              style="top: -6px; right: -6px;"
            ></v-icon>
          </v-avatar>
          <div class="text-left">
            <p class="text-[9px] font-weight-black text-muted-custom tracking-[0.3em] uppercase mb-1 leading-none opacity-60">Security Clearance</p>
            <div class="d-flex align-center gap-2">
              <v-badge dot color="success" inline class="pulse-badge ma-0"></v-badge>
              <p class="text-caption font-weight-black text-primary tracking-[0.2em] uppercase ma-0">
                {{ authStore.user?.isVerified ? 'Elite Verified' : 'Standard Bidder' }}
              </p>
            </div>
            <p class="text-[8px] font-mono mt-1 opacity-30 uppercase tracking-widest">{{ authStore.user?.uid?.slice(0, 16) }}</p>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Capital Infrastructure Grid -->
    <v-row class="mb-16">
      <!-- Master Ledger Card -->
      <v-col cols="12" lg="4">
        <v-card 
          elevation="24" 
          color="primary" 
          class="rounded-3xl pa-12 fill-height d-flex flex-column justify-space-between position-relative overflow-hidden group border-none shadow-premium"
          theme="dark"
        >
          <div class="position-absolute top-0 right-0 w-80 h-80 bg-white opacity-5 rounded-circle blur-3xl translate-x-12 translate-y-n12 group-hover:scale-110 transition-transform duration-1000"></div>
          
          <div>
            <div class="d-flex justify-space-between align-center mb-14">
              <v-sheet
                color="white"
                rounded="xl"
                class="pa-3 px-5 bg-opacity-10 border border-white-opacity-10 shadow-sm"
              >
                <div class="d-flex align-center gap-3">
                  <div class="w-12 h-12 bg-warning rounded-circle shadow-inner-sm pulse-badge"></div>
                  <p class="text-[10px] font-weight-black tracking-[0.4em] uppercase opacity-80 ma-0">BWC MASTER LEDGER</p>
                </div>
              </v-sheet>
              <v-icon icon="mdi-shield-crown-outline" class="opacity-30" size="32"></v-icon>
            </div>
            <p class="text-caption font-weight-bold text-uppercase tracking-[0.4em] opacity-60 mb-4">Liquid Portfolio Value</p>
            <div class="d-flex align-baseline gap-4 mb-4">
              <span class="text-h4 font-weight-bold opacity-30">₹</span>
              <span class="text-[72px] font-weight-black tracking-tighter italic ma-0 leading-none">₹{{ (authStore.user?.credits || 0).toLocaleString() }}</span>
            </div>
            <v-sparkline
              :model-value="sparkValue"
              color="white"
              line-width="3"
              padding="16"
              smooth
              class="opacity-20 mt-8"
              height="40"
            ></v-sparkline>
          </div>

          <v-btn 
            to="/wallet" 
            variant="flat" 
            block 
            color="white"
            class="mt-12 rounded-2xl text-primary font-weight-black py-10 shadow-xl hover-lift"
          >
            <div class="d-flex justify-space-between align-center w-100 px-4">
              <div class="text-left">
                <p class="text-[10px] font-weight-black opacity-50 uppercase tracking-widest leading-none mb-1.5">Escrow Reserved</p>
                <p class="text-h4 font-weight-black italic ma-0">₹{{ (authStore.user?.heldCredits || 0).toLocaleString() }}</p>
              </div>
              <v-avatar color="primary" size="44" class="rounded-xl shadow-md group-hover:rotate-12 transition-transform">
                <v-icon icon="mdi-arrow-right" size="24"></v-icon>
              </v-avatar>
            </div>
          </v-btn>
        </v-card>
      </v-col>

      <!-- Intelligence Metrics Grid -->
      <v-col cols="12" lg="8">
        <v-row>
          <!-- Active Market Positions -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="rounded-3xl pa-12 border-subtle fill-height group hover-border-primary transition-all duration-700 bg-surface shadow-sm relative overflow-hidden">
               <div class="position-absolute top-0 right-0 ma-8 opacity-5">
                 <v-icon icon="mdi-trending-up" size="120"></v-icon>
               </div>
              <div class="d-flex justify-space-between align-start mb-10 relative z-10">
                <p class="text-overline font-weight-black text-muted-custom tracking-[0.4em] uppercase">Active Positions</p>
                <v-avatar color="primary" variant="tonal" rounded="xl" size="56" class="shadow-sm">
                  <v-icon icon="mdi-chart-line" size="28"></v-icon>
                </v-avatar>
              </div>
              <h2 class="text-[84px] font-weight-black tracking-tighter italic leading-none mb-12 group-hover:text-primary transition-colors tabular-nums relative z-10">{{ activeBidsCount.toString().padStart(2, '0') }}</h2>
              
              <div class="d-flex align-center gap-4 relative z-10">
                <div class="d-flex">
                  <v-avatar 
                    v-for="i in Math.min(activeBidsCount, 4)" 
                    :key="i"
                    color="grey-lighten-4"
                    size="64"
                    class="ml-n6 border-4 border-surface shadow-premium hover-scale-110 transition-all first:ml-0"
                  >
                    <v-icon color="primary" size="28">mdi-eye-check-outline</v-icon>
                  </v-avatar>
                  <v-avatar 
                    v-if="activeBidsCount > 4"
                    color="primary"
                    size="64"
                    class="ml-n6 border-4 border-surface text-caption font-weight-black shadow-premium"
                  >
                    +{{ activeBidsCount - 4 }}
                  </v-avatar>
                </div>
                <div v-if="activeBidsCount === 0" class="text-[10px] font-weight-black text-muted-custom opacity-30 uppercase tracking-[0.3em]">No Active Tenders</div>
              </div>
            </v-card>
          </v-col>

          <!-- Asset Capture History -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="rounded-3xl pa-12 border-subtle fill-height group hover-border-success transition-all duration-700 bg-surface shadow-sm relative overflow-hidden">
              <div class="position-absolute top-0 right-0 ma-8 opacity-5">
                 <v-icon icon="mdi-trophy-variant" size="120"></v-icon>
               </div>
              <div class="d-flex justify-space-between align-start mb-10 relative z-10">
                <p class="text-overline font-weight-black text-muted-custom tracking-[0.4em] uppercase">Assets Captured</p>
                <v-avatar color="success" variant="tonal" rounded="xl" size="56" class="shadow-sm">
                  <v-icon icon="mdi-crown-outline" size="28"></v-icon>
                </v-avatar>
              </div>
              <h2 class="text-[84px] font-weight-black tracking-tighter italic leading-none mb-12 group-hover:text-success transition-colors tabular-nums relative z-10">{{ itemsWonCount.toString().padStart(2, '0') }}</h2>
              
              <div class="relative z-10">
                <v-chip color="success" variant="flat" rounded="pill" prepend-icon="mdi-shield-airplane" class="font-weight-black text-[10px] tracking-widest px-8 shadow-md py-5">
                  INSTITUTIONAL YIELD ACTIVE
                </v-chip>
              </div>
            </v-card>
          </v-col>

          <!-- Governance & Verification Portal -->
          <v-col cols="12">
            <v-card variant="flat" border class="rounded-3xl pa-12 border-dashed border-primary border-opacity-30 bg-blue-lighten-5 position-relative overflow-hidden shadow-sm">
              <div class="position-absolute top-n10 right-n10 w-96 h-96 bg-primary opacity-10 rounded-circle blur-3xl"></div>
              <v-row align="center" class="position-relative z-10">
                <v-col cols="12" md="auto">
                  <v-avatar color="primary" size="120" variant="tonal" class="rounded-3xl shadow-2xl border-4 border-white-opacity-20 rotate-n3">
                    <v-icon icon="mdi-shield-key-outline" size="56"></v-icon>
                  </v-avatar>
                </v-col>
                <v-col class="text-left py-4 sm:pl-10">
                  <h3 class="text-h3 font-weight-black italic tracking-tighter mb-4">Elite <span class="text-primary not-italic">Identity</span> Verification</h3>
                  <p class="text-body-1 font-weight-medium text-muted-custom max-w-3xl leading-relaxed">
                    Elevate your participant status to access Private Repossessions and Government Tenders. Verification unlocks high-stakes market sectors and institutional asset classes through the BWC Sovereignty protocol.
                  </p>
                  
                  <div v-if="!authStore.user?.isVerified" class="d-flex flex-wrap gap-6 mt-12">
                    <v-text-field
                      v-model="verifyCode"
                      placeholder="PAN / GST / VAT IDENTIFIER"
                      variant="outlined"
                      rounded="xl"
                      density="comfortable"
                      hide-details
                      class="max-w-md font-weight-black text-h5 bg-surface shadow-inner-sm"
                    ></v-text-field>
                    <v-btn 
                      @click="verifyAccount" 
                      :loading="verifying"
                      color="primary" 
                      height="64"
                      rounded="pill"
                      class="px-12 font-weight-black text-caption tracking-[0.3em] shadow-xl"
                      elevation="12"
                      prepend-icon="mdi-lightning-bolt"
                    >
                      EXECUTE VERIFICATION
                    </v-btn>
                  </div>
                  <v-chip v-else color="success" variant="flat" size="x-large" rounded="pill" prepend-icon="mdi-check-decagram" class="mt-10 font-weight-black px-12 shadow-lg tracking-[0.3em] h-56">
                    ELITE STATUS DEPLOYED • MARKET TIERS UNLOCKED
                  </v-chip>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Market Activity Ledger Matrix -->
    <v-card variant="outlined" class="rounded-3xl border-subtle overflow-hidden shadow-premium bg-surface">
      <v-card-title class="px-12 py-12 border-b border-subtle d-flex flex-column sm:flex-row justify-space-between align-start align-sm-center gap-6 bg-grey-lighten-5">
        <div class="text-left">
          <h3 class="text-h3 font-weight-black italic ma-0">Market <span class="text-primary not-italic">Activity</span> Ledger</h3>
          <p class="text-[10px] font-weight-bold text-muted-custom uppercase tracking-[0.4em] mt-1">Real-time surveillance of bidding floor positions</p>
        </div>
        <v-btn to="/wallet" variant="outlined" color="primary" class="font-weight-black text-[10px] tracking-widest px-10 rounded-pill h-48" prepend-icon="mdi-file-eye-outline">
          HISTORICAL AUDIT
        </v-btn>
      </v-card-title>
      
      <v-table class="dashboard-table-matrix">
        <thead>
          <tr class="bg-grey-lighten-4">
            <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.3em]">ASSET INTEL</th>
            <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.3em]">CAPITAL INTENT</th>
            <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.3em]">STATUS RANK</th>
            <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.3em] text-right">PROTOCOL TIMESTAMP</th>
          </tr>
        </thead>
        <tbody v-if="biddingHistory.length > 0">
          <tr v-for="item in biddingHistory" :key="item.id" class="hover-row transition-all duration-300">
            <td class="px-12 py-12">
              <div class="d-flex align-center gap-8">
                <v-avatar size="80" rounded="2xl" class="border-subtle shadow-lg overflow-hidden relative group">
                  <v-img :src="item.image" cover class="group-hover:scale-110 transition-transform duration-700"></v-img>
                  <div class="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity"></div>
                </v-avatar>
                <div class="text-left">
                  <span class="d-block text-h5 font-weight-black tracking-tight mb-1.5 italic">{{ item.item }}</span>
                  <div class="d-flex align-center gap-2">
                    <v-chip size="x-small" color="primary" variant="tonal" class="rounded-lg font-weight-black text-[9px] px-3 tracking-widest uppercase">Audited Listing</v-chip>
                    <span class="text-[9px] font-mono opacity-30 text-uppercase tracking-widest">ID-{{ item.id.slice(0,8).toUpperCase() }}</span>
                  </div>
                </div>
              </div>
            </td>
            <td class="px-12 py-12">
              <span class="text-h3 font-weight-black italic text-primary tracking-tighter tabular-nums">₹{{ item.amount }}</span>
            </td>
            <td class="px-12 py-12">
              <v-chip color="success" variant="flat" size="small" rounded="pill" class="font-weight-black text-[10px] tracking-[0.25em] px-8 shadow-md uppercase">
                <v-badge dot color="white" inline class="pulse-badge mr-2 ma-0"></v-badge>
                Current Leader
              </v-chip>
            </td>
            <td class="px-12 py-12 text-right">
              <div class="d-flex flex-column align-end">
                <span class="text-caption font-weight-black text-muted-custom uppercase tracking-widest">{{ item.date.split(' • ')[0] }}</span>
                <span class="text-[9px] font-weight-bold text-primary uppercase tracking-[0.4em] mt-1">{{ item.date.split(' • ')[1] }}</span>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="4" class="pa-32 text-center text-muted-custom opacity-30 font-weight-black text-overline tracking-[0.6em]">
              NO ACTIVE MARKET TENDERS DETECTED IN CURRENT CYCLE
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import { useNotification } from '../services/notification'

const authStore = useAuthStore()
const notification = useNotification()
const rawAuctions = ref([])
const loading = ref(true)
const verifying = ref(false)
const verifyCode = ref('')
const sparkValue = [0, 2, 5, 9, 5, 10, 3, 5, 0, 10, 25, 15, 20, 30]

const fetchDashboardData = async () => {
  try {
    const res = await api.get('/api/auctions')
    rawAuctions.value = res.data
  } catch (err) {
    console.error("Critical: Dashboard Link Terminated", err)
  } finally {
    loading.value = false
  }
}

const verifyAccount = async () => {
  if (!verifyCode.value) return notification.add("Identity signal required for verification", "error")
  verifying.value = true
  
  setTimeout(async () => {
    try {
      authStore.user.isVerified = true
      notification.add("Identity Authenticated! Elite marketplace tiers initialised.", "success")
      verifyCode.value = ''
      await authStore.init() // Sync state
    } finally {
      verifying.value = false
    }
  }, 2200)
}

// Compute real-time participation
const biddingHistory = computed(() => {
  const currentUid = authStore.user?.uid
  if (!currentUid) return []

  return rawAuctions.value
    .filter(a => a.highestBidder === currentUid)
    .map(a => ({
      id: a.id,
      item: a.title,
      amount: a.highestBid.toLocaleString(),
      status: 'Current Leader',
      date: new Date(a.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' • PROXY ACTIVE',
      image: a.imageUrl || 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?auto=format&fit=crop&q=80&w=1000'
    }))
})

const activeBidsCount = computed(() => biddingHistory.value.length)
const itemsWonCount = computed(() => authStore.user?.totalWins || 0)

onMounted(fetchDashboardData)
</script>

<style scoped>
.italic { font-style: italic !important; }
.not-italic { font-style: normal !important; }

.shadow-premium {
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.2), 0 18px 36px -18px rgba(0, 0, 0, 0.3) !important;
}

.pulse-badge {
  animation: pulse-market 2s infinite;
}

@keyframes pulse-market {
  0% { transform: scale(0.9); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.5; }
  100% { transform: scale(0.9); opacity: 1; }
}

.dashboard-table-matrix :deep(th) {
  height: auto !important;
  background-color: var(--bg-surface) !important;
}

.hover-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.04) !important;
  transform: scale(1.002);
}

.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
}

.shadow-inner-sm {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

.z-10 { z-index: 10; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }

.tabular-nums {
  font-variant-numeric: tabular-nums;
}

.rotate-3 {
  transform: rotate(3deg);
}
.rotate-n3 {
  transform: rotate(-3deg);
}

.hover-scale-110:hover {
  transform: scale(1.1);
  z-index: 50;
}
</style>
