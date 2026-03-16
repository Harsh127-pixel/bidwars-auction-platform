<!-- FILE: frontend/src/pages/Admin.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'
import StatCard from '../components/StatCard.vue'
import EmptyState from '../components/EmptyState.vue'

const authStore = useAuthStore()
const notification = useNotification()
const tab = ref('overview')

// Data
const auctions = ref([])
const pendingAuctions = ref([])
const allUsers = ref([])
const flaggedAuctions = ref([])
const disputes = ref([])
const stats = ref({})
const loading = ref(false)

// Create form
const newAuction = ref({ title:'', description:'', category:'Watches', minBid:0, buyItNow:null, imageUrl:'', endTime: new Date(Date.now()+86400000).toISOString().slice(0,16) })
const submitting = ref(false)
const aiLoading = ref(false)

// Edit dialog
const editItem = ref(null)
const showEdit = ref(false)

// Audit dialog
const auditUser = ref(null)
const auditTxs = ref([])
const showAudit = ref(false)

const fmt = (n) => {
  const num = Number(n)
  return '₹' + (isNaN(num) ? 0 : num).toLocaleString('en-IN')
}
const pendingKYC = computed(() => allUsers.value.filter(u => u.kycStatus === 'pending'))

const tabs = [
  { id:'overview',   label:'Overview'  },
  { id:'auctions',   label:'Auctions'  },
  { id:'proposals',  label:'Proposals' },
  { id:'flagged',    label:'Flagged'   },
  { id:'disputes',   label:'Disputes'  },
  { id:'users',      label:'Users'     },
  { id:'create',     label:'+ New Lot' },
]

const fetchData = async () => {
  loading.value = true
  try {
    const [a, p, u, f, d, s] = await Promise.all([
      api.get('/api/auctions'),
      api.get('/api/admin/pendingAuctions'),
      api.get('/api/admin/users'),
      api.get('/api/admin/flagged'),
      api.get('/api/admin/disputes'),
      api.get('/api/admin/analytics'),
    ])
    auctions.value = a.data
    pendingAuctions.value = p.data
    allUsers.value = u.data
    flaggedAuctions.value = f.data
    disputes.value = d.data.filter(d => d.status === 'open')
    stats.value = s.data
  } catch (e) {
    notification.add('Failed to load admin data: ' + e.message, 'error')
  } finally { loading.value = false }
}

const createAuction = async () => {
  if (!newAuction.value.title || !newAuction.value.minBid) return notification.add('Fill required fields', 'error')
  submitting.value = true
  try {
    await api.post('/api/auctions', newAuction.value)
    notification.add('Auction created!', 'success')
    newAuction.value = { title:'', description:'', category:'Watches', minBid:0, buyItNow:null, imageUrl:'', endTime: new Date(Date.now()+86400000).toISOString().slice(0,16) }
    fetchData(); tab.value = 'auctions'
  } catch (e) { notification.add('Failed: ' + e.message, 'error') }
  finally { submitting.value = false }
}

const generateAI = async () => {
  if (!newAuction.value.title) return
  aiLoading.value = true
  try {
    const res = await api.post('/api/generateDescription', { itemName: newAuction.value.title, features: newAuction.value.category })
    newAuction.value.description = res.data.description
    notification.add('Description generated', 'success')
  } catch { notification.add('AI unavailable', 'error') }
  finally { aiLoading.value = false }
}

const deleteAuction = async (id) => {
  if (!confirm('Delete this auction?')) return
  try { await api.delete(`/api/auctions/${id}`); notification.add('Deleted', 'success'); fetchData() }
  catch { notification.add('Failed to delete', 'error') }
}

const closeAuction = async (id) => {
  if (!confirm('End this auction now?')) return
  try { await api.post('/api/admin/closeAuction', { auctionId: id }); notification.add('Auction ended', 'success'); fetchData() }
  catch { notification.add('Failed', 'error') }
}

const reviewProposal = async (id, approved) => {
  try { await api.post('/api/admin/reviewAuction', { auctionId: id, approved }); notification.add(approved ? 'Approved' : 'Rejected', 'success'); fetchData() }
  catch { notification.add('Failed', 'error') }
}

