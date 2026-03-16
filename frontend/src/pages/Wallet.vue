<template>
  <v-container class="py-12 px-6 animate-fade" max-width="1440">
    <!-- Header Architecture -->
    <div class="mb-16">
      <p class="text-overline font-weight-black text-primary tracking-[0.4em] mb-4 uppercase">Financial Infrastructure</p>
      <h1 class="text-h1 font-weight-black tracking-tighter italic ma-0 leading-none mb-4">
        Wealth <span class="text-primary not-italic">Ledger</span>
      </h1>
      <p class="text-h6 font-weight-medium text-muted-custom max-w-2xl leading-relaxed">
        Institutional grade audit trail of your marketplace liquidity. Monitor capital distribution and secure settlement protocols.
      </p>
    </div>

    <!-- Credit HUD Architecture -->
    <v-row class="mb-16">
      <!-- Liquid Buying Power -->
      <v-col cols="12" md="6">
        <v-card 
          elevation="24" 
          color="primary" 
          class="rounded-2xl pa-12 fill-height d-flex flex-column justify-space-between position-relative overflow-hidden group border-none shadow-premium"
          theme="dark"
        >
          <div class="position-absolute top-0 right-0 w-80 h-80 bg-white opacity-10 rounded-circle blur-3xl group-hover:scale-150 transition-transform duration-1000 translate-x-12 translate-y-n12"></div>
          
          <div class="relative z-10">
            <div class="d-flex align-center gap-4 mb-10">
              <v-avatar color="white" variant="tonal" border size="40" class="rounded-xl border-white-opacity-10">
                <v-icon icon="mdi-shield-check-outline" class="opacity-80" size="20"></v-icon>
              </v-avatar>
              <p class="text-overline font-weight-black tracking-[0.3em] opacity-60 ma-0 uppercase">Verified Liquid Capital</p>
            </div>
            
            <div class="d-flex align-baseline gap-4 mb-2">
              <span class="text-h4 font-weight-bold opacity-30">₹</span>
              <span class="text-[84px] font-weight-black tracking-tighter italic ma-0 leading-none">
                {{ (authStore.user?.credits || 0).toLocaleString() }}
              </span>
            </div>
            
            <div class="d-flex align-center gap-2 mt-4">
              <v-chip color="white" variant="flat" class="text-primary font-weight-black text-[10px] tracking-widest px-3">BWC MASTER LEDGER</v-chip>
              <span class="text-[10px] font-weight-bold opacity-40 uppercase tracking-widest pl-2">Session Secure</span>
            </div>
          </div>

          <div class="mt-12 pt-10 border-t border-white-opacity-10 relative z-10 d-flex justify-space-between align-center">
             <div>
               <p class="text-[9px] font-weight-black opacity-40 uppercase tracking-widest mb-1">Last Settlement</p>
               <p class="text-caption font-weight-bold italic opacity-80">{{ lastSettlementTime }}</p>
             </div>
             <v-icon icon="mdi-waveform" class="opacity-20" size="32"></v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- Escrow Reservation Monitor -->
      <v-col cols="12" md="6">
        <v-card 
          variant="outlined" 
          class="rounded-2xl pa-12 fill-height border-subtle d-flex flex-column justify-space-between hover-border-primary transition-all duration-500 bg-surface shadow-sm relative group"
        >
          <div class="position-absolute bottom-0 right-0 w-64 h-64 bg-secondary opacity-0 group-hover:opacity-5 rounded-circle blur-3xl transition-opacity duration-700"></div>
          
          <div class="relative z-10">
            <div class="d-flex align-center gap-4 mb-10">
              <v-avatar color="primary" variant="tonal" border size="40" class="rounded-xl border-subtle">
                <v-icon icon="mdi-lock-clock" class="text-primary opacity-80" size="20"></v-icon>
              </v-avatar>
              <p class="text-overline font-weight-black text-primary tracking-[0.3em] ma-0 uppercase">Locked in Escrow (EMD)</p>
            </div>
            
            <div class="d-flex align-baseline gap-4 mb-2">
              <span class="text-h4 font-weight-bold opacity-20">₹</span>
              <span class="text-[84px] font-weight-black tracking-tighter italic text-secondary-custom ma-0 leading-none">
                {{ (authStore.user?.heldCredits || 0).toLocaleString() }}
              </span>
            </div>
            
            <div class="d-flex align-center gap-2 mt-4">
              <v-chip color="secondary" variant="tonal" class="font-weight-black text-[10px] tracking-widest px-3 rounded-lg">FUNDS RESERVED</v-chip>
              <span class="text-[10px] font-weight-bold text-muted-custom opacity-40 uppercase tracking-widest pl-2">Automatic Liquidation Active</span>
            </div>
          </div>

          <div class="mt-12 pt-10 border-t border-subtle relative z-10">
             <div class="d-flex align-center gap-4">
               <v-progress-linear 
                 :model-value="escrowPercentage" 
                 color="primary" 
                 height="6" 
                 rounded="pill" 
                 class="flex-grow-1"
               ></v-progress-linear>
               <span class="text-caption font-weight-black text-primary">{{ escrowPercentage }}% Utilization</span>
             </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Capital Settlement Command Center -->
    <v-card variant="outlined" class="mb-20 pa-0 rounded-2xl bg-surface border-subtle overflow-hidden shadow-premium relative">
      <v-row no-gutters>
        <!-- Simulation HUD -->
        <v-col cols="12" lg="4" class="pa-12 bg-grey-lighten-5 border-r border-subtle relative overflow-hidden">
          <div class="position-absolute top-0 left-0 w-64 h-64 bg-primary opacity-5 rounded-circle blur-3xl translate-x-n10 translate-y-n10"></div>
          
          <div class="relative z-10">
            <h3 class="text-h4 font-weight-black italic tracking-tighter mb-6">Settlement <span class="text-primary">Magnitude</span></h3>
            <p class="text-body-2 font-weight-medium text-muted-custom mb-10 leading-relaxed">
              Select or specify the global capital injection magnitude. Settlements are processed via high-fidelity simulated clearing houses.
            </p>

            <v-row dense class="mb-10">
              <v-col v-for="amount in [5000, 25000, 100000, 500000]" :key="amount" cols="6" sm="3" lg="6">
                <v-btn
                  block
                  variant="outlined"
                  class="rounded-xl font-weight-black text-[10px] bg-white border-subtle transition-all h-48"
                  :class="{ 'border-primary bg-primary-lighten-5 text-primary scale-105 shadow-sm': topupAmount === amount }"
                  @click="topupAmount = amount"
                >
                  ₹{{ amount >= 1000 ? (amount/1000) + 'K' : amount }}
                </v-btn>
              </v-col>
            </v-row>

            <v-text-field
              v-model.number="topupAmount"
              placeholder="CUSTOM MAGNITUDE"
              variant="outlined"
              rounded="xl"
              prefix="₹"
              class="font-weight-black text-h5 bg-white shadow-inner-sm"
              type="number"
              hide-details
            ></v-text-field>
          </div>
        </v-col>

        <!-- Execution Protocol -->
        <v-col cols="12" lg="8" class="pa-12 d-flex flex-column justify-center text-left">
          <div class="mb-10">
            <p class="text-overline font-weight-black text-primary tracking-[0.2em] mb-2 uppercase">Execution Hub</p>
            <h3 class="text-h3 font-weight-black italic tracking-tighter mb-4">Protocol <span class="text-primary not-italic">Authorization</span></h3>
            <p class="text-body-1 font-weight-medium text-muted-custom leading-relaxed">
              By authorizing this settlement, you initiate the instant synchronization of digital assets from your external reserves to the BidWars Bidding Floor. This action is irreversible once committed to the ledger.
            </p>
          </div>

          <div class="d-flex flex-column sm:flex-row gap-6 align-center">
            <v-card variant="flat" border class="pa-6 rounded-2xl border-subtle bg-base flex-grow-1 w-100">
               <div class="d-flex justify-space-between align-center mb-1">
                 <span class="text-caption font-weight-black text-muted-custom uppercase">Est. Market Value</span>
                 <span class="text-caption font-weight-black">₹{{ (topupAmount || 0).toLocaleString() }}</span>
               </div>
               <div class="d-flex justify-space-between align-center text-primary">
                 <span class="text-[11px] font-weight-black uppercase tracking-widest">Protocol Fee (Simulated)</span>
                 <span class="text-[11px] font-weight-black">₹0.00</span>
               </div>
            </v-card>

            <v-btn 
              @click="simulateTopup" 
              :loading="topupLoading"
              color="primary"
              height="72"
              rounded="pill"
              class="px-12 font-weight-black text-caption tracking-[0.2em] shadow-xl w-100 w-sm-auto"
              elevation="12"
              prepend-icon="mdi-orbit-variant"
            >
              EXECUTE SETTLEMENT
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- Historical Ledger Intelligence -->
    <v-card variant="outlined" class="rounded-2xl border-subtle overflow-hidden shadow-premium bg-surface">
      <v-card-title class="px-12 py-12 border-b border-subtle d-flex flex-column sm:flex-row justify-space-between align-start align-sm-center gap-6 bg-grey-lighten-5">
        <div class="text-left">
          <h3 class="text-h4 font-weight-black italic ma-0">Market <span class="text-primary not-italic">Ledger</span> Matrix</h3>
          <p class="text-[10px] font-weight-bold text-muted-custom uppercase tracking-[0.3em] mt-1">Audit Trail of Institutional Logistics</p>
        </div>
        <div class="d-flex gap-4">
          <v-btn variant="outlined" color="primary" class="font-weight-black text-[10px] tracking-widest px-8 rounded-pill" height="44" @click="fetchHistory" prepend-icon="mdi-sync">
            REFRESH AUDIT
          </v-btn>
          <v-btn variant="tonal" color="primary" icon="mdi-download-outline" rounded="pill" size="44" class="shadow-sm"></v-btn>
        </div>
      </v-card-title>

      <div v-if="loading" class="pa-32 d-flex flex-column align-center justify-center gap-8 bg-surface">
        <v-progress-circular indeterminate color="primary" size="80" width="8"></v-progress-circular>
        <p class="text-overline font-weight-black tracking-[0.5em] text-muted-custom animate-pulse">Syncing Cryptographic Logs...</p>
      </div>

      <div v-else-if="history.length === 0" class="pa-32 text-center bg-surface animate-fade">
         <v-avatar color="primary" variant="tonal" size="120" class="rounded-2xl mb-10 shadow-lg">
           <v-icon icon="mdi-database-eye-off-outline" size="56"></v-icon>
         </v-avatar>
         <h3 class="text-h3 font-weight-black italic text-muted-custom ma-0">No dispatch records found</h3>
         <p class="text-h6 font-weight-medium text-muted-custom opacity-50 mt-4 max-w-lg mx-auto leading-relaxed">
           Your financial record is currently stagnant. Initiate a capital settlement or market position to populate the BWC ledger.
         </p>
      </div>

      <v-table v-else class="ledger-table-matrix">
        <thead>
          <tr class="bg-grey-lighten-4">
            <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.25em]">PROTOCOL CONTEXT</th>
            <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.25em]">MAGNITUDE</th>
            <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.25em] text-right">POST-SETTLEMENT</th>
            <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.25em] text-right">DISPATCH TIMESTAMP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in history" :key="tx.id" class="hover-row transition-all duration-300">
            <td class="px-12 py-12">
              <div class="d-flex align-center gap-8">
                <v-avatar 
                  size="56" 
                  rounded="xl"
                  :color="tx.amount > 0 ? 'success' : 'primary'"
                  variant="tonal"
                  class="shadow-sm border-subtle rotate-3 group-hover:rotate-0 transition-transform"
                >
                  <v-icon size="28">{{ tx.amount > 0 ? 'mdi-bank-plus' : 'mdi-bank-minus' }}</v-icon>
                </v-avatar>
                <div class="text-left">
                  <p class="text-h6 font-weight-black italic tracking-tight mb-0.5 leading-none">{{ formatType(tx.type) }}</p>
                  <p class="text-[9px] font-mono font-weight-bold text-muted-custom opacity-60 uppercase tracking-widest ma-0">BLOCK: {{ tx.id.slice(0,12).toUpperCase() }}</p>
                </div>
              </div>
            </td>
            <td class="px-12 py-12">
              <div class="d-flex align-center gap-4">
                <v-chip 
                  :color="tx.amount > 0 ? 'success' : 'primary'" 
                  variant="flat" 
                  size="small" 
                  class="font-weight-black tracking-widest text-[9px] rounded-lg shadow-sm"
                >
                  {{ tx.amount > 0 ? 'SETTLED' : 'RESERVED' }}
                </v-chip>
                <span :class="['text-h4 font-weight-black italic tabular-nums tracking-tighter ma-0', tx.amount > 0 ? 'text-success' : 'text-primary']">
                  {{ tx.amount > 0 ? '+' : '' }}₹{{ Math.abs(tx.amount).toLocaleString() }}
                </span>
              </div>
            </td>
            <td class="px-12 py-12 text-right">
               <span class="text-h5 font-weight-black italic tabular-nums text-secondary-custom">
                 <span class="opacity-20 font-weight-medium text-caption mr-2">INR</span>{{ tx.newBalance.toLocaleString() }}
               </span>
            </td>
            <td class="px-12 py-12 text-right">
               <div class="d-flex flex-column align-end">
                 <span class="text-caption font-weight-black text-primary tabular-nums uppercase tracking-widest">{{ formatProtocolTime(tx.createdAt, true) }}</span>
                 <span class="text-[9px] font-weight-bold text-muted-custom opacity-50 uppercase tracking-widest mt-1">{{ formatProtocolTime(tx.createdAt, false) }}</span>
               </div>
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

