<template>
  <div style="background-color: var(--bg-page); min-height: 100vh;">
    <!-- Hero Banner -->
    <div style="background-color: var(--bg-card); border-bottom: 1px solid var(--border-color); padding: 48px 16px 40px;">
      <div style="max-width: 1280px; margin: 0 auto;">
        <div class="d-flex flex-wrap align-center justify-space-between animate-in" style="gap: 24px;">
          <div>
            <h1 class="font-display" style="font-size: clamp(32px, 5vw, 52px); color: var(--text-primary); line-height: 1.1; margin: 0 0 12px;">
              Live Auctions
            </h1>
            <p style="color: var(--text-secondary); font-size: 16px; margin: 0; max-width: 500px;">
              Bid on authenticated items in real-time. Secure bidding with transparent pricing and instant updates.
            </p>
          </div>

          <div class="d-flex align-center" style="gap: 16px; background: var(--bg-elevated); padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border-color);">
            <div>
              <div style="font-size: 24px; font-family: 'DM Serif Display', serif; color: var(--text-primary); line-height: 1;">{{ auctions.length }}</div>
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px;">Active Lots</div>
            </div>
            <div style="width: 1px; height: 36px; background: var(--border-color);"></div>
            <div>
              <div class="live-badge">
                <span class="live-dot"></span>
                Live Now
              </div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Bids updating</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div style="background-color: var(--bg-card); border-bottom: 1px solid var(--border-color); padding: 0 16px; position: sticky; top: 64px; z-index: 50;">
      <div style="max-width: 1280px; margin: 0 auto; display: flex; align-items: center; gap: 12px; overflow-x: auto; padding: 12px 0; scrollbar-width: none;">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="categoryFilter = cat"
          :style="{
            padding: '7px 16px',
            borderRadius: '20px',
            border: categoryFilter === cat ? 'none' : '1px solid var(--border-color)',
            background: categoryFilter === cat ? 'var(--accent)' : 'transparent',
            color: categoryFilter === cat ? 'white' : 'var(--text-secondary)',
            fontWeight: categoryFilter === cat ? '600' : '500',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
            fontFamily: 'DM Sans, sans-serif'
          }"
        >{{ cat }}</button>

        <div style="margin-left: auto; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 8px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; padding: 7px 14px;">
            <v-icon size="16" style="color: var(--text-muted);">mdi-magnify</v-icon>
            <input
              v-model="searchQuery"
              placeholder="Search auctions..."
              style="border: none; background: transparent; color: var(--text-primary); font-size: 13px; outline: none; width: 180px; font-family: 'DM Sans', sans-serif;"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div style="max-width: 1280px; margin: 0 auto; padding: 32px 16px;">
      <!-- Loading -->
      <div v-if="loading" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
        <div v-for="n in 6" :key="n" class="card-clean animate-in" :style="`animation-delay: ${n * 0.06}s`">
          <v-skeleton-loader type="image" height="220" style="border-radius: 10px 10px 0 0; overflow: hidden;"></v-skeleton-loader>
          <div style="padding: 20px;">
            <v-skeleton-loader type="text, text, button" style="margin-top: 8px;"></v-skeleton-loader>
          </div>
        </div>
      </div>

      <!-- Results Count -->
      <div v-if="!loading" style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <p style="color: var(--text-muted); font-size: 14px;">
          Showing <strong style="color: var(--text-primary);">{{ filteredAuctions.length }}</strong> results
          <span v-if="searchQuery"> for "<strong style="color: var(--text-primary);">{{ searchQuery }}</strong>"</span>
        </p>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 13px; color: var(--text-muted);">Sort by:</span>
          <select v-model="sortBy" style="background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; padding: 6px 12px; color: var(--text-primary); font-size: 13px; outline: none; cursor: pointer; font-family: 'DM Sans', sans-serif;">
            <option value="newest">Ending Soon</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <!-- Auction Grid -->
      <div v-if="!loading && filteredAuctions.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
        <router-link
          v-for="(auction, i) in filteredAuctions"
          :key="auction.id"
          :to="'/auction/' + auction.id"
          class="auction-card card-clean animate-in"
          :style="`animation-delay: ${i * 0.04}s; text-decoration: none; display: block; overflow: hidden;`"
        >
          <!-- Image -->
          <div style="position: relative; aspect-ratio: 16/10; overflow: hidden; background: var(--bg-subtle);">
            <v-img :src="auction.imageUrl || placeholderImage" cover style="height: 100%;" :aspect-ratio="16/10">
              <template v-slot:placeholder>
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: var(--bg-subtle);">
                  <v-icon size="32" style="color: var(--text-placeholder);">mdi-image-outline</v-icon>
                </div>
              </template>
            </v-img>

            <!-- Category tag -->
            <div style="position: absolute; top: 12px; left: 12px;">
              <span style="background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); color: white; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.04em;">
                {{ auction.category }}
              </span>
            </div>

            <!-- Live badge -->
            <div style="position: absolute; top: 12px; right: 12px;">
              <div class="live-badge" style="background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); color: #4ade80;">
                <span class="live-dot" style="background: #4ade80;"></span>
                Live
              </div>
            </div>
          </div>

          <!-- Content -->
          <div style="padding: 18px 20px 20px;">
            <h3 style="font-family: 'DM Serif Display', serif; font-size: 18px; color: var(--text-primary); margin: 0 0 6px; line-height: 1.3; font-weight: 400;">{{ auction.title }}</h3>
            <p style="color: var(--text-muted); font-size: 13px; margin: 0 0 16px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{ auction.description }}</p>

            <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 12px;">
              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Current Bid</div>
                <div class="bid-amount" style="font-size: 22px; color: var(--text-primary); line-height: 1;">
                  ₹{{ (auction.highestBid || auction.minBid).toLocaleString() }}
                </div>
              </div>
              <div style="background: var(--accent); color: white; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; transition: background 0.15s ease;" class="bid-now-btn">
                Bid Now →
              </div>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading" style="padding: 80px 20px; text-align: center;">
        <div style="width: 72px; height: 72px; background: var(--bg-subtle); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
          <v-icon size="32" style="color: var(--text-muted);">mdi-gavel</v-icon>
        </div>
        <h3 class="font-display" style="font-size: 24px; color: var(--text-primary); margin: 0 0 8px;">No auctions found</h3>
        <p style="color: var(--text-muted); font-size: 15px; margin: 0 0 24px;">Try adjusting your search or category filter.</p>
        <button @click="categoryFilter = 'All'; searchQuery = ''" style="background: var(--accent); color: white; border: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif;">
          Clear Filters
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../services/api'

