<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="mb-12">
      <h1 class="text-4xl font-black tracking-tight">Admin Control Panel</h1>
      <p class="text-secondary-custom mt-2">Manage auctions, users, and credits.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <!-- Create Auction Form -->
      <div class="bg-surface rounded-3xl p-8 border border-subtle-custom shadow-sm transition-colors duration-300">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-9-4h18c1.104 0 2 .896 2 2v10c0 1.104-.896 2-2 2H3c-1.104 0-2-.896-2-2V7c0-1.104.896-2 2-2z" />
          </svg>
          Create New Auction
        </h2>
        
        <form @submit.prevent="createAuction" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-muted-custom uppercase mb-1">Item Title</label>
            <input v-model="form.title" type="text" class="w-full bg-base border border-subtle-custom rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-muted-custom/50" placeholder="e.g. Rare 1950s Camera" required>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-muted-custom uppercase mb-1">Category</label>
              <select v-model="form.category" class="w-full bg-base border border-subtle-custom rounded-xl p-3 outline-none">
                <option>Electronics</option>
                <option>Watches</option>
                <option>Art</option>
                <option>Vehicles</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-muted-custom uppercase mb-1">Minimum Bid (₹)</label>
              <input v-model="form.minBid" type="number" class="w-full bg-base border border-subtle-custom rounded-xl p-3 outline-none" required>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-muted-custom uppercase mb-1 pr-2 flex justify-between">
              Description 
              <button type="button" @click="generateAI" class="text-indigo-600 dark:text-indigo-400 text-[10px] hover:underline">✨ Generate with AI</button>
            </label>
            <textarea v-model="form.description" rows="4" class="w-full bg-base border border-subtle-custom rounded-xl p-3 outline-none placeholder:text-muted-custom/50" placeholder="Tell bidders about this item..." required></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div>
               <label class="block text-xs font-bold text-muted-custom uppercase mb-1">Image URL</label>
               <input v-model="form.imageUrl" type="text" class="w-full bg-base border border-subtle-custom rounded-xl p-3 outline-none" placeholder="https://...">
             </div>
             <div>
               <label class="block text-xs font-bold text-muted-custom uppercase mb-1">End Time</label>
               <input v-model="form.endTime" type="datetime-local" class="w-full bg-base border border-subtle-custom rounded-xl p-3 outline-none" required>
             </div>
          </div>

          <button type="submit" :disabled="loading" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-95">
            {{ loading ? 'Creating...' : 'Launch Auction' }}
          </button>
        </form>
      </div>

      <!-- User Credit Management & System Status -->
      <div class="space-y-6">
        <div class="bg-surface rounded-3xl p-8 border border-subtle-custom shadow-sm">
          <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Assign Credits
          </h2>
          <div class="flex flex-col sm:flex-row gap-4">
            <input v-model="creditForm.userId" type="text" class="flex-grow bg-base border border-subtle-custom rounded-xl p-3 outline-none" placeholder="User ID">
            <input v-model="creditForm.amount" type="number" class="w-full sm:w-32 bg-base border border-subtle-custom rounded-xl p-3 outline-none" placeholder="Amount">
            <button @click="updateCredits" class="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-green-100 dark:shadow-none">Add</button>
          </div>
        </div>

        <!-- System Alerts -->
        <div class="bg-surface rounded-3xl p-8 border border-subtle-custom">
           <p class="text-[10px] text-muted-custom font-bold uppercase tracking-widest mb-4">Live System Feed</p>
           <ul class="space-y-3 text-sm">
             <li class="flex items-center gap-3 text-green-500">
               <span class="w-2 h-2 bg-green-500 rounded-full"></span>
               Database connected successfully
             </li>
             <li class="flex items-center gap-3 text-secondary-custom">
               <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
               Listening for real-time bids...
             </li>
           </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { API_BASE_URL } from '../config/api'

const loading = ref(false)
const form = reactive({
  title: '',
  description: '',
  category: 'Electronics',
  minBid: 0,
  imageUrl: '',
  endTime: ''
})

const creditForm = reactive({
  userId: '',
  amount: 0
})

const generateAI = async () => {
  if (!form.title) return alert('Enter a title first')
  try {
    const res = await axios.post(`${API_BASE_URL}/api/generateDescription`, {
      itemName: form.title,
      features: form.category
    })
    form.description = res.data.description
  } catch (err) {
    alert('AI Generation failed')
  }
}

const createAuction = async () => {
  loading.value = true
  try {
    await axios.post(`${API_BASE_URL}/api/createAuction`, form)
    alert('Auction created successfully!')
    Object.assign(form, { title: '', description: '', minBid: 0, imageUrl: '', endTime: '' })
  } catch (err) {
    alert('Failed to create auction')
  } finally {
    loading.value = false
  }
}

const updateCredits = async () => {
  try {
    await axios.post(`${API_BASE_URL}/api/admin/updateCredits`, {
      userId: creditForm.userId,
      credits: creditForm.amount
    })
    alert('Credits updated!')
  } catch (err) {
    alert('Credit update failed')
  }
}
</script>