const processKYC = async (uid, status) => {
  try { await api.post('/api/admin/verifyKYC', { uid, status }); notification.add(`KYC ${status}`, 'success'); fetchData() }
  catch { notification.add('Failed', 'error') }
}

const resolveDispute = async (id, resolution) => {
  try { await api.post(`/api/admin/disputes/${id}/resolve`, { status:'resolved', resolution }); notification.add('Resolved', 'success'); fetchData() }
  catch { notification.add('Failed', 'error') }
}

// Safely convert any Firestore timestamp shape → "YYYY-MM-DDTHH:MM" for datetime-local input.
// Handles: Firestore Timestamp object (.toDate()), {_seconds}, {seconds}, ISO string,
// numeric ms, and null/undefined (falls back to 24h from now so the field is never blank).
const toDatetimeLocal = (ts) => {
  try {
    if (!ts) throw new Error('empty')
    let d
    if (typeof ts.toDate === 'function') d = ts.toDate()
    else if (ts._seconds != null)        d = new Date(ts._seconds * 1000)
    else if (ts.seconds  != null)        d = new Date(ts.seconds  * 1000)
    else                                 d = new Date(ts)
    if (isNaN(d.getTime())) throw new Error('invalid')
    // Shift to local timezone offset so the input shows local time, not UTC
    const offset = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - offset).toISOString().slice(0, 16)
  } catch {
    return new Date(Date.now() + 86400000 - new Date().getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16)
  }
}

const openEdit = (a) => {
  editItem.value = { ...a, endTime: toDatetimeLocal(a.endTime) }
  showEdit.value = true
}
const saveEdit = async () => {
  submitting.value = true
  try { await api.put(`/api/auctions/${editItem.value.id}`, editItem.value); notification.add('Updated', 'success'); showEdit.value = false; fetchData() }
  catch { notification.add('Update failed', 'error') }
  finally { submitting.value = false }
}

const openAudit = async (user) => {
  auditUser.value = user; showAudit.value = true; auditTxs.value = []
  try { const res = await api.get(`/api/admin/users/${user.uid}/audit`); auditTxs.value = res.data }
  catch { notification.add('Could not load audit', 'error') }
}

const fmtType = (t) => t?.replace(/_/g,' ') || ''
const fmtDate = (ts) => { try { const d = ts?._seconds ? new Date(ts._seconds*1000) : new Date(ts); return d.toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}) } catch { return '' } }

onMounted(fetchData)
</script>

