<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-700">
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
      <div class="space-y-2">
        <p class="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Global Portfolio</p>
        <h1 class="text-6xl font-black tracking-tight leading-none italic">
          Your <span class="text-indigo-600 not-italic ml-1">Portfolio</span>
        </h1>
        <p class="text-lg text-secondary-custom font-medium mt-4">
          Welcome back, <span class="font-bold text-primary-custom">{{ authStore.user?.username || 'John Wick' }}</span>. Assets are fluctuating.
        </p>
      </div>
      
      <div class="flex items-center gap-6 p-1 bg-surface rounded-[2rem] border border-subtle-custom shadow-sm pr-6">
        <div class="w-14 h-14 bg-indigo-600 rounded-[1.4rem] flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/20">
          {{ (authStore.user?.username || 'J')[0].toUpperCase() }}
        </div>
        <div>
          <p class="text-[9px] text-muted-custom font-black uppercase tracking-widest leading-none mb-1">Status Class</p>
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            <p class="text-sm font-black tracking-tight uppercase">Pro Bidder</p>
          </div>
          <p class="text-[9px] font-mono text-muted-custom mt-1 opacity-50">{{ authStore.user?.uid }}</p>
        </div>
      </div>
    </div>

    <!-- Core Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
      <!-- Balance Card (4/12) -->
      <div class="lg:col-span-4 bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group min-h-[380px] flex flex-col justify-between">
        <div class="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
        <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
        
        <div class="relative z-10">
          <div class="flex justify-between items-start mb-12">
            <div class="space-y-1">
              <div class="w-14 h-9 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center border border-white/10">
                <div class="w-8 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-sm shadow-sm"></div>
              </div>
              <p class="text-[8px] font-black uppercase tracking-widest opacity-60">Master Ledger</p>
            </div>
            <div class="text-right">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 opacity-40 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <p class="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Available Liquid Balance</p>
          <div class="flex items-baseline gap-2">
            <span class="text-6xl font-black tracking-tighter italic">₹{{ authStore.user?.credits || '5,000' }}</span>
            <span class="text-indigo-200 text-sm font-bold opacity-60">BWC</span>
          </div>
        </div>

        <div class="relative z-10 flex items-center justify-between pt-8 border-t border-white/10">
          <div>
            <p class="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Reserved In Escrow</p>
            <p class="text-xl font-black italic">₹{{ authStore.user?.heldCredits || '0' }}</p>
          </div>
          <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Quick Stats (8/12) -->
      <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Active Bids -->
        <div class="bg-surface rounded-[3rem] p-10 border border-subtle-custom shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
          <p class="text-muted-custom text-[10px] font-black uppercase tracking-[0.3em] mb-4">Active Bids</p>
          <h2 class="text-8xl font-black tracking-tighter italic leading-none mb-8">{{ activeBidsCount }}</h2>
          
          <div class="flex -space-x-3 overflow-hidden">
            <div v-for="i in Math.min(activeBidsCount, 4)" :key="i" class="w-12 h-12 rounded-2xl border-4 border-surface bg-base flex items-center justify-center shadow-lg hover:-translate-y-2 transition-transform cursor-pointer">
               <div class="w-8 h-8 bg-indigo-600/10 rounded-lg flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                 </svg>
               </div>
            </div>
          <div v-if="activeBidsCount > 4" class="w-12 h-12 rounded-2xl border-4 border-surface bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-lg">+{{ activeBidsCount - 4 }}</div>
          </div>
          <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        <!-- Items Won -->
        <div class="bg-surface rounded-[3rem] p-10 border border-subtle-custom shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
          <p class="text-muted-custom text-[10px] font-black uppercase tracking-[0.3em] mb-4">Items Won</p>
          <h2 class="text-8xl font-black tracking-tighter italic leading-none mb-8">{{ itemsWonCount }}</h2>
          
          <div>
             <div class="inline-flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-xl">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                 <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
               </svg>
               <span class="text-[10px] font-black text-green-600 uppercase tracking-widest">+0% Yield</span>
             </div>
          </div>
          
          <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-green-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>
    </div>

    <!-- Live Activity Table -->
    <div class="bg-surface rounded-[3rem] border border-subtle-custom shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
      <div class="px-10 py-8 border-b border-subtle-custom flex justify-between items-center bg-base/30">
        <h3 class="text-2xl font-black tracking-tight italic">Market <span class="text-indigo-600 not-italic">Activity</span></h3>
        <button class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">View Historical Ledger</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-base/50">
              <th class="px-10 py-5 text-[9px] font-black text-muted-custom uppercase tracking-[0.3em]">Asset Details</th>
              <th class="px-10 py-5 text-[9px] font-black text-muted-custom uppercase tracking-[0.3em]">Capital Committed</th>
              <th class="px-10 py-5 text-[9px] font-black text-muted-custom uppercase tracking-[0.3em]">Status</th>
              <th class="px-10 py-5 text-[9px] font-black text-muted-custom uppercase tracking-[0.3em]">Timestamp</th>
            </tr>
          </thead>
          <tbody class="divide-y border-subtle-custom">
            <tr v-for="item in biddingHistory" :key="item.id" class="hover:bg-base/40 transition-colors group">
              <td class="px-10 py-8">
                <div class="flex items-center gap-5">
                  <div class="w-14 h-14 rounded-2xl overflow-hidden border border-subtle-custom shadow-sm group-hover:scale-110 transition-transform">
                    <img :src="item.image" class="w-full h-full object-cover">
                  </div>
                  <div>
                    <span class="block text-lg font-black tracking-tight mb-0.5">{{ item.item }}</span>
                    <span class="text-[9px] font-black tracking-widest uppercase text-muted-custom">Verified Listing</span>
                  </div>
                </div>
              </td>
              <td class="px-10 py-8">
                <span class="text-xl font-black italic text-indigo-600">₹{{ item.amount }}</span>
              </td>
              <td class="px-10 py-8">
                <span :class="item.statusClass" class="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-current bg-opacity-10">
                  {{ item.status }}
                </span>
              </td>
              <td class="px-10 py-8 text-sm font-medium text-muted-custom uppercase tracking-tighter">
                {{ item.date }}
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
import { API_BASE_URL } from '../config/api'

const authStore = useAuthStore()
const rawAuctions = ref([])
const loading = ref(true)

const fetchDashboardData = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/auctions`)
    rawAuctions.value = res.data
  } catch (err) {
    console.error("Dashboard Fetch Error:", err)
  } finally {
    loading.value = false
  }
}

// Compute real participation
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
      statusClass: 'text-green-500 bg-green-500',
      date: new Date(a.createdAt).toLocaleDateString() + ' • LIVE',
      image: a.imageUrl || 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?auto=format&fit=crop&q=80&w=1000'
    }))
})

const activeBidsCount = computed(() => biddingHistory.value.length)
const itemsWonCount = ref(0) // Mock for now

onMounted(fetchDashboardData)
</script>

<style scoped>
/* Ensure no italic text unless specified */
h1 span.not-italic { font-style: normal; }
</style>