const notification = useNotification()
const authStore = useAuthStore()
const history = ref([])
const loading = ref(true)
const topupAmount = ref(25000)
const topupLoading = ref(false)

const escrowPercentage = computed(() => {
  const credits = authStore.user?.credits || 0
  const held = authStore.user?.heldCredits || 0
  if (credits === 0) return 0
  return Math.round((held / (credits + held)) * 100)
})

const lastSettlementTime = computed(() => {
  if (history.value.length === 0) return "NO RECENT ACTIVITY"
  const last = history.value[0]
  return formatProtocolTime(last.createdAt, true)
})

const simulateTopup = async () => {
  if (topupAmount.value <= 0) return notification.add('Invalid settlement magnitude protocol input', 'error')
  
  topupLoading.value = true
  try {
    await api.post('/api/wallet/topup', { amount: topupAmount.value })
    notification.add(`Capital Settlement of ₹${topupAmount.value.toLocaleString()} Synchronized`, 'success')
    topupAmount.value = 25000
    await fetchHistory()
    await authStore.init() // Force global capital sync
  } catch (err) {
    notification.add('Payment Protocol Termination: Handshake Failure', 'error')
  } finally {
    topupLoading.value = false
  }
}

const fetchHistory = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/wallet/history')
    history.value = res.data
  } catch (err) {
    console.error("Ledger audit failed", err)
    notification.add('Market Ledger Sync Terminated. Protocol Retry Active.', 'error')
  } finally {
    loading.value = false
  }
}

const formatProtocolTime = (ts, dateOnly = false) => {
  if (!ts) return "NULL"
  const date = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts)
  if (dateOnly) {
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
  }
  return date.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }).toUpperCase() + ' PROTOCOL'
}

const formatType = (type) => {
  if (!type) return "SYSTEM DISPATCH"
  return type.replace(/_/g, ' ').toUpperCase()
}

onMounted(fetchHistory)
</script>

<style scoped>
.italic { font-style: italic !important; }
.not-italic { font-style: normal !important; }

.shadow-premium {
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.15), 0 18px 36px -18px rgba(0, 0, 0, 0.2) !important;
}

.hover-border-primary:hover {
  border-color: rgba(var(--v-theme-primary), 0.4) !important;
  transform: translateY(-8px);
}

.ledger-table-matrix :deep(th) {
  height: auto !important;
  background-color: var(--bg-surface) !important;
}

.hover-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.04) !important;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}

.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
}

.shadow-inner-sm {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

.z-10 { z-index: 10; }

.animate-fade {
  animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.rotate-3 {
  transform: rotate(3deg);
}
</style>
