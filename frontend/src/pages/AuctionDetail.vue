<template>
  <v-container v-if="auction" class="py-12 px-6 animate-fade" max-width="1440">
    <!-- Breadcrumb Protocol -->
    <div class="mb-10 d-flex align-center gap-4">
      <router-link to="/auctions" class="text-caption font-weight-black text-primary text-decoration-none group d-flex align-center gap-2 tracking-[0.3em] hover:opacity-100 opacity-60 transition-opacity uppercase">
        <v-icon icon="mdi-arrow-left" size="16" class="group-hover:translate-x-n1 transition-transform"></v-icon>
        Circuit Exit
      </router-link>
      <div class="h-4 w-4 bg-border-subtle rounded-circle"></div>
      <span class="text-caption font-weight-black text-muted-custom tracking-[0.3em] uppercase opacity-40">Asset Archive: {{ auction.id.slice(0, 12) }}</span>
    </div>

    <v-row class="bg-base" align="start">
      <!-- High-End Media Gallery & Intelligence -->
      <v-col cols="12" lg="7">
        <div class="sticky-top-v">
          <v-card 
            elevation="24" 
            class="rounded-3xl overflow-hidden position-relative group mb-10 border-subtle shadow-premium"
            style="aspect-ratio: 16/10; height: auto;"
          >
            <v-img
              :src="auction.imageUrl || placeholderImage"
              cover
              class="fill-height transition-all duration-1000 group-hover:scale-105"
            >
              <!-- Scanner Animation Overlay -->
              <div class="absolute inset-x-0 h-px bg-white opacity-20 scanner-line z-20"></div>

              <!-- HUD Gradient Strategy -->
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-transparent to-transparent"></div>
              
              <!-- Content Stack -->
              <div class="fill-height d-flex flex-column justify-end pa-12 text-white position-relative z-10">
                <div class="d-flex align-center gap-4 mb-6">
                  <v-chip color="success" size="small" variant="flat" class="font-weight-black text-[10px] tracking-[0.4em] px-4 shadow-lg py-5">
                    <v-badge dot color="white" inline class="pulse-badge mr-3 ma-0"></v-badge>
                    LIVE TENDER
                  </v-chip>
                  <v-chip color="white" variant="outlined" size="small" class="font-weight-black text-[10px] tracking-[0.4em] px-4 border-white-opacity-30 backdrop-blur-md">
                    {{ auction.category.toUpperCase() }} CIRCUIT
                  </v-chip>
                </div>
                <h1 class="text-[64px] font-weight-black tracking-tighter italic ma-0 leading-[0.9] group-hover:translate-x-2 transition-transform duration-700">{{ auction.title }}</h1>
                <p class="text-h5 font-weight-medium opacity-60 mt-6 max-w-xl line-clamp-2 leading-relaxed italic">{{ auction.description }}</p>
              </div>
            </v-img>
          </v-card>
          
          <!-- Live Market Pulse Intelligence -->
          <v-row dense class="mb-10">
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="rounded-2xl pa-8 bg-surface border-subtle h-100 d-flex align-center gap-8 group hover-border-primary transition-all">
                 <v-avatar color="primary" variant="tonal" rounded="xl" size="64" class="shadow-sm border-subtle">
                   <v-icon icon="mdi-account-group-outline" size="28"></v-icon>
                 </v-avatar>
                 <div class="text-left">
                   <p class="text-[10px] font-weight-black text-muted-custom tracking-[0.4em] uppercase mb-1 opacity-60">Participant Density</p>
                   <div class="d-flex align-center gap-4">
                     <span class="text-h3 font-weight-black italic tabular-nums leading-none">24+</span>
                     <span class="text-caption font-weight-black text-primary uppercase tracking-widest">Active Bidders</span>
                   </div>
                 </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="rounded-2xl pa-8 bg-surface border-subtle h-100 d-flex align-center gap-8 group hover-border-primary transition-all">
                 <v-avatar color="warning" variant="tonal" rounded="xl" size="64" class="shadow-sm border-subtle">
                   <v-icon icon="mdi-satellite-variant" size="28"></v-icon>
                 </v-avatar>
                 <div class="text-left">
                   <p class="text-[10px] font-weight-black text-muted-custom tracking-[0.4em] uppercase mb-1 opacity-60">Protocol Latency</p>
                   <div class="d-flex align-center gap-3">
                     <span class="text-h3 font-weight-black italic tabular-nums leading-none text-success">08ms</span>
                     <v-chip color="success" size="x-small" variant="flat" class="font-weight-black text-[8px] tracking-widest px-2">ULTRAFAST</v-chip>
                   </div>
                 </div>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-col>

      <!-- Institutional Bidding Architecture -->
      <v-col cols="12" lg="5">
        <div class="ps-lg-16">
          <!-- EMD Protocol Gateway -->
          <v-card 
            v-if="!isJoined" 
            elevation="24" 
            class="rounded-3xl pa-16 text-center border-primary border-opacity-10 bg-surface shadow-premium animate-zoom position-relative overflow-hidden"
          >
            <div class="position-absolute top-0 right-0 w-80 h-80 bg-primary opacity-5 rounded-circle blur-3xl translate-x-12 translate-y-n10"></div>
            
            <v-avatar color="primary" size="120" variant="tonal" class="mb-10 rounded-3xl shadow-xl border-4 border-white-opacity-10 rotate-3">
              <v-icon icon="mdi-shield-lock-outline" size="56"></v-icon>
            </v-avatar>
            
            <div class="mb-12 text-left">
              <p class="text-overline font-weight-black text-primary tracking-[0.5em] mb-3 uppercase">Identity Authorization</p>
              <h3 class="text-[52px] font-weight-black italic tracking-tighter mb-6 leading-none">Secure the <span class="text-primary not-italic">Floor</span></h3>
              <p class="text-body-1 font-weight-medium text-muted-custom leading-relaxed opacity-80">
                Participation in the 'Elite Indigo' sector requires a refundable Earnest Money Deposit (EMD). This protocol maintains high market commitment and safeguards participant integrity.
              </p>
            </div>
            
            <v-card variant="flat" border class="pa-10 rounded-2xl border-subtle bg-grey-lighten-5 mb-12 text-left d-flex justify-space-between align-center relative overflow-hidden">
              <div class="position-absolute right-0 bottom-0 opacity-5 scale-150 rotate-n12">
                <v-icon icon="mdi-bank-check" size="120"></v-icon>
              </div>
              <div class="relative z-10">
                <p class="text-[11px] font-weight-black text-muted-custom tracking-[0.3em] uppercase mb-2 opacity-60">Required EMD Threshold</p>
                <div class="d-flex align-baseline gap-3">
                   <span class="text-h4 font-weight-bold opacity-20">₹</span>
                   <span class="text-[56px] font-weight-black text-primary tracking-tighter italic ma-0 leading-none">{{ (auction.minBid * 0.1).toLocaleString() }}</span>
                </div>
              </div>
              <v-chip color="primary" variant="tonal" class="rounded-lg font-weight-black px-4 shadow-sm z-10">REFUNDABLE</v-chip>
            </v-card>

            <v-btn
              @click="joinAuction"
              :loading="joining"
              block
              height="80"
              color="primary"
              rounded="pill"
              class="font-weight-black text-caption tracking-[0.4em] shadow-xl"
              elevation="12"
              prepend-icon="mdi-orbit-variant"
            >
              AUTHORIZE PROTOCOL
            </v-btn>
            <p class="text-[10px] font-weight-bold text-muted-custom mt-10 opacity-40 tracking-[0.3em] uppercase">Secured by BWC Master Ledger • Auto-settlement active</p>
          </v-card>

          <!-- Active Market Execution Hub -->
          <v-card v-else elevation="24" class="rounded-3xl pa-12 overflow-hidden bg-surface border-subtle animate-fade shadow-premium">
            <div class="position-absolute top-0 right-0 w-96 h-96 bg-primary opacity-5 rounded-circle blur-3xl translate-x-12 translate-y-n12"></div>
            
            <!-- Valuation Matrix -->
            <div class="d-flex justify-space-between align-end mb-12 pb-12 border-b border-subtle position-relative z-10">
              <div class="text-left">
                <p class="text-overline font-weight-black text-success tracking-[0.4em] uppercase mb-4">Live Circuit Pulse</p>
                <div class="d-flex align-center gap-6 transition-all duration-300" :class="{ 'scale-105 transform origin-left': showPriceFlash }">
                  <div class="d-flex align-baseline gap-4">
                    <span class="text-h3 font-weight-bold opacity-30 text-success">₹</span>
                    <span class="text-[84px] font-weight-black tracking-tighter italic ma-0 leading-none tabular-nums" :class="{ 'text-primary': showPriceFlash }">{{ highestBid.toLocaleString() }}</span>
                  </div>
                  <v-chip color="success" size="small" variant="flat" class="market-pulse px-4 font-weight-black ma-0 shadow-lg py-5 border border-white-opacity-20">
                    +₹{{ lastIncrement || 1000 }}
                  </v-chip>
                </div>
                
                <v-fade-transition>
                  <div v-if="lastBidStatus" class="d-flex align-center gap-3 mt-8 text-success">
                    <v-avatar color="success" size="24" variant="tonal" class="rounded-lg">
                      <v-icon icon="mdi-check-decagram" size="14"></v-icon>
                    </v-avatar>
                    <span class="text-caption font-weight-black uppercase tracking-[0.2em] italic">{{ lastBidStatus }}</span>
                  </div>
                </v-fade-transition>
              </div>
              
              <div class="text-right d-none sm:block">
                <p class="text-[10px] font-weight-black text-muted-custom tracking-[0.3em] uppercase mb-3 opacity-40">Reserve Floor</p>
                <p class="text-h4 font-weight-black text-muted-custom opacity-30 italic tabular-nums">₹{{ auction.minBid.toLocaleString() }}</p>
              </div>
            </div>

            <!-- Escalation Deck Infrastructure -->
            <div class="space-y-10 position-relative z-10">
              <div class="px-2">
                <p class="text-[11px] font-weight-black text-primary tracking-[0.5em] uppercase text-center mb-10">Market Escalation Matrix</p>
                
                <!-- Quick Injection Grid -->
                <v-row dense class="mb-12 g-4">
                  <v-col v-for="inc in [1000, 5000, 10000, 25000, 50000, 100000]" :key="inc" cols="4">
                    <v-btn
                      block
                      variant="outlined"
                      class="rounded-2xl font-weight-black text-[12px] bg-grey-lighten-5 border-subtle hover-border-primary transition-all py-8 h-auto tabular-nums shadow-inner-sm hover:bg-white"
                      @click="placeBid(highestBid + inc)"
                      :disabled="processingBid"
                    >
                      +₹{{ inc >= 1000 ? (inc/1000) + 'K' : inc }}
                    </v-btn>
                  </v-col>
                </v-row>

                <!-- Strategic Offer Architecture -->
                <div class="d-flex flex-column gap-6 mb-16">
                  <div class="text-left mb-n4 pl-4 z-20">
                    <span class="text-[9px] font-weight-black text-primary bg-surface px-2 tracking-widest uppercase">Custom Magnitude Offer</span>
                  </div>
                  <div class="d-flex flex-column sm:flex-row gap-6">
                    <v-text-field
                      v-model.number="customBidAmount"
                      :placeholder="'BLOCK: ₹' + suggestedBid.toLocaleString()"
                      variant="outlined"
                      rounded="xl"
                      hide-details
                      prefix="₹"
                      class="flex-grow-1 font-weight-black text-h4 italic tabular-nums bg-grey-lighten-5 shadow-inner-sm border-none"
                      type="number"
                      @keyup.enter="placeBid(customBidAmount)"
                    ></v-text-field>
                    <v-btn
                      @click="placeBid(customBidAmount)"
                      :disabled="processingBid || !customBidAmount || customBidAmount < suggestedBid"
                      color="primary"
                      height="74"
                      rounded="pill"
                      class="px-12 font-weight-black text-caption tracking-[0.3em] shadow-xl"
                      prepend-icon="mdi-cube-send"
                      elevation="12"
                    >
                      COMMIT OFFER
                    </v-btn>
                  </div>
                </div>
              </div>

              <!-- Settlement Audit Preview -->
              <v-card variant="flat" border class="rounded-2xl pa-10 border-subtle bg-blue-lighten-5 relative overflow-hidden">
                <div class="position-absolute top-0 right-0 ma-4 opacity-5">
                   <v-icon icon="mdi-file-eye-outline" size="64"></v-icon>
                </div>
                <div class="space-y-5">
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-caption font-weight-black text-muted-custom tracking-widest uppercase">Magnitude of Settlement</span>
                    <span class="text-h6 font-weight-black italic tabular-nums">₹{{ activeBidAmount.toLocaleString() }}</span>
                  </div>
                  <div class="d-flex justify-space-between align-center text-primary">
                    <span class="text-[11px] font-weight-black tracking-widest uppercase opacity-60">Protocol Landing Fee (5%)</span>
                    <span class="text-[11px] font-weight-black tabular-nums">₹{{ (activeBidAmount * 0.05).toLocaleString() }}</span>
                  </div>
                  <div class="pt-6 border-t border-subtle border-opacity-30 d-flex justify-space-between align-center">
                    <p class="text-subtitle-1 font-weight-black tracking-widest uppercase ma-0">Audit Finalization</p>
                    <p class="text-h3 font-weight-black text-primary italic ma-0 tabular-nums">₹{{ (activeBidAmount * 1.05).toLocaleString() }}</p>
                  </div>
                </div>
              </v-card>

              <!-- Proxy Intelligence Protocol -->
              <v-card variant="outlined" class="rounded-2xl pa-8 border-dashed border-primary border-opacity-30 d-flex flex-column sm:flex-row align-center gap-10 bg-surface group hover-border-primary transition-all">
                <v-avatar color="primary" variant="tonal" rounded="xl" size="64" class="shadow-sm border-subtle group-hover:rotate-12 transition-transform">
                  <v-icon icon="mdi-robot-vacuum-variant" size="32"></v-icon>
                </v-avatar>
                <div class="flex-grow-1 text-left">
                  <p class="text-overline font-weight-black text-primary mb-1 tracking-[0.25em] leading-none uppercase">Proxy Auto-Pilot</p>
                  <p class="text-[10px] font-weight-bold text-muted-custom leading-none uppercase tracking-widest opacity-60">Autonomous ceiling execution protocol</p>
                </div>
                <div class="d-flex align-center gap-4 w-100 w-sm-auto">
                  <v-text-field
                    v-model.number="proxyCeiling"
                    variant="outlined"
                    density="comfortable"
                    rounded="xl"
                    hide-details
                    placeholder="CEILING MAGNITUDE"
                    class="font-weight-black bg-grey-lighten-5 tabular-nums"
                    prefix="₹"
                    style="width: 200px;"
                  ></v-text-field>
                  <v-btn icon="mdi-target-variant" variant="flat" color="primary" rounded="xl" @click="setProxy" size="large" class="shadow-xl"></v-btn>
                </div>
              </v-card>
            </div>
          </v-card>

          <!-- Critical Security Metadata Deck -->
          <v-row class="mt-12">
            <v-col cols="6">
              <v-card variant="outlined" class="rounded-3xl pa-12 border-subtle fill-height d-flex flex-column justify-center align-center text-center group hover-border-error transition-all duration-700 bg-surface shadow-sm">
                <p class="text-overline font-weight-black text-muted-custom tracking-[0.4em] mb-6 uppercase opacity-60">Market Survival</p>
                <p class="text-[64px] font-weight-black text-error tracking-tighter italic ma-0 leading-none group-hover:scale-105 transition-transform duration-700 tabular-nums">{{ timeLeft }}</p>
                <div class="mt-8">
                  <v-chip v-if="isExtended" color="success" size="small" variant="flat" class="animate-pulse font-weight-black px-6 shadow-md tracking-widest">SOFT CLOSE ACTIVE</v-chip>
                  <v-chip v-else color="grey-lighten-4" size="small" variant="flat" class="font-weight-black px-6 tracking-widest opacity-40">STABLE CLOCK</v-chip>
                </div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card 
                variant="outlined" 
                class="rounded-3xl pa-12 border-subtle fill-height d-flex flex-column justify-center align-center text-center cursor-pointer group hover-border-primary transition-all duration-700 bg-surface shadow-sm"
                @click="downloadCatalog"
              >
                <p class="text-overline font-weight-black text-muted-custom tracking-[0.4em] mb-8 uppercase opacity-60">Archive Vault</p>
                <v-avatar color="primary" variant="tonal" size="80" class="rounded-3xl group-hover:rotate-12 transition-transform duration-700 shadow-lg border-subtle">
                  <v-icon icon="mdi-file-certificate-outline" size="40"></v-icon>
                </v-avatar>
                <p class="text-caption font-weight-black text-uppercase mt-10 tracking-[0.3em] text-primary">Technical Passport</p>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>
  </v-container>

  <v-container v-else class="fill-height d-flex flex-column align-center justify-center animate-fade">
    <div class="relative">
      <v-progress-circular indeterminate color="primary" size="120" width="10" class="shadow-premium rounded-circle"></v-progress-circular>
      <div class="absolute inset-0 flex items-center justify-center">
        <v-icon icon="mdi-orbit" color="primary" size="48" class="protocol-spin"></v-icon>
      </div>
    </div>
    <p class="text-overline font-weight-black mt-16 tracking-[0.6em] opacity-30 animate-pulse">Synchronizing Bidding Floor Context...</p>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
