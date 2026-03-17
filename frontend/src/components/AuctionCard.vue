<!-- FILE: frontend/src/components/AuctionCard.vue -->
<script setup>
defineProps({
  auction: { type: Object, required: true },
  watched: { type: Boolean, default: false }
})
defineEmits(['toggle-watch'])

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
const fmtDate = (ts) => {
  if (!ts) return ''
  const d = ts?._seconds ? new Date(ts._seconds * 1000) : new Date(ts)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <router-link :to="'/auction/' + auction.id" class="auction-card">
    <div class="auction-card__image">
      <img :src="auction.imageUrl || 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?w=600&q=80'"
           :alt="auction.title" loading="lazy" />
      <div class="auction-card__image-overlay">
        <span class="badge badge-live"><span class="live-dot"></span>Live</span>
        <button class="watch-btn" @click.prevent="$emit('toggle-watch', auction.id)"
          :class="{ 'watch-btn--active': watched }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              :fill="watched ? '#F87171' : 'none'" :stroke="watched ? '#F87171' : 'rgba(255,255,255,0.6)'" stroke-width="2"/>
          </svg>
        </button>
      </div>
      <div class="auction-card__category t-label">{{ auction.category }}</div>
    </div>
    <div class="auction-card__body">
      <h3 class="auction-card__title t-display">{{ auction.title }}</h3>
      <p class="auction-card__desc">{{ auction.description }}</p>
      <div class="auction-card__date">Listed on {{ fmtDate(auction.createdAt) }}</div>
      <div class="auction-card__footer">
        <div>
          <div class="t-label" style="margin-bottom:4px">Current Bid</div>
          <div class="auction-card__price">{{ fmt(auction.highestBid || auction.minBid) }}</div>
        </div>
        <div class="auction-card__cta">Bid Now →</div>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.auction-card {
  display: block;
  text-decoration: none;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.auction-card:hover {
  border-color: var(--gold-border);
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

.auction-card__image {
  position: relative;
  aspect-ratio: 16/10;
  overflow: hidden;
  background: var(--bg-raised);
}
.auction-card__image img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.auction-card:hover .auction-card__image img { transform: scale(1.04); }

.auction-card__image-overlay {
  position: absolute; inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px;
}

.watch-btn {
  width: 32px; height: 32px;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  border: none; border-radius: 50%;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.watch-btn:hover { background: rgba(0,0,0,0.7); }

.auction-card__category {
  position: absolute;
  bottom: 12px; left: 12px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  color: var(--text-2) !important;
  padding: 3px 10px;
  border-radius: 20px;
}

.auction-card__body { padding: 18px 20px 20px; }

.auction-card__title {
  font-size: 17px !important;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.auction-card__desc {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.auction-card__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.auction-card__price {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--text);
}

.auction-card__date {
  font-size: 11px;
  color: var(--text-3);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.auction-card__cta {
  padding: 8px 16px;
  background: var(--gold-dim);
  color: var(--gold);
  border: 1px solid var(--gold-border);
  border-radius: var(--r-md);
  font-size: 13px;
  font-weight: 600;
  transition: background 0.15s;
}
.auction-card:hover .auction-card__cta {
  background: var(--gold);
  color: var(--text-inv);
}
</style>