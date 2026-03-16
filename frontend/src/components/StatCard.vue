<!-- FILE: frontend/src/components/StatCard.vue -->
<script setup>
defineProps({
  label: String,
  value: [String, Number],
  sub: String,
  icon: String,
  accent: { type: String, default: 'gold' } // gold | green | red | blue
})
</script>

<template>
  <div class="stat-card" :class="`stat-card--${accent}`">
    <div class="stat-card__top">
      <span class="t-label">{{ label }}</span>
      <span v-if="icon" class="stat-card__icon">{{ icon }}</span>
    </div>
    <div class="stat-card__value t-display">{{ value }}</div>
    <div v-if="sub" class="stat-card__sub">{{ sub }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 22px 24px;
}
.stat-card--gold  { border-color: var(--gold-border); }
.stat-card--green { border-color: rgba(74,222,128,0.2); }
.stat-card--red   { border-color: rgba(248,113,113,0.2); }
.stat-card--blue  { border-color: rgba(96,165,250,0.2); }

.stat-card__top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.stat-card__icon { font-size: 20px; }
.stat-card__value { font-size: 32px !important; margin-bottom: 4px; }
.stat-card__sub { font-size: 13px; color: var(--text-2); }
</style>