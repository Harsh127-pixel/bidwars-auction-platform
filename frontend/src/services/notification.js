import { reactive } from 'vue'

export const notifications = reactive([])

export const useNotification = () => {
  const add = (message, type = 'info', duration = 4000) => {
    const id = Date.now()
    notifications.push({ id, message, type })
    
    setTimeout(() => {
      const index = notifications.findIndex(n => n.id === id)
      if (index !== -1) notifications.splice(index, 1)
    }, duration)
  }

  return { add }
}
