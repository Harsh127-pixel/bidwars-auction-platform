<template>
  <div class="fixed-bottom-right z-100 d-flex flex-column gap-6 pointer-events-none pa-10 mb-8 mr-2">
    <TransitionGroup 
      name="toast-slide"
    >
      <v-card 
        v-for="note in notifications" 
        :key="note.id"
        variant="outlined"
        class="pointer-events-auto min-w-360 max-w-440 rounded-2xl pa-6 d-flex align-start gap-6 glass border-subtle position-relative overflow-hidden group shadow-2xl"
      >
        <!-- Type Indicator Side line -->
        <div 
          class="position-absolute left-0 top-0 bottom-0 w-2 shadow-lg"
          :class="{
            'bg-success': note.type === 'success',
            'bg-error': note.type === 'error',
            'bg-primary': note.type === 'info' || !note.type || note.type === 'primary',
            'bg-warning': note.type === 'warning'
          }"
        ></div>

        <!-- Scanner Line Animation -->
        <div class="position-absolute left-0 right-0 h-px bg-white opacity-20 scanner-line"></div>

        <!-- Icon Strategy -->
        <v-avatar 
          size="48" 
          rounded="xl"
          variant="tonal"
          :color="getTypeColor(note.type)"
          class="flex-shrink-0 shadow-sm border border-white-opacity-10"
        >
          <v-icon :icon="getTypeIcon(note.type)" size="24"></v-icon>
        </v-avatar>

        <div class="flex-grow-1 pt-1 text-left">
          <p class="text-[9px] font-weight-black text-uppercase tracking-[0.3em] text-muted-custom opacity-60 mb-2 leading-none">
            {{ formatType(note.type) }}
          </p>
          <p class="text-caption font-weight-bold text-secondary-custom leading-relaxed ma-0 italic">
            {{ note.message }}
          </p>
        </div>

        <!-- System Terminate -->
        <v-btn
          icon="mdi-close"
          size="x-small"
          variant="text"
          class="opacity-0 group-hover:opacity-100 transition-opacity text-muted-custom hover-text-error pa-0 mt-n1"
          @click="remove(note.id)"
          density="comfortable"
        ></v-btn>
      </v-card>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { notifications } from '../services/notification'

const remove = (id) => {
  const index = notifications.findIndex(n => n.id === id)
  if (index !== -1) notifications.splice(index, 1)
}

const getTypeColor = (type) => {
  if (type === 'success') return 'success'
  if (type === 'error') return 'error'
  if (type === 'warning') return 'warning'
  return 'primary'
}

const getTypeIcon = (type) => {
  if (type === 'success') return 'mdi-check-decagram'
  if (type === 'error') return 'mdi-alert-octagon-outline'
  if (type === 'warning') return 'mdi-shield-alert-outline'
  return 'mdi-satellite-variant'
}

const formatType = (type) => {
  if (!type) return 'GLOBAL SYSTEM DISPATCH'
  switch (type.toLowerCase()) {
    case 'success': return 'PROTOCOL VALIDATED'
    case 'error': return 'EXECUTION TERMINATED'
    case 'warning': return 'SECURITY ADVISORY'
    case 'info': return 'INTEL UPDATE'
    default: return `${type.toUpperCase()} DISPATCH`
  }
}
</script>

<style scoped>
.fixed-bottom-right {
  position: fixed;
  bottom: 0;
  right: 0;
}
.z-100 {
  z-index: 9999;
}
.min-w-360 {
  min-width: 360px;
}
.max-w-440 {
  max-width: 440px;
}
.w-2 {
  width: 8px;
}
.glass {
  background: rgba(var(--v-theme-surface), 0.8) !important;
  backdrop-filter: blur(24px) !important;
  -webkit-backdrop-filter: blur(24px) !important;
}
.border-subtle {
  border-color: rgba(var(--v-border-color), 0.1) !important;
}
.hover-text-error:hover {
  color: rgb(var(--v-theme-error)) !important;
}

.scanner-line {
  top: 0;
  animation: scan 3s linear infinite;
  z-index: 5;
}

@keyframes scan {
  from { top: 0; opacity: 0; }
  5% { opacity: 0.5; }
  95% { opacity: 0.5; }
  to { top: 100%; opacity: 0; }
}

/* Institutional Transitions */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(60px) scale(0.9);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.8);
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3) !important;
}
</style>
