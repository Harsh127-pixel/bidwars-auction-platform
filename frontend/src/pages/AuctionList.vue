<template>
  <v-container class="py-12 px-6 animate-fade" max-width="1440">
    <!-- Market Header Architecture -->
    <v-row class="mb-16 align-end">
      <v-col cols="12" md="8" class="text-left">
        <p class="text-overline font-weight-black text-primary tracking-[0.6em] mb-4 uppercase">Global BWC Circuit</p>
        <h1 class="text-h1 font-weight-black tracking-tighter italic ma-0 leading-none">
          Market <span class="text-primary not-italic">Tenders</span>
        </h1>
        <p class="text-h6 font-weight-medium text-muted-custom mt-6 max-w-2xl leading-relaxed">
          Surveillance of institutional asset classes. Deploy capital to secure high-stakes repossessions and digital collectibles.
        </p>
      </v-col>
      
      <v-col cols="12" md="4" class="d-flex justify-md-end">
        <v-card variant="flat" border class="rounded-2xl pa-6 border-subtle bg-surface shadow-sm d-flex align-center gap-6 group hover-border-primary transition-all">
          <v-avatar color="primary" variant="tonal" border size="56" class="rounded-xl border-primary-lighten-4">
            <v-icon icon="mdi-gavel" size="28"></v-icon>
          </v-avatar>
          <div class="text-left">
            <p class="text-[10px] font-weight-black text-primary tracking-[0.3em] uppercase mb-1 leading-none">Circuit Status</p>
            <div class="d-flex align-center gap-2">
              <v-badge dot color="success" inline class="pulse-badge ma-0"></v-badge>
              <span class="text-caption font-weight-black tracking-widest uppercase text-success">Active Trade cycle</span>
            </div>
            <p class="text-[9px] font-mono mt-1 opacity-40 uppercase tracking-widest">{{ auctions.length }} ASSETS LIVE</p>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtering Matrix Navigation -->
    <v-row class="mb-14">
      <v-col cols="12">
        <div class="d-flex flex-column lg:flex-row align-center justify-space-between gap-10">
          <!-- Categories Engine -->
          <v-card variant="outlined" class="pa-2 rounded-pill bg-surface border-subtle d-flex shadow-sm w-100 w-lg-auto overflow-x-auto no-scrollbar">
            <v-btn-toggle
              v-model="categoryFilter"
              mandatory
              rounded="pill"
              color="primary"
              variant="flat"
              class="bg-transparent"
            >
              <v-btn v-for="cat in ['All', 'Art', 'Watches', 'Vehicles', 'Electronics', 'Collectibles']" :key="cat" :value="cat" class="px-10 font-weight-black text-[11px] tracking-widest h-48 uppercase">
                {{ cat }}
              </v-btn>
            </v-btn-toggle>
          </v-card>

          <!-- Search Surveillance -->
          <div class="d-flex align-center gap-4 w-100 w-lg-auto">
            <v-text-field
              v-model="searchQuery"
              placeholder="SEARCH ASSET CIRCUIT..."
              variant="outlined"
              rounded="pill"
              density="comfortable"
              hide-details
              prepend-inner-icon="mdi-magnify"
              class="max-w-md w-100 font-weight-black text-subtitle-2 bg-surface shadow-inner-sm"
            ></v-text-field>
            
            <v-btn icon="mdi-tune-variant" variant="tonal" color="primary" class="rounded-xl h-48 w-48 shadow-sm"></v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Asset Deployment Grid -->
    <v-row v-if="loading">
      <v-col v-for="n in 6" :key="n" cols="12" sm="6" lg="4">
        <v-skeleton-loader
          type="card, list-item-two-line"
          class="rounded-3xl border border-subtle bg-surface"
        ></v-skeleton-loader>
      </v-col>
    </v-row>

    <template v-else-if="filteredAuctions.length > 0">
      <v-row class="g-8">
        <v-col v-for="auction in filteredAuctions" :key="auction.id" cols="12" sm="6" lg="4">
          <v-card 
            :to="'/auction/' + auction.id"
            elevation="0"
            class="rounded-3xl border-subtle overflow-hidden relative group bg-surface hover-shadow-premium transition-all duration-700"
          >
            <!-- Media Strategy -->
            <div class="h-80 overflow-hidden relative">
              <v-img 
                :src="auction.imageUrl || placeholderImage" 
                cover 
                class="transform group-hover:scale-110 transition-transform duration-1000"
                aspect-ratio="16/10"
              >
                <template v-slot:placeholder>
                  <v-row class="fill-height ma-0" align="center" justify="center">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  </v-row>
                </template>
              </v-img>
              
              <!-- Sector Overlay -->
              <v-chip 
                class="position-absolute top-0 right-0 ma-6 font-weight-black text-[10px] tracking-widest uppercase shadow-xl"
                color="primary"
                variant="flat"
                size="small"
                rounded="lg"
              >
                {{ auction.category }}
              </v-chip>

              <!-- Glass Valuer Gradient -->
              <div class="absolute bottom-0 left-0 right-0 pa-8 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-start">
                 <p class="text-[10px] font-weight-black text-white/50 tracking-widest uppercase mb-1 leading-none">Current Magnitude</p>
                 <div class="flex items-baseline gap-2">
                   <span class="text-white text-h5 font-weight-bold opacity-40">₹</span>
                   <span class="text-white text-h2 font-weight-black tracking-tighter italic tabular-nums leading-none">
                     {{ (auction.highestBid || auction.minBid).toLocaleString() }}
                   </span>
                 </div>
              </div>
            </div>

            <!-- Context Matrix -->
            <div class="pa-8 text-left">
              <div class="d-flex justify-space-between align-start mb-4">
                <h3 class="text-h4 font-weight-black italic tracking-tighter group-hover:text-primary transition-colors leading-6">
                  {{ auction.title }}
                </h3>
                <v-icon icon="mdi-link-variant" class="opacity-0 group-hover:opacity-40 transition-opacity" size="20"></v-icon>
              </div>
              
              <p class="text-caption font-weight-medium text-muted-custom line-clamp-2 mb-8 opacity-70">
                {{ auction.description }}
              </p>

              <div class="pt-6 border-t border-subtle d-flex justify-space-between align-center">
                <div class="d-flex align-center gap-3">
                  <v-avatar color="primary" variant="tonal" size="24" class="rounded-lg">
                    <v-icon icon="mdi-eye-outline" size="14"></v-icon>
                  </v-avatar>
                  <span class="text-[10px] font-weight-black text-muted-custom uppercase tracking-widest">Watcher Active</span>
                </div>
                
                <v-btn 
                  variant="flat" 
                  color="primary" 
                  class="rounded-pill font-weight-black text-[10px] px-8 tracking-[0.2em] shadow-lg group-hover:translate-x-1 transition-transform"
                  height="40"
                >
                  AUDIT CIRCUIT
                </v-btn>
              </div>
            </div>
            
            <!-- Hover Intelligence Line -->
            <div class="absolute bottom-0 left-0 h-1 bg-primary w-0 group-hover:w-full transition-all duration-700"></div>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <div v-else class="py-32 text-center animate-fade">
      <v-avatar color="primary" variant="tonal" size="160" class="rounded-3xl mb-12 shadow-2xl relative rotate-3">
        <v-icon icon="mdi-magnify-close" size="72" color="primary"></v-icon>
      </v-avatar>
      <h2 class="text-h2 font-weight-black italic tracking-tighter mb-4">No Asset <span class="text-primary">Matches</span> Found</h2>
      <p class="text-h6 font-weight-medium text-muted-custom opacity-50 max-w-lg mx-auto leading-relaxed">
        The circuit surveillance failed to identify assets matching your intelligence query. Try an alternative classification or nomenclature.
      </p>
      <v-btn @click="categoryFilter = 'All'; searchQuery = ''" variant="outlined" color="primary" class="mt-12 rounded-pill px-12 font-weight-black tracking-widest" height="56">
        RESET SURVEILLANCE
      </v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../services/api'