const lastIncrement = ref(0)
const userId = computed(() => authStore.user?.uid || "anonymous")
const isJoined = ref(false)
const joining = ref(false)
const timeLeft = ref("00:00:00")
const isExtended = ref(false)
const proxyCeiling = ref(0)
const processingBid = ref(false)
const showPriceFlash = ref(false)
const lastBidStatus = ref('')
const customBidAmount = ref(null)
const placeholderImage = 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2070&auto=format&fit=crop'

const activeBidAmount = computed(() => {
  const currentSuggested = suggestedBid.value
  if (customBidAmount.value && customBidAmount.value >= currentSuggested) {
    return customBidAmount.value
  }
  return currentSuggested
})

const suggestedBid = computed(() => (highestBid.value || (auction.value ? auction.value.minBid : 0)) + 1000)

const setProxy = () => {
  if (proxyCeiling.value <= highestBid.value) return notification.add("Ceiling must exceed current valuation protocol", "error")
  socket.emit("setProxyBid", {
    auctionId: route.params.id,
    userId: userId.value,
    ceiling: proxyCeiling.value
  })
  notification.add(`Proxy Auto-Pilot Engaged: ₹${proxyCeiling.value.toLocaleString()}`, "success")
}

const downloadCatalog = () => {
  notification.add("Decrypting Asset Technical Passport... Transferring Intelligence.", "info")
}

