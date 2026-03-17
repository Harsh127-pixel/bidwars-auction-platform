// FILE: frontend/src/services/notification.js
// Lightweight reactive toast system.
// Usage: import { useNotification } from '../services/notification'
//        const n = useNotification()
//        n.add('Something happened', 'success') // type: success | error | warning | info
//
// NotificationToast.vue reads the same `notifications` array and renders them.

import { reactive } from 'vue'

export const notifications = reactive([])

let _idCounter = 0

export function useNotification() {
  const add = (message, type = 'info', duration = 4000) => {
    const id = ++_idCounter
    notifications.push({ id, message, type })

    if (duration > 0) {
      setTimeout(() => {
        const i = notifications.findIndex(n => n.id === id)
        if (i !== -1) notifications.splice(i, 1)
      }, duration)
    }
  }

  return {
    add,
    success: (msg, dur)  => add(msg, 'success', dur),
    error:   (msg, dur)  => add(msg, 'error',   dur),
    warning: (msg, dur)  => add(msg, 'warning',  dur),
    info:    (msg, dur)  => add(msg, 'info',    dur),
  }
}