const auctions = ref([])
const loading = ref(true)
const categoryFilter = ref('All')
const searchQuery = ref('')
const placeholderImage = 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?auto=format&fit=crop&q=80&w=1000'

const fetchAuctions = async () => {
  try {
    const res = await api.get('/api/auctions')
    auctions.value = res.data
  } catch (err) {
    console.error("Critical: Circuit Failure", err)
  } finally {
    loading.value = false
  }
}

const filteredAuctions = computed(() => {
  return auctions.value.filter(a => {
    const matchCat = categoryFilter.value === 'All' || a.category === categoryFilter.value
    const matchSearch = a.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                        a.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchCat && matchSearch
  })
})

onMounted(fetchAuctions)
</script>

<style scoped>
.italic { font-style: italic !important; }
.not-italic { font-style: normal !important; }

.hover-shadow-premium:hover {
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.15), 0 18px 36px -18px rgba(0, 0, 0, 0.2) !important;
  transform: translateY(-8px);
}

.shadow-inner-sm {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

.pulse-badge {
  animation: pulse-market 2s infinite;
}

@keyframes pulse-market {
  0% { transform: scale(0.9); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.5; }
  100% { transform: scale(0.9); opacity: 1; }
}

.animate-fade {
  animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.rotate-3 {
  transform: rotate(3deg);
}
</style>