const updateTimer = () => {
  if (!auction.value || !auction.value.endTime) return
  const end = new Date(auction.value.endTime).getTime()
  const now = Date.now()
  const diff = end - now

  if (diff <= 0) {
    timeLeft.value = "CLOSED"
    return
  }

  const h = Math.floor(diff / 3600000).toString().padStart(2, '0')
  const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0')
  const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')
  timeLeft.value = `${h}:${m}:${s}`
}

let timerInterval;

const joinAuction = async () => {
  const emd = (auction.value?.minBid || 0) * 0.1
  if (authStore.user?.credits < emd) {
    return notification.add(`Liquidity insufficient for EMD Authorization. Required: ₹${emd.toLocaleString()}.`, "error")
  }
  
  joining.value = true
  // Protocol Simulation
  setTimeout(() => {
    isJoined.value = true
    joining.value = false
    notification.add("Identity Verified • Elite Indigo Access Authorized", "success")
  }, 1800)
}

const fetchAuction = async () => {
  try {
    const res = await api.get('/api/auctions')
    const found = res.data.find(a => String(a.id) === String(route.params.id))
    
    if (found) {
      auction.value = found
      if (!auction.value.endTime) auction.value.endTime = new Date(Date.now() + 3600000).toISOString()
      highestBid.value = found.highestBid
    } else {
      throw new Error('404 Entity Not Found')
    }
  } catch (err) {
    // Premium Mock for UX stability
    const mockData = {
      '1': { id: '1', title: 'Vintage Rolex Submariner', description: 'Rare 1970s model in pristine condition. Certified authentic pre-owned masterpiece with complete documentation and original mahogany presentation case.', minBid: 450000, highestBid: 520000, category: 'Watches', imageUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?auto=format&fit=crop&q=80&w=1000', endTime: new Date(Date.now() + 5000000).toISOString() }
    }
    auction.value = mockData[route.params.id] || mockData['1']
    highestBid.value = auction.value.highestBid
  }
}

const placeBid = (amount) => {
  if (authStore.user && authStore.user.credits < amount && !String(route.params.id).match(/^[1-4]$/)) {
     notification.add("Capital Reservation Error: Insufficient BWC Liquid Pool", "error");
     return;
  }
  processingBid.value = true
  lastIncrement.value = amount - highestBid.value
  
  socket.emit("placeBid", {
    auctionId: route.params.id,
    userId: userId.value,
    amount: amount
  })
  
  setTimeout(() => { 
    processingBid.value = false 
    customBidAmount.value = null
  }, 1000)
}

onMounted(async () => {
  await fetchAuction()
  timerInterval = setInterval(updateTimer, 1000)
  
  socket.on("bidUpdate", (data) => {
    if (String(data.auctionId) === String(route.params.id)) {
      highestBid.value = parseFloat(data.amount)
      showPriceFlash.value = true
      lastBidStatus.value = `Protocol Acceptance: ₹${highestBid.value.toLocaleString()}`
      setTimeout(() => { 
        showPriceFlash.value = false 
        lastBidStatus.value = ''
      }, 4000)
    }
  })
  
  socket.on("timerExtension", (data) => {
    if (String(data.auctionId) === String(route.params.id)) {
      auction.value.endTime = data.newEndTime
      isExtended.value = true
      notification.add("Market Soft-Close Triggered: Timer Synchronized", "info")
    }
  })
})

onUnmounted(() => {
  socket.off("bidUpdate")
  socket.off("timerExtension")
  clearInterval(timerInterval)
})
</script>

<style scoped>
.sticky-top-v {
  position: sticky;
  top: 140px;
}

.shadow-premium {
  box-shadow: 0 40px 80px -12px rgba(0, 0, 0, 0.25), 0 20px 40px -20px rgba(0, 0, 0, 0.3) !important;
}

.pulse-badge {
  animation: pulse-white 2.5s infinite;
}

@keyframes pulse-white {
  0% { transform: scale(0.9); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.5; }
  100% { transform: scale(0.9); opacity: 1; }
}

.scanner-line {
  top: 0;
  animation: scan 4s linear infinite;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
}

@keyframes scan {
  0% { top: 0; opacity: 0; }
  10% { opacity: 0.5; }
  90% { opacity: 0.5; }
  100% { top: 100%; opacity: 0; }
}

.animate-zoom {
  animation: zoomIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.98) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.market-pulse {
  animation: marketPulse 2s infinite ease-in-out;
}

@keyframes marketPulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0.4); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(var(--v-theme-success), 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0); }
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}

.protocol-spin {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.hover-border-primary:hover {
  border-color: rgba(var(--v-theme-primary), 0.4) !important;
  background-color: rgba(var(--v-theme-primary), 0.02) !important;
}

.hover-border-error:hover {
  border-color: rgba(var(--v-theme-error), 0.4) !important;
  background-color: rgba(var(--v-theme-error), 0.02) !important;
}

.rotate-3 { transform: rotate(3deg); }
.rotate-n3 { transform: rotate(-3deg); }
.rotate-n12 { transform: rotate(-12deg); }

.z-10 { z-index: 10; }
.z-20 { z-index: 20; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2; /* Compatibility */
}
</style>
