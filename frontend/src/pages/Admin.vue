<template>
  <div style="background: var(--bg-page); min-height: 100vh; padding: 32px 16px;">
    <div style="max-width: 1280px; margin: 0 auto;">

      <!-- Header -->
      <div class="animate-in" style="margin-bottom: 32px; display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--accent-soft); color: var(--accent); padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">
            <v-icon size="12">mdi-shield-crown-outline</v-icon>
            Admin Panel
          </div>
          <h1 class="font-display" style="font-size: 36px; color: var(--text-primary); margin: 0 0 8px; font-weight: 400;">Auction Management</h1>
          <p style="color: var(--text-secondary); font-size: 15px; margin: 0;">Create and manage all platform auctions</p>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; background: var(--success-soft); border: 1px solid var(--success); padding: 10px 16px; border-radius: 10px;">
          <span class="live-dot" style="background: var(--success);"></span>
          <span style="font-size: 13px; color: var(--success); font-weight: 600;">System Online</span>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display: flex; gap: 4px; margin-bottom: 28px; background: var(--bg-card); padding: 4px; border-radius: 10px; border: 1px solid var(--border-color); width: fit-content;" class="animate-in animate-in-delay-1">
        <button
          v-for="t in tabs"
          :key="t.value"
          @click="tab = t.value"
          :style="{
            padding: '8px 20px',
            borderRadius: '7px',
            border: 'none',
            background: tab === t.value ? 'var(--bg-page)' : 'transparent',
            color: tab === t.value ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: tab === t.value ? '600' : '500',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: tab === t.value ? 'var(--shadow-sm)' : 'none',
            display: 'flex', alignItems: 'center', gap: '6px'
          }"
        >
          <v-icon size="15">{{ t.icon }}</v-icon>
          {{ t.label }}
        </button>
      </div>

      <!-- Create Auction Tab -->
      <div v-if="tab === 'create'" class="animate-in animate-in-delay-2">
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; max-width: 720px;">
          <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color);">
            <h2 style="font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text-primary); margin: 0 0 4px; font-weight: 400;">Create New Auction</h2>
            <p style="font-size: 13px; color: var(--text-muted); margin: 0;">Add a new item to the live marketplace</p>
          </div>
          <div style="padding: 28px 24px;">
            <form @submit.prevent="createAuction" style="display: flex; flex-direction: column; gap: 20px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Item Title *</label>
                  <input v-model="newAuction.title" required placeholder="e.g. Vintage Rolex Submariner" style="width: 100%; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif;" />
                </div>
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Category *</label>
                  <select v-model="newAuction.category" style="width: 100%; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none; cursor: pointer; font-family: 'DM Sans', sans-serif;">
                    <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
                  </select>
                </div>
              </div>

              <div>
                <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Description *</label>
                <textarea v-model="newAuction.description" rows="4" placeholder="Describe the item in detail..." style="width: 100%; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none; resize: vertical; font-family: 'DM Sans', sans-serif; line-height: 1.6;"></textarea>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Starting Bid (₹) *</label>
                  <input v-model.number="newAuction.minBid" type="number" min="1" placeholder="50000" style="width: 100%; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif;" />
                </div>
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Image URL</label>
                  <input v-model="newAuction.imageUrl" placeholder="https://..." style="width: 100%; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif;" />
                </div>
              </div>

              <div style="padding-top: 4px; display: flex; align-items: center; gap: 12px;">
                <button type="submit" :disabled="submitting" style="background: var(--accent); color: white; border: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 8px; transition: background 0.15s;">
                  <v-progress-circular v-if="submitting" size="16" width="2" indeterminate color="white"></v-progress-circular>
                  <v-icon v-else size="16">mdi-plus</v-icon>
                  {{ submitting ? 'Creating...' : 'Create Auction' }}
                </button>
                <span style="font-size: 12px; color: var(--text-muted);">* Required fields</span>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Manage Auctions Tab -->
      <div v-if="tab === 'auctions'" class="animate-in animate-in-delay-2">
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
          <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
            <h2 style="font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text-primary); margin: 0; font-weight: 400;">Active Auctions ({{ auctions.length }})</h2>
            <button @click="fetchData" style="background: var(--bg-elevated); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 8px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 6px;">
              <v-icon size="14">mdi-refresh</v-icon> Refresh
            </button>
          </div>
          <table style="width: 100%; border-collapse: collapse;" class="clean-table">
            <thead>
              <tr>
                <th style="text-align: left;">Item</th>
                <th style="text-align: right;">Current Bid</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in auctions" :key="a.id">
                <td>
                  <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 56px; height: 42px; border-radius: 8px; overflow: hidden; background: var(--bg-subtle); flex-shrink: 0;">
                      <v-img :src="a.imageUrl || placeholder" cover style="width: 100%; height: 100%;"></v-img>
                    </div>
                    <div>
                      <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">{{ a.title }}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">{{ a.category }} · {{ a.id.slice(0,10).toUpperCase() }}</div>
                    </div>
                  </div>
                </td>
                <td style="text-align: right;">
                  <span class="bid-amount" style="font-size: 16px; color: var(--text-primary);">₹{{ (a.highestBid || a.minBid).toLocaleString() }}</span>
                </td>
                <td style="text-align: center;">
                  <span class="live-badge" style="display: inline-flex;"><span class="live-dot"></span>Live</span>
                </td>
                <td style="text-align: right;">
                  <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                    <router-link :to="'/auction/' + a.id" style="background: var(--bg-elevated); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 6px 12px; border-radius: 7px; font-size: 12px; font-weight: 600; text-decoration: none;">View</router-link>
                    <button @click="closeAuction(a.id)" style="background: var(--warning-soft); color: var(--warning); border: 1px solid var(--warning); padding: 6px 12px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif;">End</button>
                    <button @click="deleteAuction(a.id)" style="background: #FEF2F2; color: #E53E3E; border: 1px solid #FECACA; padding: 6px 10px; border-radius: 7px; font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center;">
                      <v-icon size="13">mdi-delete-outline</v-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="auctions.length === 0">
                <td colspan="4" style="text-align: center; padding: 48px; color: var(--text-muted); font-size: 14px;">No auctions yet. Create one above.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Users Tab -->
      <div v-if="tab === 'users'" class="animate-in animate-in-delay-2">
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
          <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color);">
            <h2 style="font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text-primary); margin: 0; font-weight: 400;">All Users ({{ allUsers.length }})</h2>
          </div>
          <table style="width: 100%; border-collapse: collapse;" class="clean-table">
            <thead>
              <tr>
                <th style="text-align: left;">User</th>
                <th style="text-align: right;">Balance</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in allUsers" :key="user.uid">
                <td>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 36px; height: 36px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                      <span style="color: white; font-size: 14px; font-weight: 700;">{{ (user.username || 'U')[0].toUpperCase() }}</span>
                    </div>
                    <div>
                      <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">{{ user.username }}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td style="text-align: right;">
                  <span class="bid-amount" style="font-size: 15px; color: var(--text-primary);">₹{{ (user.credits || 0).toLocaleString() }}</span>
                </td>
                <td style="text-align: center;">
                  <span :style="{ background: user.isVerified ? 'var(--success-soft)' : 'var(--warning-soft)', color: user.isVerified ? 'var(--success)' : 'var(--warning)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }">
                    {{ user.isVerified ? 'Verified' : 'Unverified' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <button @click="auditUser(user)" style="background: var(--bg-elevated); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 6px 14px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif;">Audit</button>
                </td>
              </tr>
              <tr v-if="allUsers.length === 0">
                <td colspan="4" style="text-align: center; padding: 48px; color: var(--text-muted); font-size: 14px;">No users found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import { useNotification } from '../services/notification'

const notification = useNotification()
const tab = ref('create')
const auctions = ref([])
const allUsers = ref([])
const submitting = ref(false)
const placeholder = 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?auto=format&fit=crop&q=80&w=200'
const categories = ['Art', 'Watches', 'Vehicles', 'Electronics', 'Collectibles']

const tabs = [
  { value: 'create', label: 'Create Auction', icon: 'mdi-plus-circle-outline' },
  { value: 'auctions', label: 'Manage Auctions', icon: 'mdi-gavel' },
  { value: 'users', label: 'Users', icon: 'mdi-account-group-outline' },
]

const newAuction = ref({ title: '', description: '', minBid: 0, imageUrl: '', category: 'Watches', endTime: new Date(Date.now() + 86400000).toISOString() })

const fetchData = async () => {
  try {
    const [aRes, uRes] = await Promise.all([api.get('/api/auctions'), api.get('/api/admin/users')])
    auctions.value = aRes.data
    allUsers.value = uRes.data
  } catch (err) { console.error(err) }
}

const createAuction = async () => {
  if (!newAuction.value.title || !newAuction.value.minBid) return notification.add('Fill in all required fields', 'error')
  submitting.value = true
  try {
    await api.post('/api/auctions', newAuction.value)
    notification.add('Auction created successfully!', 'success')
    newAuction.value = { title: '', description: '', minBid: 0, imageUrl: '', category: 'Watches', endTime: new Date(Date.now() + 86400000).toISOString() }
    fetchData()
    tab.value = 'auctions'
  } catch { notification.add('Failed to create auction.', 'error') }
  finally { submitting.value = false }
}

const deleteAuction = async (id) => {
  if (!confirm('Delete this auction? This cannot be undone.')) return
  try {
    await api.delete(`/api/auctions/${id}`)
    notification.add('Auction deleted.', 'success')
    fetchData()
  } catch { notification.add('Failed to delete.', 'error') }
}

const closeAuction = async (id) => {
  if (!confirm('End this auction and notify the winner?')) return
  try {
    await api.post('/api/admin/closeAuction', { auctionId: id })
    notification.add('Auction ended. Winner notified.', 'success')
    fetchData()
  } catch { notification.add('Failed to close auction.', 'error') }
}

const auditUser = (user) => notification.add(`Viewing audit for ${user.username}`, 'info')

onMounted(fetchData)
</script>