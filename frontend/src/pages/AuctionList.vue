<!-- FILE: frontend/src/pages/AuctionList.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'
import AuctionCard from '../components/AuctionCard.vue'

const authStore    = useAuthStore()
const notification = useNotification()
const auctions     = ref([])
const watchlistIds = ref([])
const loading      = ref(true)
const search       = ref('')
const category     = ref('All')
const sortBy       = ref('newest')
const viewMode     = ref('grid') // grid | list

const categories = ['All', 'Art', 'Watches', 'Vehicles', 'Electronics', 'Collectibles']

const fetchAuctions = async () => {
  try {
    const res = await api.get('/api/auctions')
    auctions.value = res.data
  } catch { notification.add('Failed to load auctions', 'error') }
  finally { loading.value = false }
}

const fetchWatchlist = async () => {
  if (!authStore.user) return
  try {
    const res = await api.get('/api/watchlist')
    watchlistIds.value = res.data.map(a => a.id)
  } catch {}
}

const toggleWatch = async (id) => {
  if (!authStore.user) return notification.add('Sign in to use watchlist', 'info')
  try {
    const res = await api.post(`/api/watchlist/toggle/${id}`)
    if (res.data.watched) watchlistIds.value.push(id)
    else watchlistIds.value = watchlistIds.value.filter(w => w !== id)
  } catch {}
}

const filtered = computed(() => {
  let list = auctions.value.filter(a => {
    const matchCat    = category.value === 'All' || a.category === category.value
    const q           = search.value.toLowerCase()
    const matchSearch = !q || a.title.toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q)
    return matchCat && matchSearch
  })
  if (sortBy.value === 'price_asc')  list = [...list].sort((a,b) => (a.highestBid||a.minBid) - (b.highestBid||b.minBid))
  if (sortBy.value === 'price_desc') list = [...list].sort((a,b) => (b.highestBid||b.minBid) - (a.highestBid||a.minBid))
  return list
})

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

onMounted(() => { fetchAuctions(); fetchWatchlist() })
</script>

<template>
  <div class="list-page">

    <!-- HERO BAR -->
    <div class="list-hero">
      <div class="list-hero__glow"></div>
      <div class="page-wrap list-hero__inner">
        <div>
          <div class="hero-eyebrow">
            <span class="live-dot"></span> Live Now
          </div>
          <h1 class="hero-title">Auctions</h1>
        </div>
        <div class="hero-meta">
          <div class="hero-stat">
            <div class="hero-stat__val">{{ auctions.length }}</div>
            <div class="hero-stat__label">Active Lots</div>
          </div>
          <div class="hero-stat__div"></div>
          <div class="hero-stat">
            <div class="hero-stat__val">{{ fmt(auctions.reduce((s,a) => s + (a.highestBid||a.minBid||0), 0)) }}</div>
            <div class="hero-stat__label">Total Value</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-wrap list-body">

      <!-- FILTER BAR -->
      <div class="filter-bar fade-up">
        <!-- Category pills -->
        <div class="cat-pills">
          <button v-for="cat in categories" :key="cat"
            class="cat-pill" :class="{'cat-pill--on': category === cat}"
            @click="category = cat">
            {{ cat }}
          </button>
        </div>
        <!-- Controls -->
        <div class="filter-controls">
          <div class="search-wrap">
            <span class="search-icon">⌕</span>
            <input v-model="search" type="text" placeholder="Search lots…" class="search-input" />
            <button v-if="search" class="search-clear" @click="search = ''">✕</button>
          </div>
          <select v-model="sortBy" class="sort-select">
            <option value="newest">Newest</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
          <div class="view-toggle">
            <button class="view-btn" :class="{'view-btn--on': viewMode==='grid'}" @click="viewMode='grid'" title="Grid">⊞</button>
            <button class="view-btn" :class="{'view-btn--on': viewMode==='list'}" @click="viewMode='list'" title="List">☰</button>
          </div>
        </div>
      </div>

      <!-- RESULT COUNT -->
      <div class="result-count fade-up">
        <span>{{ filtered.length }} lot{{ filtered.length !== 1 ? 's' : '' }}</span>
        <span v-if="search" class="result-query"> matching "{{ search }}"</span>
        <button v-if="search || category !== 'All'" class="clear-btn" @click="search=''; category='All'">
          Clear filters ✕
        </button>
      </div>

      <!-- SKELETON -->
      <div v-if="loading" class="auction-grid">
        <div v-for="n in 6" :key="n" class="skel-card" :style="`animation-delay:${n*0.06}s`"></div>
      </div>

      <!-- GRID / LIST -->
      <TransitionGroup v-else-if="filtered.length"
        :class="viewMode === 'grid' ? 'auction-grid' : 'auction-list'"
        name="card" tag="div">
        <AuctionCard
          v-for="(auction, i) in filtered"
          :key="auction.id"
          :auction="auction"
          :watched="watchlistIds.includes(auction.id)"
          :style="`animation-delay:${i * 0.04}s`"
          class="fade-up"
          @toggle-watch="toggleWatch"
        />
      </TransitionGroup>

      <!-- EMPTY -->
      <div v-else class="empty-state">
        <div class="empty-state__icon">◈</div>
        <div class="empty-state__title">No lots found</div>
        <div class="empty-state__sub">Try adjusting your search or category filter</div>
        <button class="btn-clear" @click="category='All'; search=''">Clear all filters</button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.list-page { min-height: 100vh; background: var(--bg); }

