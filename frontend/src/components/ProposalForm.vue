// FILE: frontend/src/components/ProposalForm.vue
<template>
  <div class="proposal-form">
    <h3>Submit Proposal</h3>
    <form @submit.prevent="submitProposal">
      <div class="field-wrap">
        <label class="field-label">Title *</label>
        <input v-model="proposal.title" required class="field" placeholder="Proposal title" />
      </div>
      <div class="field-wrap">
        <label class="field-label">Description *</label>
        <textarea v-model="proposal.description" required class="field" rows="4" placeholder="Describe your proposal"></textarea>
      </div>
      <div class="field-wrap">
        <label class="field-label">Category</label>
        <select v-model="proposal.category" class="field">
          <option value="feature">New Feature</option>
          <option value="bug">Bug Fix</option>
          <option value="improvement">Improvement</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="field-wrap">
        <label class="field-label">Budget (₹)</label>
        <input v-model.number="proposal.budget" type="number" min="0" class="field" placeholder="Optional budget" />
      </div>
      <button type="submit" class="btn btn-gold" :disabled="loading">
        {{ loading ? 'Submitting...' : 'Submit Proposal' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../services/api'
import { useNotification } from '../services/notification'

const emit = defineEmits(['proposalSubmitted'])
const notification = useNotification()

const proposal = ref({
  title: '',
  description: '',
  category: 'feature',
  budget: null
})
const loading = ref(false)

const submitProposal = async () => {
  if (!proposal.value.title || !proposal.value.description) return
  
  loading.value = true
  try {
    await api.post('/api/proposals', proposal.value)
    notification.add('Proposal submitted successfully!', 'success')
    proposal.value = { title: '', description: '', category: 'feature', budget: null }
    emit('proposalSubmitted')
  } catch (error) {
    notification.add('Failed to submit proposal', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.proposal-form {
  padding: 20px;
  background: var(--card-bg);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.proposal-form h3 {
  margin-bottom: 16px;
  color: var(--text-1);
}
</style>