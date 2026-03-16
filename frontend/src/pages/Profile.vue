<template>
  <v-container class="py-12 px-6 animate-fade" max-width="1280">
    <!-- Identity Hero Architecture -->
    <v-card 
      elevation="24" 
      class="rounded-2xl overflow-hidden mb-12 border-subtle relative bg-primary text-white"
    >
      <!-- Background Strategy -->
      <div class="position-absolute inset-0 opacity-10 bg-gradient-to-br from-white to-transparent z-0"></div>
      <div class="position-absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-circle blur-3xl translate-x-10 translate-y-10"></div>
      
      <v-row class="pa-6 pa-md-12 relative z-10" align="center">
        <v-col cols="12" md="auto" class="d-flex justify-center justify-md-start">
          <v-avatar size="100" class="rounded-2xl shadow-2xl border-4 border-white-opacity-20 rotate-3 bg-white">
            <span class="text-h3 text-md-h2 font-weight-black text-primary italic">
              {{ (authStore.user?.username || 'J')[0].toUpperCase() }}
            </span>
          </v-avatar>
        </v-col>
        
        <v-col class="text-center text-md-left py-4 py-md-8">
          <div class="d-flex align-center justify-center justify-md-start gap-3 gap-md-4 mb-4">
            <v-chip color="white" size="small" variant="flat" class="text-primary font-weight-black text-[9px] text-md-[10px] tracking-[0.2em] px-3">
              {{ authStore.role?.toUpperCase() }} CLASS
            </v-chip>
            <v-chip v-if="authStore.user?.isVerified" color="warning" size="small" variant="flat" class="font-weight-black text-[9px] text-md-[10px] tracking-[0.2em] px-3">
               <v-icon icon="mdi-shield-check" size="14" class="mr-1 mr-md-2"></v-icon>
               ELITE VERIFIED
            </v-chip>
          </div>
          <h1 class="text-h3 text-md-h1 font-weight-black tracking-tighter italic ma-0 leading-tight">
            {{ authStore.user?.username || 'Legacy Member' }}
          </h1>
          <p class="text-body-1 text-md-h6 font-weight-medium opacity-70 mt-4 max-w-lg leading-relaxed mx-auto mx-md-0">
            Market participant since {{ formatJoinDate(authStore.user?.createdAt) }}. Identity confirmed via BWC Secure protocols.
          </p>
        </v-col>

        <v-col cols="12" md="auto" class="d-flex flex-column flex-sm-row justify-center gap-3">
          <v-btn variant="flat" color="white" class="text-primary rounded-pill px-8 shadow-lg w-100 w-sm-auto" prepend-icon="mdi-export-variant">EXPORT</v-btn>
          <v-btn variant="outlined" color="white" class="rounded-pill px-8 border-opacity-30 w-100 w-sm-auto">EDIT</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-row>
      <!-- Identity Ledger Columns -->
      <v-col cols="12" lg="8">
        <div class="space-y-8 text-left">
          <!-- Digital Identification -->
          <v-card variant="outlined" class="rounded-2xl pa-10 bg-surface border-subtle shadow-sm group hover-border-primary transition-all duration-500">
            <div class="d-flex align-center gap-4 mb-8">
              <v-avatar color="primary" variant="tonal" rounded="lg" size="48">
                <v-icon icon="mdi-shield-account-outline" size="24"></v-icon>
              </v-avatar>
              <div>
                <h3 class="text-h4 font-weight-black italic tracking-tight">Identity <span class="text-primary not-italic">Ledger</span></h3>
                <p class="text-caption font-weight-bold text-muted-custom uppercase tracking-widest leading-none mt-1">Institutional record of verified credentials</p>
              </div>
            </div>

            <v-row>
              <v-col cols="12" md="6">
                <div class="mb-6">
                  <p class="text-overline font-weight-black text-muted-custom mb-1">Public Handle</p>
                  <p class="text-h6 font-weight-black italic tracking-tight">{{ authStore.user?.username }}</p>
                </div>
                <div>
                  <p class="text-overline font-weight-black text-muted-custom mb-1">Electronic Mail</p>
                  <p class="text-h6 font-weight-black italic tracking-tight">{{ authStore.user?.email }}</p>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="mb-6">
                  <p class="text-overline font-weight-black text-muted-custom mb-1">Global Identifier (UUID)</p>
                  <p class="text-caption font-mono font-weight-bold bg-grey-lighten-4 pa-2 rounded-lg text-primary truncate">
                    {{ authStore.user?.uid }}
                  </p>
                </div>
                <div>
                  <p class="text-overline font-weight-black text-muted-custom mb-1">Security Status</p>
                  <v-chip :color="authStore.user?.isVerified ? 'success' : (authStore.user?.kycStatus === 'pending' ? 'info' : 'warning')" size="small" variant="tonal" class="rounded-lg font-weight-black">
                    {{ authStore.user?.isVerified ? 'Level 3 Verified' : (authStore.user?.kycStatus === 'pending' ? 'Pending Approval' : 'Level 1 Enrollment') }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </v-card>

          <!-- KYC Document Vault -->
          <v-card variant="outlined" class="rounded-2xl pa-6 pa-md-10 bg-surface border-subtle shadow-sm group hover-border-primary transition-all duration-500">
            <div class="d-flex align-center gap-4 mb-8">
              <v-avatar color="primary" variant="tonal" rounded="lg" size="40" size-md="48">
                <v-icon icon="mdi-file-document-outline" size="20" size-md="24"></v-icon>
              </v-avatar>
              <div class="text-left">
                <h3 class="text-h5 text-md-h4 font-weight-black italic tracking-tight">Trust <span class="text-primary not-italic">Vault</span></h3>
                <p class="text-[10px] text-md-caption font-weight-bold text-muted-custom uppercase tracking-widest leading-none mt-1">Encrypted document storage & KYC Screening</p>
              </div>
            </div>

            <div class="space-y-6">
               <div class="d-flex flex-column flex-sm-row align-center justify-space-between pa-6 bg-grey-lighten-5 rounded-xl border border-subtle gap-6">
                  <div class="d-flex align-center gap-4 w-100 w-sm-auto">
                    <v-icon icon="mdi-card-account-details-outline" size="28" color="primary"></v-icon>
                    <div>
                      <p class="text-[10px] text-md-caption font-weight-black text-muted-custom uppercase mb-1">PAN Card / Incorporation Proof</p>
                      <p class="text-caption text-md-body-2 font-weight-bold truncate max-w-[200px]">{{ kycFile ? kycFile.name : 'No file uploaded' }}</p>
                    </div>
                  </div>
                  <v-file-input
                    v-model="kycFile"
                    hide-details
                    class="d-none"
                    id="pan-upload"
                    accept="image/*,application/pdf"
                  ></v-file-input>
                  <v-btn 
                    v-if="!authStore.user?.isVerified && authStore.user?.kycStatus !== 'pending'"
                    variant="tonal" 
                    color="primary" 
                    class="rounded-lg w-100 w-sm-auto"
                    @click="triggerUpload"
                    :loading="uploading"
                  >
                    {{ kycFile ? 'Change' : 'Upload' }}
                  </v-btn>
                  <v-chip v-else-if="authStore.user?.kycStatus === 'pending'" color="info" size="small" variant="flat" class="rounded-lg w-100 w-sm-auto justify-center uppercase tracking-widest text-[10px]">Processing</v-chip>
                  <v-chip v-else color="success" size="small" variant="flat" class="rounded-lg w-100 w-sm-auto justify-center">SECURE</v-chip>
               </div>

               <div v-if="kycFile && !authStore.user?.isVerified" class="pa-6 border border-primary border-opacity-20 rounded-xl bg-blue-lighten-5 animate-fade">
                  <p class="text-caption font-weight-bold text-primary mb-3">By submitting, you agree to BWC background screening protocols.</p>
                  <v-btn block color="primary" class="rounded-pill" height="48" @click="submitVerification">
                    FINALIZE VERIFICATION
                  </v-btn>
               </div>
            </div>
          </v-card>

          <!-- Institutional Tiering Section -->
          <div v-if="authStore.user" class="animate-fade mt-10">
            <v-card variant="outlined" class="rounded-2xl pa-10 bg-surface border-subtle shadow-sm overflow-hidden relative">
              <div class="relative z-10">
                <div class="d-flex align-center justify-space-between mb-8">
                  <div class="d-flex align-center gap-4">
                    <v-avatar color="primary" variant="flat" size="48" class="shadow-sm">
                      <v-icon icon="mdi-crown-outline" color="white"></v-icon>
                    </v-avatar>
                    <div>
                      <h3 class="text-h5 font-weight-black italic tracking-tight">Institutional <span class="text-primary not-italic">Tiering</span></h3>
                      <p class="text-[10px] font-weight-bold text-muted-custom uppercase tracking-widest leading-none mt-1">Select your access and commission profile</p>
                    </div>
                  </div>
                  <v-chip :color="tierColor(authStore.user?.membershipTier)" variant="flat" size="small" class="rounded-lg font-weight-black uppercase tracking-tighter">{{ authStore.user?.membershipTier || 'Bronze' }}</v-chip>
                </div>

                <v-row>
                  <v-col cols="12" md="4" v-for="t in tiers" :key="t.name">
                    <v-card 
                      variant="tonal" 
                      :color="authStore.user?.membershipTier === t.name ? 'primary' : 'grey-lighten-2'" 
                      class="rounded-xl pa-6 transition-all border-subtle h-100"
                      :style="authStore.user?.membershipTier === t.name ? 'background: rgba(var(--v-theme-primary), 0.05)' : ''"
                    >
                      <div class="d-flex align-center justify-space-between mb-4">
                        <span class="text-h6 font-weight-black italic">{{ t.name }}</span>
                        <v-icon v-if="authStore.user?.membershipTier === t.name" icon="mdi-check-decagram" color="primary"></v-icon>
                      </div>
                      <ul class="text-[11px] font-weight-bold space-y-2 opacity-80 list-none pa-0">
                        <li>• {{ t.commission }}% Platform Commission</li>
                        <li>• {{ t.access }}</li>
                        <li>• {{ t.priority }}</li>
                      </ul>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-card>
          </div>
        </div>
      </v-col>

      <!-- Sidebar Intelligence -->
      <v-col cols="12" lg="4">
        <div class="space-y-8">
          <!-- Statistics Matrix -->
          <v-card variant="outlined" class="rounded-2xl bg-surface border-subtle shadow-sm overflow-hidden text-left">
             <div class="pa-8 border-b border-subtle bg-grey-lighten-5">
               <p class="text-overline font-weight-black tracking-[0.2em] ma-0 text-muted-custom">Performance Metrics</p>
             </div>
             <div class="pa-10 space-y-8">
               <div class="d-flex justify-space-between align-end">
                 <div>
                   <p class="text-[9px] font-weight-black text-muted-custom tracking-widest uppercase mb-1">Commission Rate</p>
                   <p class="text-h3 font-weight-black italic ma-0 leading-none">{{ getCommissionTier(authStore.user?.membershipTier) }}%</p>
                 </div>
                 <v-avatar color="warning" size="32" variant="tonal" rounded="lg">
                   <v-icon icon="mdi-percent-outline" size="18"></v-icon>
                 </v-avatar>
               </div>
               <div class="d-flex justify-space-between align-end">
                 <div>
                   <p class="text-[9px] font-weight-black text-muted-custom tracking-widest uppercase mb-1">Escrow Safeguard</p>
                   <p class="text-h3 font-weight-black italic ma-0 leading-none">ACTIVE</p>
                 </div>
                 <v-avatar color="success" size="32" variant="tonal" rounded="lg">
                   <v-icon icon="mdi-safe-square-outline" size="18"></v-icon>
                 </v-avatar>
               </div>
                <div class="d-flex justify-space-between align-center pt-8 border-t border-subtle">
                  <p class="text-caption font-weight-black uppercase tracking-widest text-muted-custom">Market Reliability</p>
                  <span class="text-h6 font-weight-black text-success">{{ authStore.user?.reputation || 100 }}%</span>
                </div>
             </div>
          </v-card>

          <!-- Active Escrows -->
          <v-card v-if="wonItems.some(i => i.escrowStatus === 'held')" variant="outlined" class="rounded-2xl bg-surface border-subtle shadow-sm overflow-hidden animate-fade text-left">
             <div class="pa-8 border-b border-subtle bg-grey-lighten-5">
               <p class="text-overline font-weight-black tracking-[0.2em] ma-0 text-muted-custom">Shipment Confirmation</p>
             </div>
             <div class="pa-6 space-y-4">
               <div v-for="item in wonItems.filter(i => i.escrowStatus === 'held')" :key="item.id" class="pa-4 rounded-xl border border-subtle bg-white shadow-sm">
                 <div class="d-flex align-center gap-3 mb-4">
                   <v-avatar size="50" rounded="lg" color="grey-lighten-4">
                     <v-img :src="item.imageUrl" cover></v-img>
                   </v-avatar>
                   <div>
                     <p class="text-caption font-weight-black line-clamp-1 ma-0">{{ item.title }}</p>
                     <p class="text-[10px] text-primary font-weight-bold uppercase tracking-widest">Awaiting Confirmation</p>
                   </div>
                 </div>
                 <v-btn block size="small" color="success" variant="flat" class="rounded-lg font-weight-black" @click="confirmReceipt(item.id)">
                   Confirm Receipt
                 </v-btn>
               </div>
             </div>
          </v-card>

          <!-- Acquired Assets (Certificates) -->
          <v-card v-if="wonItems.some(i => i.escrowStatus === 'released')" variant="outlined" class="rounded-2xl bg-surface border-subtle shadow-sm overflow-hidden animate-fade text-left mt-8">
             <div class="pa-8 border-b border-subtle bg-grey-lighten-5">
               <p class="text-overline font-weight-black tracking-[0.2em] ma-0 text-muted-custom">Collection Portfolio</p>
             </div>
             <div class="pa-6 space-y-4">
               <div v-for="item in wonItems.filter(i => i.escrowStatus === 'released')" :key="item.id" class="pa-4 rounded-xl border border-subtle bg-white shadow-sm">
                 <div class="d-flex align-center gap-3 mb-4">
                   <v-avatar size="50" rounded="lg" color="grey-lighten-4">
                     <v-img :src="item.imageUrl" cover></v-img>
                   </v-avatar>
                   <div>
                     <p class="text-caption font-weight-black line-clamp-1 ma-0">{{ item.title }}</p>
                     <p class="text-[10px] text-success font-weight-bold uppercase tracking-widest">Asset Secured</p>
                   </div>
                 </div>
                 <v-btn block size="small" color="primary" variant="outlined" class="rounded-lg font-weight-black" @click="downloadCertificate(item.id)">
                   <v-icon icon="mdi-file-certificate-outline" start></v-icon>
                   Download Certificate
                 </v-btn>
               </div>
             </div>
          </v-card>

          <!-- Intelligence Feed (Notifications) -->
          <v-card variant="outlined" class="rounded-2xl bg-surface border-subtle shadow-sm overflow-hidden text-left mt-8">
            <div class="pa-8 border-b border-subtle bg-grey-lighten-5 d-flex justify-space-between align-center">
              <p class="text-overline font-weight-black tracking-[0.2em] ma-0 text-muted-custom">Intelligence Feed</p>
              <v-badge v-if="notifications.filter(n => !n.read).length" color="red" :content="notifications.filter(n => !n.read).length" inline></v-badge>
            </div>
            <div class="pa-6" style="max-height: 400px; overflow-y: auto;">
              <div v-if="notifications.length === 0" class="text-center py-8">
                <v-icon icon="mdi-bell-off-outline" size="32" color="muted" class="mb-2 opacity-20"></v-icon>
                <p class="text-caption text-muted-custom font-weight-bold uppercase">No updates detected</p>
              </div>
              <div v-for="note in notifications" :key="note.id" class="mb-4 pb-4 border-b border-subtle last:border-0">
                <div class="d-flex gap-3">
                  <v-avatar :color="note.type === 'FINAL_CALL' ? 'warning' : 'primary'" variant="tonal" size="32" rounded="lg">
                    <v-icon :icon="note.type === 'FINAL_CALL' ? 'mdi-clock-alert-outline' : 'mdi-information-variant'" size="18"></v-icon>
                  </v-avatar>
                  <div style="flex: 1;">
                    <p class="text-caption font-weight-black line-height-tight mb-1" :class="{'text-muted': note.read}">{{ note.message }}</p>
                    <div class="d-flex justify-space-between align-center">
                      <span class="text-[10px] font-weight-bold text-muted-custom">{{ formatJoinDate(note.createdAt) }}</span>
                      <v-btn v-if="!note.read" variant="text" size="x-small" color="primary" class="font-weight-black" @click="markAsRead(note.id)">Mark Seen</v-btn>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-card>

          <!-- Preference Engine -->
          <v-card v-if="authStore.user" variant="outlined" class="rounded-2xl bg-surface border-subtle shadow-sm pa-10 text-left">
            <p class="text-overline font-weight-black text-primary tracking-[0.2em] mb-6 uppercase">System Preferences</p>
            <div class="space-y-4">
              <v-switch 
                color="primary" 
                label="Secure SMS Notifications" 
                hide-details inset density="comfortable" 
                class="text-caption font-weight-black ma-0"
                :model-value="authStore.user.preferences?.smsNotifications"
                @update:model-value="v => authStore.updatePreferences({ smsNotifications: v })"
              ></v-switch>
              <v-switch 
                color="primary" 
                label="Two-Factor Session Lock" 
                hide-details inset density="comfortable" 
                class="text-caption font-weight-black ma-0"
                :model-value="authStore.user.preferences?.twoFactor"
                @update:model-value="v => authStore.updatePreferences({ twoFactor: v })"
              ></v-switch>
              <v-switch 
                color="primary" 
                label="Confidential Bid Mode" 
                hide-details inset density="comfortable" 
                class="text-caption font-weight-black ma-0"
                :model-value="authStore.user.preferences?.confidentialBidding"
                @update:model-value="v => authStore.updatePreferences({ confidentialBidding: v })"
              ></v-switch>
            </div>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'

const authStore = useAuthStore()
const notification = useNotification()

const kycFile = ref(null)
const uploading = ref(false)
const wonItems = ref([])
const loadingWins = ref(false)
const notifications = ref([])

import api from '../services/api'
import socket from '../services/socket'
const tiers = [
  { name: 'Bronze', commission: 5, access: 'Standard Public Lots', priority: 'Basic Support' },
  { name: 'Silver', commission: 3, access: 'VIP Curated Lots', priority: 'Accelerated Payouts' },
  { name: 'Gold', commission: 1, access: 'Global Elite Assets', priority: 'Personalized Concierge' }
]

const tierColor = (tier) => {
  if (tier === 'Gold') return 'amber-accent-4'
  if (tier === 'Silver') return 'blue-grey-lighten-2'
  return 'brown-lighten-1'
}

const getCommissionTier = (tier) => {
  if (tier === 'Gold') return 1
  if (tier === 'Silver') return 3
  return 5
}

const fetchWonItems = async () => {
  if (!authStore.user) return
  loadingWins.value = true
  try {
    const res = await api.get('/api/auctions')
    wonItems.value = res.data.filter(a => a.highestBidder === authStore.user.uid && a.status === 'closed')
  } catch (err) {
    console.error("Failed to fetch wins", err)
  } finally {
    loadingWins.value = false
  }
}

const confirmReceipt = async (id) => {
  try {
    await api.post(`/api/auctions/${id}/confirm-receipt`)
    notification.add("Escrow released. Seller has been settled.", "success")
    fetchWonItems()
    fetchNotifications()
  } catch {
    notification.add("Settlement finalization failed.", "error")
  }
}

const fetchNotifications = async () => {
  if (!authStore.user) return
  try {
    const res = await api.get('/api/notifications')
    notifications.value = res.data
  } catch (err) {
    console.error("Signal interception failed", err)
  }
}

const markAsRead = async (id) => {
  try {
    await api.post(`/api/notifications/${id}/read`)
    fetchNotifications()
  } catch (err) {
    console.error(err)
  }
}

const downloadCertificate = async (id) => {
  try {
    notification.add("Decrypting Authenticity Certificate...", "info")
    const response = await api.get(`/api/auctions/${id}/certificate`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Certificate_${id.slice(0,8)}.pdf`)
    document.body.appendChild(link)
    link.click()
    notification.add("Identity proof exported successfully.", "success")
  } catch {
    notification.add("Secure document export failed.", "error")
  }
}


const triggerUpload = () => document.getElementById('pan-upload').click()

const submitVerification = async () => {
  if (!kycFile.value) return
  uploading.value = true
  try {
    // Simulate document processing delay
    await new Promise(r => setTimeout(r, 2000))
    await authStore.requestKYC()
    notification.add("Identity Ledger updated. Document submitted for BWC screening.", "success")
    kycFile.value = null
  } catch (err) {
    notification.add("Document validation failed.", "error")
  } finally {
    uploading.value = false
  }
}

const formatJoinDate = (date) => {
  if (!date) return 'Q1 2026'
  const d = date.toDate ? date.toDate() : new Date(date)
  if (isNaN(d.getTime())) return 'Q1 2026'
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const handleVerify = async () => {
  try {
    await authStore.verifyKYC()
    notification.add("Institutional credentials linked successfully", "success")
  } catch (err) {
    notification.add("Verification failed. Please try again.", "error")
  }
}

onMounted(() => {
  if (!authStore.user) {
    notification.add("Secure link established with Identity Vault", "info")
  } else {
    fetchWonItems()
    fetchNotifications()
  }

  socket.on('auction:finalCall', (data) => {
    if (data.userIds.includes(authStore.user?.uid)) {
      notification.add(`URGENT: ${data.title} ends in 15 minutes!`, 'warning')
      fetchNotifications()
    }
  })
})

onUnmounted(() => {
  socket.off('auction:finalCall')
})
</script>

<style scoped>
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.z-0 { z-index: 0; }
.z-10 { z-index: 10; }

.hover-border-primary:hover {
  border-color: rgba(var(--v-theme-primary), 0.4) !important;
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}

.animate-fade {
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.space-y-8 > :not([hidden]) ~ :not([hidden]) {
  margin-top: 2rem;
}
.space-y-4 > :not([hidden]) ~ :not([hidden]) {
  margin-top: 1rem;
}
</style>
