<template>
  <v-container class="py-12 px-6 animate-fade" max-width="1440">
    <!-- CommandCenter Hero Architecture -->
    <v-card 
      elevation="24" 
      class="rounded-3xl overflow-hidden mb-12 border-subtle relative bg-slate-900 text-white shadow-premium"
    >
      <div class="position-absolute inset-0 opacity-30 bg-gradient-to-tr from-indigo-900 via-slate-900 to-transparent"></div>
      <div class="position-absolute top-0 right-0 w-80 h-80 bg-primary opacity-20 rounded-circle blur-3xl translate-x-12 translate-y-n12"></div>
      <div class="position-absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-circle blur-3xl translate-x-n10 translate-y-10"></div>
      
      <v-row class="pa-12 sm:pa-16 relative z-10" align="center">
        <v-col cols="12" md="auto">
          <v-avatar size="120" color="primary" class="rounded-3xl shadow-2xl border-4 border-white-opacity-10 rotate-3 group-hover:rotate-0 transition-transform duration-700">
            <v-icon icon="mdi-shield-crown" size="56" color="white"></v-icon>
          </v-avatar>
        </v-col>
        
        <v-col class="text-left">
          <div class="d-flex align-center gap-4 mb-4">
            <v-chip color="primary" size="small" variant="flat" class="font-weight-black text-[10px] tracking-[0.3em] px-3">ROOT LEVEL</v-chip>
            <span class="text-[10px] font-weight-bold text-white opacity-40 uppercase tracking-widest">Protocol v4.0.2</span>
          </div>
          <h1 class="text-h1 font-weight-black tracking-tighter italic ma-0 leading-none">
            Admin <span class="text-primary not-italic">Command</span>
          </h1>
          <p class="text-h6 font-weight-medium opacity-60 mt-6 max-w-2xl leading-relaxed">
            Global market surveillance and asset deployment engine. Execute institutional-tier protocols and maintain the integrity of the 'Elite Indigo' digital circuit.
          </p>
        </v-col>

        <v-col cols="12" md="auto">
          <v-card variant="flat" border class="pa-8 rounded-2xl border-white-opacity-10 bg-white-opacity-5 backdrop-blur-md">
            <p class="text-[9px] font-weight-black text-primary tracking-[0.4em] uppercase mb-2">Global System Pulse</p>
            <div class="d-flex align-center gap-3">
              <v-badge dot color="success" inline class="pulse-badge ma-0"></v-badge>
              <span class="text-caption font-weight-black tracking-[0.2em] uppercase text-success">Core Operational</span>
            </div>
            <div class="mt-4 pt-4 border-t border-white-opacity-10 d-flex justify-space-between align-center">
               <span class="text-[10px] font-weight-bold opacity-40 text-uppercase tracking-widest">Latency</span>
               <span class="text-[10px] font-weight-black text-primary">12ms</span>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <!-- Navigation Hub Matrix -->
    <v-tabs
      v-model="tab"
      color="primary"
      align-tabs="center"
      class="mb-14 border-b border-subtle"
      height="80"
    >
      <v-tab value="deployment" class="font-weight-black text-[12px] tracking-[0.4em] px-16 group">
        <v-icon start icon="mdi-rocket-launch-outline" class="mr-4 group-hover:scale-110 transition-transform"></v-icon>
        DEPLOYMENT
      </v-tab>
      <v-tab value="market" class="font-weight-black text-[12px] tracking-[0.4em] px-16 group">
        <v-icon start icon="mdi-monitor-dashboard" class="mr-4 group-hover:scale-110 transition-transform"></v-icon>
        SURVEILLANCE
      </v-tab>
      <v-tab value="liquidity" class="font-weight-black text-[12px] tracking-[0.4em] px-16 group">
        <v-icon start icon="mdi-bank-transfer" class="mr-4 group-hover:scale-110 transition-transform"></v-icon>
        LOGISTICS
      </v-tab>
    </v-tabs>

    <v-window v-model="tab" class="overflow-visible">
      <!-- High-Fidelity Asset Deployment -->
      <v-window-item value="deployment">
        <v-row justify="center">
          <v-col cols="12" lg="10">
            <v-card variant="outlined" class="rounded-3xl pa-16 bg-surface border-subtle shadow-premium animate-zoom text-left relative overflow-hidden">
              <div class="position-absolute top-0 right-0 w-96 h-96 bg-primary opacity-5 rounded-circle blur-3xl translate-x-12 translate-y-n12"></div>
              
              <div class="mb-12 relative z-10">
                <div class="d-flex align-center gap-4 mb-4">
                  <v-avatar color="primary" variant="tonal" rounded="lg" size="48">
                    <v-icon icon="mdi-cube-plus" size="24"></v-icon>
                  </v-avatar>
                  <div>
                    <h3 class="text-h3 font-weight-black italic tracking-tighter ma-0 leading-none">Initialize <span class="text-primary not-italic">Asset Tender</span></h3>
                    <p class="text-caption font-weight-bold text-muted-custom uppercase tracking-widest mt-2">Submit high-stakes specifications to the market circuit</p>
                  </div>
                </div>
              </div>

              <v-form @submit.prevent="createAuction" class="space-y-10 relative z-10">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newAuction.title"
                      label="Asset Nomenclature"
                      variant="outlined"
                      rounded="xl"
                      class="font-weight-black text-h6"
                      placeholder="e.g. Vintage Rolex Submariner"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="newAuction.category"
                      :items="['Art', 'Watches', 'Vehicles', 'Electronics', 'Collectibles']"
                      label="Sector Classification"
                      variant="outlined"
                      rounded="xl"
                      class="font-weight-black"
                    ></v-select>
                  </v-col>
                  <v-col cols="12">
                    <div class="position-relative">
                      <v-textarea
                        v-model="newAuction.description"
                        label="Market Passport Intelligence"
                        variant="outlined"
                        rounded="xl"
                        rows="5"
                        class="font-weight-black"
                        placeholder="Comprehensive asset description for the audit floor..."
                      ></v-textarea>
                      <v-btn
                        @click="generateAIBid"
                        :loading="aiLoading"
                        color="primary"
                        variant="flat"
                        size="large"
                        class="position-absolute bottom-0 right-0 ma-6 shadow-xl rounded-xl h-48 px-8 font-weight-black text-[10px] tracking-widest"
                        prepend-icon="mdi-auto-fix"
                      >
                        AI SYMBOLISM
                      </v-btn>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model.number="newAuction.minBid"
                      label="Reserve Floor Protocol (INR)"
                      variant="outlined"
                      rounded="xl"
                      prepend-inner-icon="mdi-currency-inr"
                      type="number"
                      class="font-weight-black text-h4 italic tracking-tighter"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="newAuction.imageUrl"
                      label="Asset Matrix Identifier (URL)"
                      variant="outlined"
                      rounded="xl"
                      prepend-inner-icon="mdi-image-search-outline"
                      class="font-weight-black"
                      placeholder="https://visuals.bidwars.elite/asset_01.jpg"
                    ></v-text-field>
                  </v-col>
                </v-row>

                <div class="pt-12 border-t border-subtle d-flex justify-space-between align-center">
                  <div class="d-flex align-center gap-4 text-muted-custom opacity-60">
                    <v-icon icon="mdi-shield-check" size="20"></v-icon>
                    <span class="text-caption font-weight-black uppercase tracking-widest">Protocol Signed & Audited</span>
                  </div>
                  <v-btn
                    type="submit"
                    color="primary"
                    height="72"
                    rounded="pill"
                    class="px-16 font-weight-black text-caption tracking-[0.4em] shadow-xl"
                    elevation="12"
                    prepend-icon="mdi-orbit-variant"
                    :loading="submitting"
                  >
                    DEPLOY ASSET
                  </v-btn>
                </div>
              </v-form>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Institutional Market Surveillance -->
      <v-window-item value="market">
        <v-card variant="outlined" class="rounded-3xl border-subtle overflow-hidden shadow-premium bg-surface animate-fade">
          <v-table class="admin-table-matrix">
            <thead>
              <tr class="bg-grey-lighten-4">
                <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.3em]">ASSET INTEL</th>
                <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.3em]">VALUATION MATRIX</th>
                <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.3em]">CIRCUIT STATUS</th>
                <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.3em] text-right">PROTOCOL GESTURE</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in auctions" :key="a.id" class="hover-row transition-all duration-300">
                <td class="px-12 py-12">
                  <div class="d-flex align-center gap-8">
                    <v-avatar size="72" rounded="xl" class="border-subtle shadow-lg overflow-hidden relative group">
                      <v-img :src="a.imageUrl || placeholderImage" cover class="group-hover:scale-110 transition-transform duration-700"></v-img>
                      <div class="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    </v-avatar>
                    <div class="text-left">
                      <p class="text-h5 font-weight-black italic ma-0 tracking-tight">{{ a.title }}</p>
                      <p class="text-[9px] font-weight-black text-muted-custom tracking-widest uppercase mt-1">ID-{{ a.id.slice(0,10).toUpperCase() }} • {{ a.category.toUpperCase() }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-12 py-12">
                  <div class="text-left">
                    <p class="text-[9px] font-weight-bold text-muted-custom uppercase mb-2 tracking-widest opacity-60">High Valuation</p>
                    <span class="text-h4 font-weight-black italic text-primary tracking-tighter ma-0 tabular-nums">₹{{ (a.highestBid || a.minBid).toLocaleString() }}</span>
                  </div>
                </td>
                <td class="px-12 py-12">
                  <v-chip color="success" size="small" variant="flat" rounded="pill" class="font-weight-black px-6 shadow-sm tracking-[0.2em] uppercase">
                    <v-badge dot color="white" inline class="pulse-badge mr-2 ma-0"></v-badge>
                    Active Circuit
                  </v-chip>
                </td>
                <td class="px-12 py-12 text-right">
                  <div class="d-flex justify-end gap-4">
                    <v-btn @click="closeAuction(a.id)" color="warning" variant="tonal" class="rounded-pill font-weight-black text-[10px] tracking-widest px-6" size="small">TERMINATE</v-btn>
                    <v-btn icon="mdi-delete-sweep-outline" variant="tonal" color="error" rounded="lg" size="small" @click="deleteAuction(a.id)"></v-btn>
                    <v-btn icon="mdi-orbit" variant="flat" color="primary" rounded="lg" size="small" :to="'/auction/'+a.id" class="shadow-md"></v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-window-item>

      <!-- Capital Logistics & Participant Audit -->
      <v-window-item value="liquidity">
        <v-card variant="outlined" class="rounded-3xl border-subtle overflow-hidden shadow-premium bg-surface animate-fade">
          <v-table class="admin-table-matrix">
            <thead>
              <tr class="bg-grey-lighten-4">
                <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.3em]">PARTICIPANT IDENTITY</th>
                <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.3em]">LIQUIDITY MAGNITUDE</th>
                <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.3em]">SECURITY CLASS</th>
                <th class="px-12 py-10 text-overline font-weight-black text-muted-custom tracking-[0.3em] text-right">ADMIN GESTURE</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in allUsers" :key="user.uid" class="hover-row transition-all duration-300">
                <td class="px-12 py-12">
                  <div class="d-flex align-center gap-8">
                    <v-avatar color="primary" rounded="xl" size="56" class="shadow-md border-subtle rotate-3 group-hover:rotate-0 transition-transform">
                      <span class="text-h5 font-weight-black text-white italic">{{ (user.username || 'U')[0].toUpperCase() }}</span>
                    </v-avatar>
                    <div class="text-left">
                      <p class="text-h5 font-weight-black italic ma-0 tracking-tight">{{ user.username }}</p>
                      <p class="text-[9px] font-mono font-weight-bold text-muted-custom uppercase mb-1 tracking-widest opacity-60">{{ user.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-12 py-12 text-left">
                  <div class="d-flex align-baseline gap-2">
                    <span class="text-h4 font-weight-black italic text-primary tracking-tighter tabular-nums">₹{{ (user.credits || 0).toLocaleString() }}</span>
                    <span class="text-[10px] font-weight-bold text-muted-custom opacity-40 uppercase tracking-widest">Liquid</span>
                  </div>
                </td>
                <td class="px-12 py-12">
                  <v-chip :color="user.isVerified ? 'success' : 'warning'" size="small" variant="flat" rounded="pill" class="font-weight-black px-8 shadow-sm tracking-[0.2em] uppercase">
                    {{ user.isVerified ? 'Elite' : 'Pending' }}
                  </v-chip>
                </td>
                <td class="px-12 py-12 text-right">
                  <div class="d-flex justify-end gap-3">
                    <v-btn variant="outlined" color="primary" class="rounded-pill font-weight-black text-[10px] tracking-widest px-8" size="small" @click="auditUser(user)">AUDIT</v-btn>
                    <v-btn icon="mdi-shield-edit-outline" variant="tonal" color="primary" rounded="lg" size="small"></v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import { useNotification } from '../services/notification'

const notification = useNotification()
const tab = ref('deployment')
const auctions = ref([])
const allUsers = ref([])
const submitting = ref(false)
const aiLoading = ref(false)
const placeholderImage = 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2070&auto=format&fit=crop'

const newAuction = ref({
  title: '',
  description: '',
  minBid: 0,
  imageUrl: '',
  category: 'Watches',
  endTime: new Date(Date.now() + 86400000).toISOString()
})

const fetchSurveillanceData = async () => {
  try {
    const [aRes, uRes] = await Promise.all([
      api.get('/api/auctions'),
      api.get('/api/admin/users')
    ])
    auctions.value = aRes.data
    allUsers.value = uRes.data
  } catch (err) {
    console.error("Institutional Link Broken", err)
  }
}

const generateAIBid = () => {
  if (!newAuction.value.title) return notification.add("Asset nomenclature required for AI synthesis", "error")
  aiLoading.value = true
  setTimeout(() => {
    newAuction.value.description = `Institutional grade ${newAuction.value.title}. Verified authentic provenance, pristine metadata condition. Optimized for high-fidelity portfolio yield in the Indigo circuit. Dispatch authorized via BWC AI Core.`
    aiLoading.value = false
    notification.add("AI Intelligence Protocol: Asset Synchronized", "info")
  }, 1200)
}

const createAuction = async () => {
  if (!newAuction.value.title || newAuction.value.minBid <= 0) return
  submitting.value = true
  try {
    await api.post('/api/auctions', newAuction.value)
    notification.add("Asset Deployed to Global Market Tenders", "success")
    newAuction.value = { title: '', description: '', minBid: 0, imageUrl: '', category: 'Watches', endTime: new Date(Date.now() + 86400000).toISOString() }
    fetchSurveillanceData()
  } catch (err) {
    notification.add("Deployment Protocol Terminated: Sink Failure", "error")
  } finally {
    submitting.value = false
  }
}

const deleteAuction = async (id) => {
  if (confirm("Terminate Asset Tender? This is an irreversible archival gesture.")) {
    try {
      await api.delete(`/api/auctions/${id}`)
      notification.add("Asset Liquidated and Archival Terminated", "success")
      fetchSurveillanceData()
    } catch (err) {
      notification.add("Archival Protocol failure", "error")
    }
  }
}

const closeAuction = async (id) => {
  if (confirm("Execute Settlement Closing for this room?")) {
    try {
      await api.post('/api/admin/closeAuction', { auctionId: id })
      notification.add("Settlement Finalized • Winner Dispatched", "success")
      fetchSurveillanceData()
    } catch (err) {
      notification.add("Closing Protocol Error", "error")
    }
  }
}

const auditUser = (user) => {
  notification.add(`Initiating deep audit for participant: ${user.username} (UID: ${user.uid.slice(0,8)})`, "info")
}

onMounted(fetchSurveillanceData)
</script>

<style scoped>
.italic { font-style: italic !important; }
.not-italic { font-style: normal !important; }

.shadow-premium {
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.4), 0 18px 36px -18px rgba(0, 0, 0, 0.5) !important;
}

.admin-table-matrix :deep(th) {
  height: auto !important;
  background-color: var(--bg-surface) !important;
}

.hover-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.04) !important;
  transform: scale(1.002);
}

.animate-zoom {
  animation: zoomIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.98) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.pulse-badge {
  animation: pulse-market 2s infinite;
}

@keyframes pulse-market {
  0% { transform: scale(0.9); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.5; }
  100% { transform: scale(0.9); opacity: 1; }
}

.z-10 { z-index: 10; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }

.tabular-nums {
  font-variant-numeric: tabular-nums;
}

.rotate-3 {
  transform: rotate(3deg);
}

.shadow-inner-sm {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}
</style>
