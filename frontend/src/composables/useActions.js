// FILE: src/composables/useAuctions.js
import { ref, computed } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'

export function useAuctions() {
  const authStore = useAuthStore()
  const notification = useNotification()

  const auctions = ref([])
  const watchlistIds = ref([])
  const loading = ref(true)
  const search = ref('')
  const category = ref('All')
  const sortBy = ref('newest')

  const categories = ['All', 'Art', 'Watches', 'Vehicles', 'Electronics', 'Collectibles']

  const filtered = computed(() => {
    let list = auctions.value.filter(a => {
      const matchCat = category.value === 'All' || a.category === category.value
      const q = search.value.toLowerCase()
      const matchSearch = !q || a.title.toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q)
      return matchCat && matchSearch
    })
    if (sortBy.value === 'price_asc')  list = [...list].sort((a, b) => (a.highestBid || a.minBid) - (b.highestBid || b.minBid))
    if (sortBy.value === 'price_desc') list = [...list].sort((a, b) => (b.highestBid || b.minBid) - (a.highestBid || a.minBid))
    return list
  })

  const fetchAuctions = async () => {
    loading.value = true
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
    if (!authStore.user) { notification.add('Sign in to use watchlist', 'info'); return }
    try {
      const res = await api.post(`/api/watchlist/toggle/${id}`)
      if (res.data.watched) watchlistIds.value.push(id)
      else watchlistIds.value = watchlistIds.value.filter(w => w !== id)
    } catch {}
  }

  return {
    auctions, watchlistIds, loading, search, category, sortBy,
    categories, filtered,
    fetchAuctions, fetchWatchlist, toggleWatch
  }
}