/* HERO */
.list-hero { position: relative; overflow: hidden; padding: 40px 0 44px; }
.list-hero__glow {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 60% 100% at 5% 50%, rgba(251,146,60,0.07) 0%, transparent 60%);
}
.list-hero__inner {
  position: relative; display: flex; align-items: center;
  justify-content: space-between; gap: 24px; flex-wrap: wrap;
}
.hero-eyebrow {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--orange); margin-bottom: 10px;
}
.hero-title {
  font-family: var(--font-display); font-size: clamp(32px, 5vw, 56px);
  font-weight: 600; color: var(--text); line-height: 1;
  animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes slideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

.hero-meta { display: flex; align-items: center; gap: 24px; }
.hero-stat__val { font-family: var(--font-display); font-size: 28px; color: var(--text); line-height: 1; }
.hero-stat__label { font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }
.hero-stat__div { width: 1px; height: 40px; background: var(--border); }

/* BODY */
.list-body { padding-bottom: 64px; }

/* FILTER BAR */
.filter-bar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; margin-bottom: 16px; flex-wrap: wrap;
}
.cat-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.cat-pill {
  padding: 6px 16px; border-radius: 20px; border: 1px solid var(--border-md);
  background: transparent; color: var(--text-2);
  font-family: var(--font-body); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.cat-pill:hover { background: var(--bg-hover); color: var(--text); }
.cat-pill--on { background: var(--orange-dim); border-color: rgba(251,146,60,0.3); color: var(--orange); }

.filter-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.search-wrap { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 12px; color: var(--text-3); font-size: 16px; pointer-events: none; }
.search-input {
  padding: 8px 36px 8px 34px; background: var(--bg-card);
  border: 1px solid var(--border-md); border-radius: 10px;
  color: var(--text); font-family: var(--font-body); font-size: 14px;
  outline: none; width: 200px; transition: border-color 0.15s;
}
.search-input::placeholder { color: var(--text-3); }
.search-input:focus { border-color: var(--orange); }
.search-clear {
  position: absolute; right: 10px; background: none; border: none;
  color: var(--text-3); font-size: 12px; cursor: pointer; padding: 2px;
}
.sort-select {
  padding: 8px 14px; background: var(--bg-card); border: 1px solid var(--border-md);
  border-radius: 10px; color: var(--text); font-family: var(--font-body); font-size: 14px;
  outline: none; cursor: pointer;
}
.view-toggle { display: flex; border: 1px solid var(--border-md); border-radius: 10px; overflow: hidden; }
.view-btn {
  width: 36px; height: 36px; background: var(--bg-card); border: none;
  color: var(--text-3); font-size: 16px; cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.view-btn:hover { background: var(--bg-hover); color: var(--text); }
.view-btn--on { background: var(--orange-dim); color: var(--orange); }

/* RESULT COUNT */
.result-count {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  font-size: 13px; color: var(--text-3); margin-bottom: 24px;
}
.result-query { color: var(--text-2); }
.clear-btn {
  background: none; border: none; color: var(--orange); font-family: var(--font-body);
  font-size: 12px; font-weight: 600; cursor: pointer; padding: 0;
}
.clear-btn:hover { color: #f97316; }

/* GRID */
.auction-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
/* LIST MODE */
.auction-list { display: flex; flex-direction: column; gap: 12px; }
.auction-list :deep(.auction-card) { display: flex; flex-direction: row; }
.auction-list :deep(.auction-card__image) { width: 200px; flex-shrink: 0; aspect-ratio: auto; height: 140px; }
.auction-list :deep(.auction-card__body) { flex: 1; }

/* SKELETON */
.skel-card {
  height: 340px; background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 16px; animation: shimmer 1.6s ease infinite;
}
@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}

/* Card transition */
.card-enter-active { transition: all 0.3s ease; }
.card-enter-from   { opacity: 0; transform: translateY(12px); }

/* EMPTY */
.empty-state { padding: 80px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.empty-state__icon  { font-size: 40px; opacity: 0.2; }
.empty-state__title { font-family: var(--font-display); font-size: 22px; color: var(--text-2); }
.empty-state__sub   { font-size: 14px; color: var(--text-3); }
.btn-clear {
  margin-top: 16px; padding: 10px 24px;
  background: var(--orange-dim); border: 1px solid rgba(251,146,60,0.3);
  border-radius: 10px; color: var(--orange); font-family: var(--font-body);
  font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.btn-clear:hover { background: var(--orange); color: #fff; }

@media (max-width: 640px) {
  .hero-meta { display: none; }
  .filter-bar { flex-direction: column; align-items: flex-start; }
  .filter-controls { width: 100%; }
  .search-input { width: 100%; }
  .view-toggle { display: none; }
  .auction-list :deep(.auction-card) { flex-direction: column; }
  .auction-list :deep(.auction-card__image) { width: 100%; height: auto; aspect-ratio: 16/10; }
}
</style>