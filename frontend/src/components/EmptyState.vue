<!-- FILE: frontend/src/components/EmptyState.vue -->
<script setup>
defineProps({
  icon: { type: String, default: '◇' },
  title: String,
  subtitle: String
})
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__icon">{{ icon }}</div>
    <div class="empty-state__title t-display">{{ title }}</div>
    <div v-if="subtitle" class="empty-state__sub">{{ subtitle }}</div>
    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  padding: 64px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-state__icon { font-size: 40px; opacity: 0.2; }
.empty-state__title { font-size: 20px !important; color: var(--text-2); }
.empty-state__sub { font-size: 14px; color: var(--text-3); max-width: 360px; }
</style>