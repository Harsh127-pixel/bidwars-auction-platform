<!-- FILE: frontend/src/components/NotificationToast.vue -->
<script setup>
import { notifications } from '../services/notification'

const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }
const remove = (id) => {
  const i = notifications.findIndex(n => n.id === id)
  if (i !== -1) notifications.splice(i, 1)
}
</script>

<template>
  <div class="toast-wrap">
    <TransitionGroup name="toast">
      <div v-for="n in notifications" :key="n.id" class="toast" :class="`toast--${n.type}`">
        <div class="toast__icon">{{ icons[n.type] || 'ℹ' }}</div>
        <div class="toast__msg">{{ n.message }}</div>
        <button class="toast__close" @click="remove(n.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-wrap {
  position: fixed;
  bottom: 24px; right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  max-width: 360px;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-raised);
  border-radius: var(--r-md);
  border-left: 3px solid;
  box-shadow: var(--shadow-lg);
}

.toast--success { border-color: var(--green); }
.toast--error   { border-color: var(--red); }
.toast--warning { border-color: var(--orange); }
.toast--info    { border-color: var(--blue); }

.toast__icon {
  width: 22px; height: 22px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  flex-shrink: 0;
}
.toast--success .toast__icon { background: var(--green-dim); color: var(--green); }
.toast--error   .toast__icon { background: var(--red-dim);   color: var(--red); }
.toast--warning .toast__icon { background: var(--orange-dim);color: var(--orange); }
.toast--info    .toast__icon { background: var(--blue-dim);  color: var(--blue); }

.toast__msg { flex: 1; font-size: 13px; color: var(--text); line-height: 1.5; }

.toast__close {
  background: none; border: none; cursor: pointer;
  color: var(--text-3); font-size: 11px;
  padding: 2px; flex-shrink: 0;
  transition: color 0.15s;
}
.toast__close:hover { color: var(--text); }

.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to   { opacity: 0; transform: translateY(6px) scale(0.97); }
</style>