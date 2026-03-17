<!-- FILE: frontend/src/pages/Sell.vue -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { useNotification } from '../services/notification'
import PageHeader from '../components/PageHeader.vue'
import MediaUpload from '../components/MediaUpload.vue'

const router = useRouter()
const notification = useNotification()
const loading = ref(false)

const proposal = ref({
  title: '',
  description: '',
  category: 'Collectibles',
  startingPrice: 500,
  duration: 24,
  imageUrl: '',
  type: 'listing' // Crucial to distinguish from general proposals
})

const categories = ['Art', 'Watches', 'Vehicles', 'Electronics', 'Collectibles', 'Rare Items', 'Jewelry']

const submitProposal = async () => {
  if (!proposal.value.title || !proposal.value.description) {
    return notification.add('Please fill in required fields', 'error')
  }

  loading.value = true
  try {
    await api.post('/api/proposals', proposal.value)
    notification.add('Listing proposal submitted for admin approval!', 'success')
    router.push('/dashboard')
  } catch (error) {
    notification.add('Failed to submit listing: ' + (error.response?.data?.error || error.message), 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-content">
    <div class="page-wrap narrow">
      <div class="sell-header fade-up">
        <h1 class="t-display t-title">List Your Asset</h1>
        <p class="t-body" style="color:var(--text-2);max-width:500px">
          Convert your rare collectibles or high-value items into liquidity. Your listing will be reviewed by our arbitration unit within 24 hours.
        </p>
      </div>

      <div class="card fade-up fade-up-1" style="padding:32px">
        <form @submit.prevent="submitProposal" class="sell-form">
          <div class="field-wrap">
            <label class="field-label">Asset Title *</label>
            <input v-model="proposal.title" required class="field" placeholder="e.g. 1964 Vintage Patek Philippe" />
          </div>

          <div class="field-wrap">
            <label class="field-label">Detailed Description *</label>
            <textarea v-model="proposal.description" required class="field" rows="5" placeholder="Include history, condition, and any notable features..."></textarea>
          </div>

          <div class="grid-2">
            <div class="field-wrap">
              <label class="field-label">Category</label>
              <select v-model="proposal.category" class="field">
                <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="field-wrap">
              <label class="field-label">Starting Price (₹) *</label>
              <input v-model.number="proposal.startingPrice" type="number" min="1" required class="field" />
            </div>
          </div>

          <div class="grid-2">
            <div class="field-wrap">
              <label class="field-label">Auction Duration (Hours) *</label>
              <select v-model.number="proposal.duration" class="field">
                <option :value="12">12 Hours</option>
                <option :value="24">24 Hours (1 Day)</option>
                <option :value="48">48 Hours (2 Days)</option>
                <option :value="72">72 Hours (3 Days)</option>
                <option :value="168">1 Week</option>
              </select>
            </div>
            <MediaUpload v-model="proposal.imageUrl" label="Asset Image" />
          </div>

          <div class="info-note">
            <span class="info-icon">🛈</span>
            Once approved, your item will be listed on the live bidding floor. A platform fee of 2.5% applies only upon successful sale.
          </div>

          <div style="display:flex;gap:16px;margin-top:12px">
            <button type="submit" class="btn btn-gold btn-lg" :disabled="loading" style="flex:1">
              {{ loading ? 'Submitting Proposal...' : 'Submit for Review' }}
            </button>
            <button type="button" class="btn btn-ghost btn-lg" @click="router.back()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.narrow { max-width: 800px; margin: 0 auto; }
.sell-header { margin-bottom: 32px; text-align: center; display: flex; flex-direction: column; align-items: center; }
.sell-form { display: flex; flex-direction: column; gap: 24px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.info-note { background: var(--bg-raised); border-left: 3px solid var(--gold); padding: 16px; font-size: 13px; color: var(--text-2); display: flex; gap: 12px; align-items: flex-start; border-radius: 4px; }
.info-icon { font-size: 16px; color: var(--gold); line-height: 1; }

@media (max-width: 600px) {
  .grid-2 { grid-template-columns: 1fr; }
}
</style>
