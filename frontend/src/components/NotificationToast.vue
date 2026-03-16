<template>
  <div style="position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; max-width: 360px; width: calc(100vw - 48px);">
    <TransitionGroup name="toast">
      <div
        v-for="note in notifications"
        :key="note.id"
        style="pointer-events: auto; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: var(--shadow-lg);"
        :style="{ borderLeftWidth: '3px', borderLeftColor: getColor(note.type) }"
      >
        <!-- Icon -->
        <div :style="{ width: '32px', height: '32px', borderRadius: '8px', background: getSoftColor(note.type), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
          <v-icon size="16" :style="{ color: getColor(note.type) }">{{ getIcon(note.type) }}</v-icon>
        </div>

        <!-- Content -->
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;" :style="{ color: getColor(note.type) }">
            {{ getLabel(note.type) }}
          </div>
          <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">{{ note.message }}</div>
        </div>

        <!-- Close -->
        <button @click="remove(note.id)" style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 2px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: color 0.15s;" @mouseover="$event.target.style.color = 'var(--text-primary)'" @mouseleave="$event.target.style.color = 'var(--text-muted)'">
          <v-icon size="14">mdi-close</v-icon>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { notifications } from '../services/notification'

const remove = (id) => {
  const i = notifications.findIndex(n => n.id === id)
  if (i !== -1) notifications.splice(i, 1)
}

const getColor = (type) => {
  if (type === 'success') return 'var(--success)'
  if (type === 'error') return '#E53E3E'
  if (type === 'warning') return 'var(--warning)'
  return 'var(--info)'
}

const getSoftColor = (type) => {
  if (type === 'success') return 'var(--success-soft)'
  if (type === 'error') return '#FEF2F2'
  if (type === 'warning') return 'var(--warning-soft)'
  return 'var(--info-soft)'
}

const getIcon = (type) => {
  if (type === 'success') return 'mdi-check-circle-outline'
  if (type === 'error') return 'mdi-alert-circle-outline'
  if (type === 'warning') return 'mdi-alert-outline'
  return 'mdi-information-outline'
}

const getLabel = (type) => {
  if (type === 'success') return 'Success'
  if (type === 'error') return 'Error'
  if (type === 'warning') return 'Warning'
  return 'Info'
}
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(24px); }
.toast-leave-to { opacity: 0; transform: translateY(8px) scale(0.96); }
</style>