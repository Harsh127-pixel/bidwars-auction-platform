<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
      <div>
        <h1 class="text-6xl font-black tracking-tighter leading-none mb-4 italic">
          Featured <span class="text-indigo-600 not-italic">Drops</span>
        </h1>
        <p class="text-lg text-secondary-custom font-medium">Curated high-stakes auctions happening right now.</p>
      </div>
      
      <!-- Category Filter Chips -->
      <div class="flex flex-wrap gap-2">
        <button v-for="cat in ['All', 'Art', 'Watches', 'Vehicles', 'Tech']" :key="cat" 
          @click="applyFilter(cat)"
          class="px-5 py-2 rounded-xl text-sm font-bold transition-all"
          :class="activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 px-8' : 'bg-surface text-muted-custom border border-subtle-custom hover:border-indigo-200'"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Skeletons -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      <div v-for="i in 3" :key="i" class="bg-surface rounded-[2.5rem] h-[32rem] animate-pulse border border-subtle-custom"></div>
    </div>

    <!-- Auction Items -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      <div v-for="auction in filteredAuctions" :key="auction.id" 
        class="group relative bg-surface rounded-[2.5rem] p-4 border border-subtle-custom shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col"
      >
        <!-- Image Container -->
        <div class="relative h-72 rounded-[2rem] overflow-hidden mb-6">
          <img :src="auction.imageUrl || 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2070&auto=format&fit=crop'" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <!-- Badges -->
          <div class="absolute top-4 left-4 flex gap-2">
             <span class="glass px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest border-white/20">
               {{ auction.category || 'RARE' }}
             </span>
          </div>

          <div class="absolute bottom-4 left-4 right-4 flex justify-between items-end translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
             <div class="bg-surface p-3 py-2 rounded-2xl shadow-xl border border-subtle-custom">
                <p class="text-[10px] font-black text-muted-custom uppercase tracking-widest leading-none mb-1">Highest Bid</p>
                <p class="text-xl font-black text-indigo-600">₹{{ auction.highestBid || auction.minBid }}</p>
             </div>
          </div>
        </div>

        <!-- Content -->
        <div class="px-3 pb-4">
          <div class="flex items-center gap-2 mb-3">
             <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span class="text-[10px] font-black text-green-500 uppercase tracking-widest">Live Auction</span>
          </div>
          <h3 class="text-2xl font-black mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
             {{ auction.title }}
          </h3>
          <p class="text-secondary-custom text-sm font-medium line-clamp-2 leading-relaxed mb-6">
            {{ auction.description }}
          </p>
          
          <router-link :to="'/auction/' + auction.id" class="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
            Enter Room
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { API_BASE_URL } from '../config/api'

const auctions = ref([])
const filteredAuctions = ref([])
const activeCategory = ref('All')
const loading = ref(true)

const fetchAuctions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/auctions`)
    const data = response.data
    
    if (data && data.length > 0) {
      auctions.value = data
    } else {
      throw new Error('Empty database')
    }
  } catch (error) {
    console.error("Error fetching auctions:", error)
    // Premium Mock Data
    auctions.value = [
      { id: '1', title: 'Vintage Rolex Submariner', description: 'Rare 1970s model in pristine condition. Certified authentic pre-owned masterpiece.', minBid: 450000, highestBid: 520000, category: 'Watches', imageUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?auto=format&fit=crop&q=80&w=1000' },
      { id: '2', title: 'MacBook Pro M3 Max', description: 'Brand new 14-inch model, 64GB RAM, 2TB SSD. The peak of portable performance.', minBid: 280000, highestBid: 295000, category: 'Tech', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1000' },
      { id: '3', title: 'Concept Cyber Cruiser', description: 'Limited edition electric motorcycle prototype. Zero emissions, maximum aesthetic impact.', minBid: 1200000, highestBid: 1450000, category: 'Vehicles', imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1000' },
      { id: '4', title: 'Abstract "Ethereal Blue"', description: 'Hand-painted large format oil on canvas. Explores the depths of subconscious tranquility.', minBid: 25000, highestBid: 42000, category: 'Art', imageUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=1000' }
    ]
  } finally {
    applyFilter('All')
    loading.value = false
  }
}

const applyFilter = (category) => {
  activeCategory.value = category
  if (category === 'All') {
    filteredAuctions.value = auctions.value
  } else {
    filteredAuctions.value = auctions.value.filter(a => a.category === category)
  }
}

onMounted(fetchAuctions)
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
