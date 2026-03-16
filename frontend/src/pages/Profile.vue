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
      
      <v-row class="pa-12 relative z-10" align="center">
        <v-col cols="12" md="auto">
          <v-avatar size="140" color="white" class="rounded-2xl shadow-2xl border-4 border-white-opacity-20 rotate-3">
            <span class="text-h2 font-weight-black text-primary italic">
              {{ (authStore.user?.username || 'J')[0].toUpperCase() }}
            </span>
          </v-avatar>
        </v-col>
        
        <v-col class="text-left py-8">
          <div class="d-flex align-center gap-4 mb-4">
            <v-chip color="white" size="small" variant="flat" class="text-primary font-weight-black text-[10px] tracking-[0.2em] px-3">
              {{ authStore.role?.toUpperCase() }} CLASS
            </v-chip>
            <v-chip v-if="authStore.user?.isVerified" color="warning" size="small" variant="flat" class="font-weight-black text-[10px] tracking-[0.2em] px-3">
               <v-icon icon="mdi-shield-check" size="14" class="mr-2"></v-icon>
               ELITE VERIFIED
            </v-chip>
          </div>
          <h1 class="text-h1 font-weight-black tracking-tighter italic ma-0 leading-none">
            {{ authStore.user?.username || 'Legacy Member' }}
          </h1>
          <p class="text-h6 font-weight-medium opacity-70 mt-4 max-w-lg leading-relaxed">
            Market participant since {{ formatJoinDate(authStore.user?.createdAt) }}. Identity confirmed via BWC Secure protocols.
          </p>
        </v-col>

        <v-col cols="12" md="auto" class="d-flex flex-column gap-3">
          <v-btn variant="flat" color="white" class="text-primary rounded-pill px-8 shadow-lg" prepend-icon="mdi-export-variant">EXPORT LEDGER</v-btn>
          <v-btn variant="outlined" color="white" class="rounded-pill px-8 border-opacity-30">EDIT ARCHIVES</v-btn>
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
                  <v-chip :color="authStore.user?.isVerified ? 'success' : 'warning'" size="small" variant="tonal" class="rounded-lg font-weight-black">
                    {{ authStore.user?.isVerified ? 'Level 3 Verified' : 'Level 1 Enrollment' }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </v-card>

          <!-- Security Protocol Shield -->
          <v-card variant="flat" border class="rounded-2xl pa-10 border-dashed border-primary border-opacity-20 bg-blue-lighten-5">
            <div class="d-flex align-center gap-6">
              <v-avatar color="primary" size="80" variant="tonal" class="rounded-2xl shadow-md">
                 <v-icon icon="mdi-fingerprint" size="40"></v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <h3 class="text-h4 font-weight-black italic tracking-tight mb-2">KYC <span class="text-primary">Verification</span> Shield</h3>
                <p class="text-body-2 font-weight-medium text-muted-custom max-w-xl">
                  Bidders with Elite Verification status gain prioritized access to high-stakes tenders and government repossessions. Link your institutional credentials (PAN/GST) to unlock this tier.
                </p>
              </div>
              <v-btn v-if="!authStore.user?.isVerified" color="primary" class="rounded-pill px-10 shadow-lg h-56" elevation="12" @click="handleVerify">LINK CREDENTIALS</v-btn>
              <v-icon v-else icon="mdi-check-decagram" color="success" size="48"></v-icon>
            </div>
          </v-card>
        </div>
      </v-col>

      <!-- Sidebar Intelligence -->
      <v-col cols="12" lg="4">
        <div class="space-y-8">
          <!-- Statistics Matrix -->
          <v-card variant="outlined" class="rounded-2xl bg-surface border-subtle shadow-sm overflow-hidden">
             <div class="pa-8 border-b border-subtle bg-grey-lighten-5">
               <p class="text-overline font-weight-black tracking-[0.2em] ma-0 text-muted-custom">Performance Metrics</p>
             </div>
             <div class="pa-10 space-y-8">
               <div class="d-flex justify-space-between align-end">
                 <div>
                   <p class="text-[9px] font-weight-black text-muted-custom tracking-widest uppercase mb-1">Active Tenders</p>
                   <p class="text-h3 font-weight-black italic ma-0 leading-none">08</p>
                 </div>
                 <v-avatar color="primary" size="32" variant="tonal" rounded="lg">
                   <v-icon icon="mdi-eye-outline" size="18"></v-icon>
                 </v-avatar>
               </div>
               <div class="d-flex justify-space-between align-end">
                 <div>
                   <p class="text-[9px] font-weight-black text-muted-custom tracking-widest uppercase mb-1">Assets Captured</p>
                   <p class="text-h3 font-weight-black italic ma-0 leading-none">03</p>
                 </div>
                 <v-avatar color="success" size="32" variant="tonal" rounded="lg">
                   <v-icon icon="mdi-trophy-variant-outline" size="18"></v-icon>
                 </v-avatar>
               </div>
               <div class="d-flex justify-space-between align-center pt-8 border-t border-subtle">
                 <p class="text-caption font-weight-black uppercase tracking-widest text-muted-custom">Market Reliability</p>
                 <span class="text-h6 font-weight-black text-success">98.4%</span>
               </div>
             </div>
          </v-card>

          <!-- Preference Engine -->
          <v-card variant="outlined" class="rounded-2xl bg-surface border-subtle shadow-sm pa-10 text-left">
            <p class="text-overline font-weight-black text-primary tracking-[0.2em] mb-6 uppercase">System Preferences</p>
            <div class="space-y-4">
              <v-switch color="primary" label="Secure SMS Notifications" hide-details inset density="comfortable" class="text-caption font-weight-black ma-0"></v-switch>
              <v-switch color="primary" label="Two-Factor Session Lock" hide-details inset density="comfortable" class="text-caption font-weight-black ma-0" model-value="true"></v-switch>
              <v-switch color="primary" label="Confidential Bid Mode" hide-details inset density="comfortable" class="text-caption font-weight-black ma-0"></v-switch>
            </div>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'

const authStore = useAuthStore()
const notification = useNotification()

const formatJoinDate = (date) => {
  if (!date) return 'Q1 2026'
  const d = new Date(date)
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
  }
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