const auctions = ref([])
const loading = ref(true)
const categoryFilter = ref('All')
const searchQuery = ref('')
const sortBy = ref('newest')
const categories = ['All', 'Art', 'Watches', 'Vehicles', 'Electronics', 'Collectibles']
const placeholderImage = 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?auto=format&fit=crop&q=80&w=800'

const fetchAuctions = async () => {
  try {
    const res = await api.get('/api/auctions')
    auctions.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const filteredAuctions = computed(() => {
  let list = auctions.value.filter(a => {
    const matchCat = categoryFilter.value === 'All' || a.category === categoryFilter.value
    const matchSearch = !searchQuery.value ||
      a.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchCat && matchSearch
  })
  if (sortBy.value === 'price_low') list = [...list].sort((a, b) => (a.highestBid || a.minBid) - (b.highestBid || b.minBid))
  if (sortBy.value === 'price_high') list = [...list].sort((a, b) => (b.highestBid || b.minBid) - (a.highestBid || a.minBid))
  return list
})

onMounted(fetchAuctions)
</script>

<style scoped>
.auction-card:hover .bid-now-btn {
  background: var(--accent-hover) !important;
}
.auction-card {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  border-radius: 12px !important;
}
.auction-card:hover {
  box-shadow: var(--shadow-md) !important;
  transform: translateY(-2px);
}
</style>