<template>
  <div class="page-content">
    <div class="page-wrap">
      <!-- Header -->
      <div class="admin-header fade-up">
        <div>
          <div class="t-label" style="color:var(--gold);margin-bottom:10px">Admin Panel</div>
          <h1 class="t-display t-title">Auction Management</h1>
        </div>
        <div class="badge badge-live"><span class="live-dot"></span>System Online</div>
      </div>

      <!-- Tabs -->
      <div class="tabs fade-up fade-up-1">
        <button v-for="t in tabs" :key="t.id"
          class="tab-btn" :class="{'tab-btn--active': tab === t.id}"
          @click="tab = t.id">
          {{ t.label }}
          <span v-if="t.id==='proposals' && pendingAuctions.length" class="tab-badge">{{ pendingAuctions.length }}</span>
          <span v-if="t.id==='disputes' && disputes.length" class="tab-badge">{{ disputes.length }}</span>
          <span v-if="t.id==='flagged' && flaggedAuctions.length" class="tab-badge tab-badge--red">{{ flaggedAuctions.length }}</span>
        </button>
      </div>

      <!-- OVERVIEW -->
      <div v-if="tab === 'overview'" class="fade-up fade-up-2">
        <div class="stats-grid">
          <StatCard label="Total Sales" :value="fmt(stats.totalSales)" sub="Closed auctions" accent="gold" />
          <StatCard label="Platform Revenue" :value="fmt(stats.platformFees)" sub="Net fees collected" accent="green" />
          <StatCard label="KYC Pending" :value="pendingKYC.length" sub="Awaiting review" accent="blue" />
          <StatCard label="Security Alerts" :value="flaggedAuctions.length" sub="Flagged listings" accent="red" />
        </div>

        <div class="two-col">
          <div class="card" style="overflow:hidden">
            <div style="padding:20px 20px 0;margin-bottom:4px">
              <div class="t-label" style="margin-bottom:4px">Pending Proposals</div>
            </div>
            <template v-if="pendingAuctions.length">
              <div v-for="a in pendingAuctions.slice(0,5)" :key="a.id" class="proposal-row">
                <img :src="a.imageUrl||'https://images.unsplash.com/photo-1547996160-81dfa63595dd?w=60&q=80'"
                  style="width:44px;height:36px;object-fit:cover;border-radius:6px" />
                <div style="flex:1">
                  <div style="font-size:14px;font-weight:600">{{ a.title }}</div>
                  <div class="t-mono">{{ fmt(a.minBid) }} · {{ a.sellerName || 'User' }}</div>
                </div>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-ghost btn-sm" style="color:var(--green)" @click="reviewProposal(a.id, true)">✓</button>
                  <button class="btn btn-ghost btn-sm" style="color:var(--red)" @click="reviewProposal(a.id, false)">✕</button>
                </div>
              </div>
            </template>
            <EmptyState v-else title="Queue empty" icon="◇" />
          </div>

          <div class="card" style="padding:24px">
            <div class="t-label" style="margin-bottom:20px">Membership Distribution</div>
            <div v-if="stats.tierDistribution" style="display:flex;flex-direction:column;gap:16px">
              <div v-for="(count, tier) in stats.tierDistribution" :key="tier">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                  <span style="font-size:13px;color:var(--text-2)">{{ tier }}</span>
                  <span style="font-size:13px;font-weight:600">{{ count }}</span>
                </div>
                <div style="height:6px;background:var(--bg-raised);border-radius:3px;overflow:hidden">
                  <div :style="`width:${Math.max(2, count/(allUsers.length||1)*100)}%;height:100%;background:${tier==='Gold'?'var(--gold)':tier==='Silver'?'#9BA3AF':'#92400E'};border-radius:3px`"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AUCTIONS TABLE -->
      <div v-if="tab === 'auctions'" class="fade-up fade-up-2">
        <div class="card" style="overflow:hidden">
          <div style="padding:20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)">
            <div class="t-label">Active Auctions ({{ auctions.length }})</div>
            <button class="btn btn-ghost btn-sm" @click="fetchData">↻ Refresh</button>
          </div>
          <table v-if="auctions.length" class="data-table">
            <thead>
              <tr><th>Item</th><th style="text-align:right">Current Bid</th><th style="text-align:center">Bids</th><th style="text-align:right">Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="a in auctions" :key="a.id">
                <td>
                  <div style="display:flex;align-items:center;gap:14px">
                    <img :src="a.imageUrl||'https://images.unsplash.com/photo-1547996160-81dfa63595dd?w=60&q=80'" style="width:52px;height:40px;object-fit:cover;border-radius:6px" />
                    <div>
                      <div style="font-weight:600;font-size:14px">{{ a.title }}</div>
                      <div class="t-mono">{{ a.category }}</div>
                    </div>
                  </div>
                </td>
                <td style="text-align:right;font-family:var(--font-display);font-size:16px">{{ fmt(a.highestBid||a.minBid) }}</td>
                <td style="text-align:center;color:var(--text-2)">{{ a.bidCount || 0 }}</td>
                <td style="text-align:right">
                  <div style="display:flex;gap:8px;justify-content:flex-end">
                    <router-link :to="'/auction/'+a.id" class="btn btn-ghost btn-sm">View</router-link>
                    <button class="btn btn-ghost btn-sm" @click="openEdit(a)">Edit</button>
                    <button class="btn btn-ghost btn-sm" style="color:var(--orange)" @click="closeAuction(a.id)">End</button>
                    <button class="btn btn-danger btn-sm" @click="deleteAuction(a.id)">Del</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-else title="No active auctions" icon="◇" />
        </div>
      </div>

      <!-- PROPOSALS -->
      <div v-if="tab === 'proposals'" class="fade-up fade-up-2">
        <div class="card" style="overflow:hidden">
          <div style="padding:20px;border-bottom:1px solid var(--border)">
            <div class="t-label">P2P Proposals ({{ pendingAuctions.length }})</div>
          </div>
          <table v-if="pendingAuctions.length" class="data-table">
            <thead><tr><th>Item</th><th>Seller</th><th style="text-align:right">Start Price</th><th style="text-align:right">Review</th></tr></thead>
            <tbody>
              <tr v-for="a in pendingAuctions" :key="a.id">
                <td>
                  <div style="display:flex;align-items:center;gap:14px">
                    <img :src="a.imageUrl||'https://images.unsplash.com/photo-1547996160-81dfa63595dd?w=60&q=80'" style="width:52px;height:40px;object-fit:cover;border-radius:6px" />
                    <span style="font-weight:600;font-size:14px">{{ a.title }}</span>
                  </div>
                </td>
                <td style="color:var(--text-2)">{{ a.sellerName || 'User' }}</td>
                <td style="text-align:right;font-family:var(--font-display)">{{ fmt(a.minBid) }}</td>
                <td style="text-align:right">
                  <div style="display:flex;gap:8px;justify-content:flex-end">
                    <button class="btn btn-ghost btn-sm" style="color:var(--green)" @click="reviewProposal(a.id, true)">Approve</button>
                    <button class="btn btn-danger btn-sm" @click="reviewProposal(a.id, false)">Reject</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-else title="No proposals" icon="◇" />
        </div>
      </div>

      <!-- FLAGGED -->
      <div v-if="tab === 'flagged'" class="fade-up fade-up-2">
        <div class="card" style="overflow:hidden">
          <div style="padding:20px;border-bottom:1px solid var(--border);background:var(--red-dim)">
            <div class="t-label" style="color:var(--red)">Security Alerts ({{ flaggedAuctions.length }})</div>
          </div>
          <table v-if="flaggedAuctions.length" class="data-table">
            <thead><tr><th>Asset</th><th>Reason</th><th style="text-align:right">Actions</th></tr></thead>
            <tbody>
              <tr v-for="a in flaggedAuctions" :key="a.id">
                <td>
                  <div style="font-weight:600">{{ a.title }}</div>
                  <div class="t-mono">{{ a.id.slice(0,12).toUpperCase() }}</div>
                </td>
                <td>
                  <span class="badge badge-red">{{ a.flagReason || 'Suspicious activity' }}</span>
                </td>
                <td style="text-align:right">
                  <button class="btn btn-danger btn-sm" @click="deleteAuction(a.id)">Remove</button>
                </td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-else title="No alerts" subtitle="All clear." icon="✓" />
        </div>
      </div>

      <!-- DISPUTES -->
      <div v-if="tab === 'disputes'" class="fade-up fade-up-2">
        <div class="card" style="overflow:hidden">
          <div style="padding:20px;border-bottom:1px solid var(--border)">
            <div class="t-label">Open Disputes ({{ disputes.length }})</div>
          </div>
          <div v-if="disputes.length">
            <div v-for="d in disputes" :key="d.id" class="dispute-row">
              <div style="flex:1">
                <div class="t-mono" style="margin-bottom:4px">{{ d.auctionId?.slice(0,12).toUpperCase() }}</div>
                <div style="font-size:14px;font-weight:600;margin-bottom:4px">{{ d.reason }}</div>
                <div style="font-size:12px;color:var(--text-3)">{{ fmtDate(d.createdAt) }}</div>
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn btn-ghost btn-sm" style="color:var(--green)" @click="resolveDispute(d.id, 'Release Funds')">Release to Seller</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--orange)" @click="resolveDispute(d.id, 'Refund Issued')">Refund Buyer</button>
              </div>
            </div>
          </div>
          <EmptyState v-else title="No open disputes" icon="◇" />
        </div>
      </div>

      <!-- USERS -->
      <div v-if="tab === 'users'" class="fade-up fade-up-2">
        <div class="card" style="overflow:hidden">
          <div style="padding:20px;border-bottom:1px solid var(--border)">
            <div class="t-label">Users ({{ allUsers.length }})</div>
          </div>
          <table v-if="allUsers.length" class="data-table">
            <thead><tr><th>User</th><th style="text-align:right">Balance</th><th style="text-align:center">KYC</th><th style="text-align:right">Actions</th></tr></thead>
            <tbody>
              <tr v-for="u in allUsers" :key="u.uid">
                <td>
                  <div style="font-weight:600;font-size:14px">{{ u.username }}</div>
                  <div class="t-mono">{{ u.email }}</div>
                </td>
                <td style="text-align:right;font-family:var(--font-display)">{{ fmt(u.credits) }}</td>
                <td style="text-align:center">
                  <span class="badge" :class="u.isVerified ? 'badge-live' : u.kycStatus === 'pending' ? 'badge-orange' : 'badge-muted'">
                    {{ u.isVerified ? 'Verified' : u.kycStatus === 'pending' ? 'Pending' : 'None' }}
                  </span>
                </td>
                <td style="text-align:right">
                  <div style="display:flex;gap:8px;justify-content:flex-end">
                    <template v-if="u.kycStatus === 'pending'">
                      <button class="btn btn-ghost btn-sm" style="color:var(--green)" @click="processKYC(u.uid,'approved')">Approve</button>
                      <button class="btn btn-danger btn-sm" @click="processKYC(u.uid,'rejected')">Reject</button>
                    </template>
                    <button class="btn btn-ghost btn-sm" @click="openAudit(u)">Audit</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- CREATE -->
      <div v-if="tab === 'create'" class="fade-up fade-up-2">
        <div class="card" style="padding:28px;max-width:680px">
          <div class="t-label" style="margin-bottom:24px">Create New Auction</div>
          <form @submit.prevent="createAuction" style="display:flex;flex-direction:column;gap:20px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="field-wrap">
                <label class="field-label">Title *</label>
                <input v-model="newAuction.title" required class="field" placeholder="e.g. Vintage Rolex Submariner" />
              </div>
              <div class="field-wrap">
                <label class="field-label">Category *</label>
                <select v-model="newAuction.category" class="field">
                  <option v-for="c in ['Art','Watches','Vehicles','Electronics','Collectibles']" :key="c">{{ c }}</option>
                </select>
              </div>
            </div>

            <div class="field-wrap">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <label class="field-label">Description</label>
                <button type="button" class="btn btn-ghost btn-sm" :disabled="aiLoading||!newAuction.title" @click="generateAI">
                  {{ aiLoading ? 'Generating…' : '✦ AI Generate' }}
                </button>
              </div>
              <textarea v-model="newAuction.description" class="field" placeholder="Describe the item…"></textarea>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
              <div class="field-wrap">
                <label class="field-label">Starting Bid (₹) *</label>
                <input v-model.number="newAuction.minBid" type="number" min="1" required class="field" />
              </div>
              <div class="field-wrap">
                <label class="field-label">Buy It Now (₹)</label>
                <input v-model.number="newAuction.buyItNow" type="number" class="field" placeholder="Optional" />
              </div>
              <div class="field-wrap">
                <label class="field-label">End Date/Time *</label>
                <input v-model="newAuction.endTime" type="datetime-local" required class="field" />
              </div>
            </div>

            <div class="field-wrap">
              <label class="field-label">Image URL</label>
              <input v-model="newAuction.imageUrl" class="field" placeholder="https://…" />
            </div>

            <div style="display:flex;align-items:center;gap:16px;padding-top:4px">
              <button type="submit" class="btn btn-gold btn-lg" :disabled="submitting">
                {{ submitting ? 'Creating…' : 'Create Auction' }}
              </button>
              <span style="font-size:13px;color:var(--text-3)">* Required fields</span>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <Teleport to="body">
      <Transition name="page">
        <div v-if="showEdit" class="dialog-overlay" @click.self="showEdit=false">
          <div class="dialog">
            <div class="dialog__header">
              <div class="t-label">Edit Auction</div>
              <button class="btn btn-ghost btn-sm" @click="showEdit=false">✕</button>
            </div>
            <div v-if="editItem" style="display:flex;flex-direction:column;gap:16px;padding:24px">
              <div class="field-wrap"><label class="field-label">Title</label><input v-model="editItem.title" class="field" /></div>
              <div class="field-wrap"><label class="field-label">Description</label><textarea v-model="editItem.description" class="field"></textarea></div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="field-wrap"><label class="field-label">Category</label>
                  <select v-model="editItem.category" class="field">
                    <option v-for="c in ['Art','Watches','Vehicles','Electronics','Collectibles']" :key="c">{{ c }}</option>
                  </select>
                </div>
                <div class="field-wrap"><label class="field-label">End Time</label><input v-model="editItem.endTime" type="datetime-local" class="field" /></div>
              </div>
              <div class="field-wrap"><label class="field-label">Image URL</label><input v-model="editItem.imageUrl" class="field" /></div>
              <div v-if="!editItem.bidCount" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="field-wrap"><label class="field-label">Min Bid (₹)</label><input v-model.number="editItem.minBid" type="number" class="field" /></div>
                <div class="field-wrap"><label class="field-label">Buy It Now (₹)</label><input v-model.number="editItem.buyItNow" type="number" class="field" /></div>
              </div>
            </div>
            <div style="display:flex;gap:10px;padding:0 24px 24px;justify-content:flex-end">
              <button class="btn btn-ghost" @click="showEdit=false">Cancel</button>
              <button class="btn btn-gold" :disabled="submitting" @click="saveEdit">{{ submitting ? 'Saving…' : 'Save Changes' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Audit Dialog -->
    <Teleport to="body">
      <Transition name="page">
        <div v-if="showAudit" class="dialog-overlay" @click.self="showAudit=false">
          <div class="dialog dialog--wide">
            <div class="dialog__header">
              <div><div class="t-label" style="margin-bottom:4px">Audit Trail</div><div style="font-size:14px;color:var(--text-2)">{{ auditUser?.username }}</div></div>
              <button class="btn btn-ghost btn-sm" @click="showAudit=false">✕</button>
            </div>
            <div style="max-height:480px;overflow-y:auto">
              <table v-if="auditTxs.length" class="data-table">
                <thead><tr><th>Type</th><th>Date</th><th style="text-align:right">Amount</th><th style="text-align:right">Balance</th></tr></thead>
                <tbody>
                  <tr v-for="tx in auditTxs" :key="tx.id">
                    <td style="font-size:13px;font-weight:600">{{ fmtType(tx.type) }}</td>
                    <td class="t-mono">{{ fmtDate(tx.createdAt) }}</td>
                    <td style="text-align:right" :style="`color:${tx.amount>=0?'var(--green)':'var(--red)'};font-weight:600`">
                      {{ tx.amount >= 0 ? '+' : '' }}{{ fmt(tx.amount) }}
                    </td>
                    <td style="text-align:right;font-family:var(--font-display)">{{ fmt(tx.newBalance) }}</td>
                  </tr>
                </tbody>
              </table>
              <EmptyState v-else title="No transactions" icon="◇" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:16px; }

.tabs { display:flex; gap:2px; margin-bottom:28px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--r-md); padding:4px; overflow-x:auto; width:fit-content; }
.tab-btn { display:flex; align-items:center; gap:6px; padding:7px 16px; border-radius:6px; border:none; background:transparent; color:var(--text-2); font-family:var(--font-body); font-size:13px; font-weight:500; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
.tab-btn:hover { color:var(--text); background:var(--bg-hover); }
.tab-btn--active { background:var(--bg-raised); color:var(--text); font-weight:600; }
.tab-badge { background:var(--gold-dim); color:var(--gold); font-size:10px; font-weight:700; padding:1px 6px; border-radius:10px; }
.tab-badge--red { background:var(--red-dim); color:var(--red); }

.stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:24px; }

.two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; }

.proposal-row { display:flex; align-items:center; gap:14px; padding:14px 20px; border-bottom:1px solid var(--border); }
.proposal-row:last-child { border-bottom:none; }

.dispute-row { display:flex; align-items:center; gap:20px; padding:18px 20px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
.dispute-row:last-child { border-bottom:none; }

/* Dialog */
.dialog-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:300; display:flex; align-items:center; justify-content:center; padding:24px; }
.dialog { background:var(--bg-card); border:1px solid var(--border-md); border-radius:var(--r-lg); width:100%; max-width:560px; }
.dialog--wide { max-width:720px; }
.dialog__header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px; border-bottom:1px solid var(--border); }

@media (max-width:768px) { .two-col { grid-template-columns:1fr; } }
</style>