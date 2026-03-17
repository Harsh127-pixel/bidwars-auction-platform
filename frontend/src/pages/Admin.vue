<!-- FILE: frontend/src/pages/Admin.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'
import StatCard from '../components/StatCard.vue'
import EmptyState from '../components/EmptyState.vue'
import MediaUpload from '../components/MediaUpload.vue'

const authStore = useAuthStore()
const notification = useNotification()
const tab = ref('overview')

// Data
const auctions = ref([])
const pendingAuctions = ref([])
const allUsers = ref([])
const flaggedUsers = ref([])
const disputes = ref([])
const proposals = ref([])
const transactions = ref([])
const fulfillment = ref([])
const stats = ref({})
const platformSettings = ref({ razorpaySimulation: true })
const loading = ref(false)
const supportTickets = ref([])
const auditLogs = ref({ transactions: [], orders: [] })
const aiSummary = ref('')
const aiSummaryLoading = ref(false)
const employees = ref([])
const showEmployeeDialog = ref(false)
const employeeForm = ref({ email: '', username: '', permissions: {} })
const editingEmployee = ref(null)

const selectedProp = ref(null)
const showPropPreview = ref(false)

const selectedTicket = ref(null)
const replyMessage = ref('')
const replying = ref(false)
const showTicketDetail = ref(false)

const permissionKeys = [
  { key: 'view_users', label: 'View Users' },
  { key: 'manage_users', label: 'Manage Users' },
  { key: 'view_proposals', label: 'View Proposals' },
  { key: 'manage_proposals', label: 'Manage Proposals' },
  { key: 'view_auctions', label: 'View Auctions' },
  { key: 'manage_auctions', label: 'Manage Auctions' },
  { key: 'view_fulfillment', label: 'View Fulfillment' },
  { key: 'manage_fulfillment', label: 'Manage Fulfillment' },
  { key: 'view_disputes', label: 'View Disputes' },
  { key: 'manage_disputes', label: 'Manage Disputes' },
  { key: 'view_audit', label: 'View Audit Logs' },
  { key: 'manage_settings', label: 'Manage Settings' }
]

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

// Fulfillment dialog
const shipOrder = ref(null)
const showShip = ref(false)

const fmt = (n) => {
  const num = Number(n)
  return '₹' + (isNaN(num) ? 0 : num).toLocaleString('en-IN')
}
const pendingKYC = computed(() => allUsers.value.filter(u => u.kycStatus === 'pending'))

const allTabsConfigs = [
  { id:'overview',   label:'Overview'    },
  { id:'auctions',   label:'Auctions',    permission: 'view_auctions' },
  { id:'proposals',  label:'Proposals',   permission: 'view_proposals' },
  { id:'transactions',label:'Transactions', permission: 'view_audit' },
  { id:'fulfillment',label:'Fulfillment', permission: 'view_fulfillment' },
  { id:'flagged',    label:'Security',    permission: 'manage_users' },
  { id:'disputes',   label:'Disputes',    permission: 'view_disputes' },
  { id:'support',    label:'Support'     },
  { id:'users',      label:'Users',       permission: 'view_users' },
  { id:'employees',  label:'Employees',   adminOnly: true },
  { id:'logs',       label:'Audit Logs',  permission: 'view_audit' },
  { id:'reports',    label:'AI Reports',  permission: 'view_audit' },
  { id:'settings',   label:'Settings',    permission: 'manage_settings' },
  { id:'create',     label:'+ New Lot',   permission: 'manage_auctions' },
]

const tabs = computed(() => {
  return allTabsConfigs.filter(t => {
    if (authStore.role === 'admin') return true
    if (t.adminOnly) return false
    if (!t.permission) return true
    return authStore.user?.permissions?.[t.permission]
  })
})

const hasPermission = (perm) => {
  if (authStore.role === 'admin') return true
  return authStore.user?.permissions?.[perm]
}

const fetchData = async () => {
  loading.value = true
  try {
    const [a, p, u, f, d, s, prop, pay, ful, sett, tickets, logs,emp] = await Promise.all([
      api.get('/api/auctions'),
      api.get('/api/admin/pendingAuctions'),
      api.get('/api/admin/users'),
      api.get('/api/admin/flagged-users'),
      api.get('/api/admin/disputes'),
      api.get('/api/admin/analytics'),
      api.get('/api/admin/proposals'),
      api.get('/api/payments/admin/transactions'),
      api.get('/api/admin/fulfillment'),
      api.get('/api/admin/settings'),
      api.get('/api/support/admin/tickets'),
      api.get('/api/admin/audit/logs'),
      authStore.role === 'admin' ? api.get('/api/admin/employees') : Promise.resolve({ data: [] })
    ])
    auctions.value = a.data
    pendingAuctions.value = p.data
    allUsers.value = u.data
    flaggedUsers.value = f.data
    disputes.value = d.data.filter(d => d.status === 'open')
    stats.value = s.data
    proposals.value = prop.data
    transactions.value = pay.data
    fulfillment.value = ful.data
    platformSettings.value = sett.data
    supportTickets.value = tickets.data
    auditLogs.value = logs.data
    employees.value = emp.data
  } catch (e) {
    if (e.response?.status !== 403) {
      notification.add('Failed to load admin data: ' + e.message, 'error')
    }
  } finally { loading.value = false }
}

const addEmployee = async () => {
  submitting.value = true
  try {
    if (editingEmployee.value) {
      await api.put(`/api/admin/employees/${editingEmployee.value.id}`, { permissions: employeeForm.value.permissions })
      notification.add('Permissions updated', 'success')
    } else {
      await api.post('/api/admin/employees', employeeForm.value)
      notification.add('Employee added', 'success')
    }
    showEmployeeDialog.value = false
    fetchData()
  } catch (e) {
    notification.add('Failed: ' + (e.response?.data?.error || e.message), 'error')
  } finally { submitting.value = false }
}

const removeEmployee = async (id) => {
  if (!confirm('Remove this employee? They will revert to a standard bidder role.')) return
  try {
    await api.delete(`/api/admin/employees/${id}`)
    notification.add('Employee removed', 'success')
    fetchData()
  } catch (e) { notification.add('Failed', 'error') }
}

const openEmployeeEdit = (emp) => {
  editingEmployee.value = emp
  employeeForm.value = { 
    email: emp.email, 
    username: emp.username, 
    permissions: emp.permissions ? { ...emp.permissions } : {} 
  }
  showEmployeeDialog.value = true
}

const openAddEmployee = () => {
  editingEmployee.value = null
  employeeForm.value = { email: '', username: '', permissions: {} }
  showEmployeeDialog.value = true
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

const generateAdminAI = async () => {
  if (!newAuction.value.title) return notification.add('Enter a rough name for the lot first', 'error')
  submitting.value = true
  try {
    const res = await api.post('/api/proposals/generate-description', {
      title: newAuction.value.title,
      category: newAuction.value.category
    })
    const data = res.data.description
    try {
      const parsed = JSON.parse(data)
      if (parsed.title) newAuction.value.title = parsed.title
      if (parsed.description) newAuction.value.description = parsed.description
      if (parsed.category) newAuction.value.category = parsed.category
      notification.add('Lot details auto-filled by AI!', 'success')
    } catch {
      newAuction.value.description = data
      notification.add('Description generated!', 'success')
    }
  } catch (error) {
    notification.add('AI Generation failed', 'error')
  } finally { submitting.value = false }
}

const generateAI = async () => {
  if (!newAuction.value.title) return
  aiLoading.value = true
  try {
    const res = await api.post('/api/generateDescription', { itemName: newAuction.value.title })
    const data = res.data.description
    
    try {
      const parsed = JSON.parse(data)
      if (parsed.title) newAuction.value.title = parsed.title
      if (parsed.description) newAuction.value.description = parsed.description
      if (parsed.category) newAuction.value.category = parsed.category
      notification.add('Lot auto-filled via AI', 'success')
    } catch {
      newAuction.value.description = data
      notification.add('Description generated', 'success')
    }
  } catch { notification.add('AI unavailable', 'error') }
  finally { aiLoading.value = false }
}

const fetchAiSummary = async () => {
  aiSummaryLoading.value = true
  try {
    const res = await api.get('/api/admin/analytics/ai-summary')
    aiSummary.value = res.data.summary
  } catch (e) {
    notification.add('Failed to generate AI report', 'error')
  } finally {
    aiSummaryLoading.value = false
  }
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

const toggleUserStatus = async (userId, status) => {
  try { await api.put(`/api/admin/users/${userId}/status`, { status }); notification.add(`User ${status}`, 'success'); fetchData() }
  catch { notification.add('Failed', 'error') }
}

const approveProposal = async (proposalId, status, notes = '') => {
  try { await api.put(`/api/admin/proposals/${proposalId}`, { status, adminNotes: notes }); notification.add(`Proposal ${status}`, 'success'); showPropPreview.value = false; fetchData() }
  catch { notification.add('Failed', 'error') }
}

const openPropPreview = (p) => {
  selectedProp.value = p
  showPropPreview.value = true
}

const cancelKYC = async (userId) => {
  if (!confirm('Force cancel KYC for this user?')) return
  try { await api.put(`/api/admin/users/${userId}/cancel-kyc`); notification.add('KYC Cancelled by admin', 'success'); fetchData() }
  catch { notification.add('Failed to cancel KYC', 'error') }
}

const cancelSubscription = async (userId) => {
  if (!confirm('Force cancel subscription for this user?')) return
  try { await api.put(`/api/admin/users/${userId}/cancel-subscription`); notification.add('Subscription Cancelled by admin', 'success'); fetchData() }
  catch { notification.add('Failed to cancel subscription', 'error') }
}

const updateFulfillment = async () => {
  submitting.value = true
  try {
    await api.put(`/api/admin/fulfillment/${shipOrder.value.id}/ship`, shipOrder.value)
    notification.add('Order marked as shipped!', 'success')
    showShip.value = false
    fetchData()
  } catch (e) { notification.add('Failed: ' + e.message, 'error') }
  finally { submitting.value = false }
}

const updateSettings = async () => {
  try {
    await api.put('/api/admin/settings', platformSettings.value)
    notification.add('Settings updated', 'success')
  } catch (e) { notification.add('Failed: ' + e.message, 'error') }
}

const promoteToAdmin = async (userId) => {
  if (!confirm('Promote this user to Admin?')) return
  try {
    await api.put(`/api/admin/users/${userId}/promote`)
    notification.add('User promoted to Admin', 'success')
    fetchData()
  } catch (e) { notification.add('Promotion failed', 'error') }
}

const resolveTicket = async (ticketId, status) => {
  const resolution = prompt('Enter resolution details:')
  if (resolution === null) return
  try {
    await api.put(`/api/support/admin/tickets/${ticketId}`, { status, resolution })
    notification.add('Ticket updated', 'success')
    if (selectedTicket.value?.id === ticketId) openTicket(selectedTicket.value)
    fetchData()
  } catch (e) { notification.add('Update failed', 'error') }
}

const openTicket = async (ticket) => {
  showTicketDetail.value = true
  selectedTicket.value = null
  try {
    const res = await api.get(`/api/support/tickets/${ticket.id}`)
    selectedTicket.value = res.data
  } catch { notification.add('Failed to load conversation', 'error') }
}

const submitAdminReply = async () => {
  if (!replyMessage.value.trim() || !selectedTicket.value) return
  replying.value = true
  try {
    await api.post(`/api/support/tickets/${selectedTicket.value.id}/reply`, { message: replyMessage.value })
    replyMessage.value = ''
    openTicket(selectedTicket.value)
    notification.add('Reply sent', 'success')
    fetchData()
  } catch { notification.add('Failed to reply', 'error') }
  finally { replying.value = false }
}

const exportLogs = (format) => {
  // Simple CSV export for now as a demonstration. 
  // In a real app, you might use a library like xlsx or jspdf.
  if (format === 'csv') {
    const headers = ['Type', 'User', 'Amount', 'Balance', 'Date']
    const rows = auditLogs.value.transactions.map(tx => [
      tx.type, tx.userId, tx.amount, tx.newBalance, fmtDate(tx.createdAt)
    ])
    let csv = headers.join(',') + '\n'
    rows.forEach(r => { csv += r.join(',') + '\n' })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'audit_logs.csv'; a.click()
  } else {
    notification.add(`${format.toUpperCase()} export initiated... (Simulation)`, 'info')
  }
}

const openShip = (order) => {
  shipOrder.value = { ...order }
  showShip.value = true
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

const unflagUser = async (userId) => {
  if (!confirm('Unflag this user?')) return
  try {
    await api.put(`/api/admin/users/${userId}/unflag`)
    notification.add('User unflagged', 'success')
    fetchData()
  } catch (e) { notification.add('Failed to unflag', 'error') }
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
        <div class="header-actions">
           <button class="btn btn-ghost btn-lg" @click="fetchData" :disabled="loading">
             <v-icon :class="{'btn-spin': loading}">mdi-refresh</v-icon>
             Refresh Data
           </button>
           <div class="badge badge-live"><span class="live-dot"></span>System Online</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs fade-up fade-up-1">
        <button v-for="t in tabs" :key="t.id"
          class="tab-btn" :class="{'tab-btn--active': tab === t.id}"
          @click="tab = t.id">
          {{ t.label }}
          <span v-if="t.id==='proposals'" class="tab-badge">
            {{ pendingAuctions.length + proposals.filter(p => p.status === 'pending').length }}
          </span>
          <span v-if="t.id==='disputes' && disputes.length" class="tab-badge">{{ disputes.length }}</span>
          <span v-if="t.id==='support' && supportTickets.filter(t=>t.status==='open').length" class="tab-badge">{{ supportTickets.filter(t=>t.status==='open').length }}</span>
          <span v-if="t.id==='flagged' && flaggedUsers.length" class="tab-badge tab-badge--red">{{ flaggedUsers.length }}</span>
        </button>
      </div>

      <!-- OVERVIEW -->
      <div v-if="tab === 'overview'" class="fade-up fade-up-2">
        <div class="stats-grid">
          <StatCard label="Total Sales" :value="fmt(stats.totalSales)" sub="Closed auctions" accent="gold" />
          <StatCard label="Platform Revenue" :value="fmt(stats.platformFees)" sub="Net fees collected" accent="green" />
          <StatCard label="KYC Pending" :value="pendingKYC.length" sub="Awaiting review" accent="blue" />
          <StatCard label="Security Alerts" :value="flaggedUsers.length" sub="Suspicious customers" accent="red" />
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
                <div v-if="hasPermission('manage_proposals')" style="display:flex;gap:6px">
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
                    <button v-if="hasPermission('manage_auctions')" class="btn btn-ghost btn-sm" @click="openEdit(a)">Edit</button>
                    <button v-if="hasPermission('manage_auctions')" class="btn btn-ghost btn-sm" style="color:var(--orange)" @click="closeAuction(a.id)">End</button>
                    <button v-if="hasPermission('manage_auctions')" class="btn btn-danger btn-sm" @click="deleteAuction(a.id)">Del</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-else title="No active auctions" icon="◇" />
        </div>
      </div>

      <!-- PROPOSALS CONSOLIDATED -->
      <div v-if="tab === 'proposals'" class="fade-up fade-up-2">
        <!-- Part 1: Proposed Auctions (from auctions collection) -->
        <div class="card" style="overflow:hidden;margin-bottom:24px">
          <div style="padding:20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <div class="t-label">Listing Proposals ({{ pendingAuctions.length }})</div>
            <button class="btn btn-ghost btn-sm" @click="fetchData">↻ Refresh</button>
          </div>
          <table v-if="pendingAuctions.length" class="data-table">
            <thead><tr><th>Item</th><th>Seller</th><th style="text-align:right">Min Bid</th><th style="text-align:right">Action</th></tr></thead>
            <tbody>
              <tr v-for="a in pendingAuctions" :key="a.id" @click="openPropPreview({...a, type:'listing', proposalId: a.id, source:'auction'})" style="cursor:pointer">
                <td>
                  <div style="display:flex;align-items:center;gap:14px">
                    <img :src="a.imageUrl||'https://images.unsplash.com/photo-1547996160-81dfa63595dd?w=60&q=80'" style="width:52px;height:40px;object-fit:cover;border-radius:6px" />
                    <span style="font-weight:600;font-size:14px">{{ a.title }}</span>
                  </div>
                </td>
                <td style="color:var(--text-2)">{{ a.sellerName || 'User' }}</td>
                <td style="text-align:right;font-family:var(--font-display)">{{ fmt(a.minBid) }}</td>
                <td style="text-align:right" @click.stop>
                  <div v-if="hasPermission('manage_proposals')" style="display:flex;gap:8px;justify-content:flex-end">
                    <button class="btn btn-ghost btn-sm" style="color:var(--green)" @click="reviewProposal(a.id, true)">Approve</button>
                    <button class="btn btn-danger btn-sm" @click="reviewProposal(a.id, false)">Reject</button>
                  </div>
                  <span v-else class="t-label">Read Only</span>
                </td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-else title="No listing proposals" icon="◇" />
        </div>

        <!-- Part 2: General Proposals (from proposals collection) -->
        <div class="card" style="overflow:hidden">
          <div style="padding:20px;border-bottom:1px solid var(--border)">
            <div class="t-label">General Proposals ({{ proposals.filter(p=>p.status==='pending').length }})</div>
          </div>
          <div v-if="proposals.filter(p=>p.status==='pending').length">
            <div v-for="p in proposals.filter(p=>p.status==='pending')" :key="p.id" class="dispute-row" @click="openPropPreview(p)" style="cursor:pointer">
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
                  <span class="badge" :class="p.type === 'listing' ? 'badge-live' : 'badge-muted'">{{ p.type?.toUpperCase() || 'GENERAL' }}</span>
                  <div style="font-weight:600">{{ p.title }}</div>
                </div>
                <div style="font-size:14px;color:var(--text-3);margin-bottom:8px">{{ p.description?.slice(0,120) }}{{ p.description?.length > 120 ? '...' : '' }}</div>
                <div style="font-size:12px;color:var(--text-3)">By {{ p.userId }} • {{ fmtDate(p.submittedAt) }}</div>
              </div>
              <div v-if="hasPermission('manage_proposals')" style="display:flex;gap:8px" @click.stop>
                <button class="btn btn-ghost btn-sm" style="color:var(--green)" @click="approveProposal(p.id, 'approved')">Approve</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--red)" @click="approveProposal(p.id, 'rejected')">Reject</button>
              </div>
            </div>
          </div>
          <EmptyState v-else title="No pending general proposals" icon="📝" />
        </div>
      </div>

      <!-- FLAGGED USERS -->
      <div v-if="tab === 'flagged'" class="fade-up fade-up-2">
        <div class="card" style="overflow:hidden">
          <div style="padding:20px;border-bottom:1px solid var(--border);background:var(--red-dim)">
            <div class="t-label" style="color:var(--red)">Suspicious Customers ({{ flaggedUsers.length }})</div>
          </div>
          <table v-if="flaggedUsers.length" class="data-table">
            <thead><tr><th>Customer</th><th>Reason</th><th style="text-align:right">Actions</th></tr></thead>
            <tbody>
              <tr v-for="u in flaggedUsers" :key="u.id">
                <td>
                  <div style="font-weight:600">{{ u.username }}</div>
                  <div class="t-mono">{{ u.email }}</div>
                </td>
                <td>
                  <span class="badge badge-red" style="font-size:11px">{{ u.flagReason || 'Suspicious activity detected' }}</span>
                  <div v-if="u.flaggedAt" style="font-size:10px;color:var(--text-3);margin-top:4px">Flagged: {{ fmtDate(u.flaggedAt) }}</div>
                </td>
                <td style="text-align:right">
                  <div style="display:flex;gap:8px;justify-content:flex-end">
                    <button class="btn btn-ghost btn-sm" @click="openAudit(u)">Audit</button>
                    <button v-if="hasPermission('manage_users')" class="btn btn-gold btn-sm" @click="unflagUser(u.id)">Review & Unflag</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-else title="No security alerts" subtitle="No suspicious customers flagged." icon="✓" />
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
                <div style="font-size:12px;color:var(--text-3)">By User ID: {{ d.initiatorId }} • {{ fmtDate(d.createdAt) }}</div>
              </div>
              <div v-if="hasPermission('manage_disputes')" style="display:flex;gap:8px">
                <button class="btn btn-ghost btn-sm" style="color:var(--green)" @click="resolveDispute(d.id, 'Release Funds')">Release Funds</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--orange)" @click="resolveDispute(d.id, 'Refund Issued')">Refund Buyer</button>
              </div>
            </div>
          </div>
          <EmptyState v-else title="No open disputes" icon="◇" />
        </div>
      </div>

      <!-- SUPPORT TICKETS -->
      <div v-if="tab === 'support'" class="fade-up fade-up-2">
        <div class="card" style="overflow:hidden">
          <div style="padding:20px;border-bottom:1px solid var(--border)">
            <div class="t-label">Support Tickets ({{ supportTickets.length }})</div>
          </div>
          <div v-if="supportTickets.length">
            <div v-for="t in supportTickets" :key="t.id" class="dispute-row" @click="openTicket(t)" style="cursor:pointer">
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
                  <span class="badge" :class="t.status">{{ t.status.toUpperCase() }}</span>
                  <div style="font-weight:600">{{ t.subject }}</div>
                </div>
                <div style="font-size:14px;color:var(--text-3);margin-bottom:8px">{{ t.message }}</div>
                <div v-if="t.resolution" style="font-size:13px;padding:10px;background:var(--green-dim);color:var(--green);border-radius:8px;margin-bottom:8px">
                  <strong>Resolution:</strong> {{ t.resolution }}
                </div>
                <div style="font-size:12px;color:var(--text-3)">By {{ t.username }} ({{ t.userId }}) • {{ fmtDate(t.createdAt) }}</div>
              </div>
              <div v-if="hasPermission('manage_disputes')" style="display:flex;gap:8px" @click.stop>
                <button v-if="t.status !== 'resolved' && t.status !== 'closed'" class="btn btn-ghost btn-sm" style="color:var(--green)" @click="resolveTicket(t.id, 'resolved')">Resolve</button>
                <button v-if="t.status !== 'closed'" class="btn btn-ghost btn-sm" style="color:var(--text-3)" @click="resolveTicket(t.id, 'closed')">Close</button>
              </div>
            </div>
          </div>
          <EmptyState v-else title="No support tickets" icon="🎧" />
        </div>
      </div>

      <!-- TRANSACTIONS -->
      <div v-if="tab === 'transactions'" class="fade-up fade-up-2">
        <div class="card" style="overflow:hidden">
          <div style="padding:20px;border-bottom:1px solid var(--border)">
            <div class="t-label">All Platform Transactions ({{ transactions.length }})</div>
          </div>
          <table v-if="transactions.length" class="data-table">
            <thead><tr><th>Type</th><th>User ID</th><th>Amount</th><th>New Balance</th><th>Date</th></tr></thead>
            <tbody>
              <tr v-for="tx in transactions" :key="tx.id">
                <td><span class="badge">{{ fmtType(tx.type) }}</span></td>
                <td class="t-mono">{{ tx.userId?.slice(0,8) }}...</td>
                <td :style="`color:${tx.amount>=0?'var(--green)':'var(--red)'};font-weight:600`" style="text-align:right">
                  {{ tx.amount >= 0 ? '+' : '' }}{{ fmt(tx.amount) }}
                </td>
                <td style="text-align:right;font-family:var(--font-display)">{{ fmt(tx.newBalance) }}</td>
                <td>{{ fmtDate(tx.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-else title="No transactions" icon="💸" />
        </div>
      </div>

      <!-- Original Payments block removed as it's handled by Transactions above -->

      <!-- FULFILLMENT -->
      <div v-if="tab === 'fulfillment'" class="fade-up fade-up-2">
        <div class="card" style="overflow:hidden">
          <div style="padding:20px;border-bottom:1px solid var(--border)">
            <div class="t-label">Order Fulfillment ({{ fulfillment.length }})</div>
          </div>
          <table v-if="fulfillment.length" class="data-table">
            <thead><tr><th>Lot / Item</th><th>Winner</th><th>Status</th><th style="text-align:right">Action</th></tr></thead>
            <tbody>
              <tr v-for="order in fulfillment" :key="order.id">
                <td>
                  <div style="font-weight:600">{{ order.auctionTitle }}</div>
                  <div class="t-mono">{{ order.id }}</div>
                </td>
                <td>
                  <div>{{ order.winnerName }}</div>
                  <div style="font-size:12px;color:var(--text-3)">{{ order.shippingAddress }}</div>
                </td>
                <td>
                  <span class="badge" :class="order.status === 'delivered' ? 'badge-live' : order.status === 'shipped' ? 'badge-orange' : 'badge-muted'">
                    {{ order.status?.toUpperCase() }}
                  </span>
                </td>
                <td style="text-align:right">
                  <button v-if="order.status === 'processing' && hasPermission('manage_fulfillment')" class="btn btn-gold btn-sm" @click="openShip(order)">Process Shipment</button>
                  <button v-else-if="order.status === 'shipped' && hasPermission('manage_fulfillment')" class="btn btn-ghost btn-sm" @click="openShip(order)">Update Tracking</button>
                  <span v-else class="t-label">{{ order.status === 'delivered' ? 'Completed' : 'Awaiting Processing' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-else title="No orders to fulfill" icon="📦" />
        </div>
      </div>

      <!-- SETTINGS -->
      <div v-if="tab === 'settings'" class="fade-up fade-up-2">
        <div class="card" style="padding:28px;max-width:600px">
          <div class="t-label" style="margin-bottom:20px">Platform Settings</div>
          <div style="display:flex;flex-direction:column;gap:24px">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;background:var(--bg-raised);border-radius:12px;border:1px solid var(--border)">
              <div>
                <div style="font-weight:600;margin-bottom:4px">Razorpay Simulation Mode</div>
                <div style="font-size:12px;color:var(--text-3)">Bypass real payment gateway for testing</div>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="platformSettings.razorpaySimulation" @change="updateSettings">
                <span class="slider round"></span>
              </label>
            </div>
            
            <div style="padding:16px;background:var(--blue-dim);border:1px solid rgba(59,130,246,0.2);border-radius:12px">
              <div style="color:var(--blue);font-size:13px;line-height:1.5">
                <strong>Admin Notice:</strong> Subscription and KYC fees are controlled via the payment gateway settings. Ensure the simulation is OFF for high-value production auctions.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AUDIT LOGS -->
      <div v-if="tab === 'logs'" class="fade-up fade-up-2">
        <!-- Auction History (Requested by user) -->
        <div class="card" style="overflow:hidden;margin-bottom:24px">
          <div style="padding:20px;border-bottom:1px solid var(--border)">
            <div class="t-label">Auction History (Closed Assets)</div>
          </div>
          <table v-if="auditLogs.auctions?.length" class="data-table">
            <thead><tr><th>Asset</th><th>Winner</th><th style="text-align:right">Final Price</th><th style="text-align:right">Closed At</th></tr></thead>
            <tbody>
              <tr v-for="a in auditLogs.auctions" :key="a.id">
                <td>
                  <div style="font-weight:600">{{ a.title }}</div>
                  <div class="t-mono" style="font-size:11px">{{ a.id }}</div>
                </td>
                <td>
                   <div style="font-size:14px">{{ a.highestBidder?.slice(0,8) || 'No Winner' }}</div>
                </td>
                <td style="text-align:right;font-weight:700">{{ fmt(a.highestBid) }}</td>
                <td style="text-align:right;color:var(--text-3)">{{ fmtDate(a.endTime) }}</td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-else title="No closed auctions found" icon="⌛" />
        </div>

        <div class="card" style="padding:32px">
          <div class="t-label" style="margin-bottom:12px">Platform Audit Logs</div>
          <p style="font-size:14px;color:var(--text-2);margin-bottom:32px">Export all sales, purchases, and system transactions for compliance and records.</p>
          
          <div class="export-grid">
            <div class="export-card" @click="exportLogs('csv')">
              <div class="export-icon">📄</div>
              <div class="export-name">CSV Spreadsheet</div>
              <div class="export-sub">Export {{ auditLogs.transactions.length }} events</div>
            </div>
            <div class="export-card" @click="exportLogs('xlsx')">
              <div class="export-icon">📊</div>
              <div class="export-name">Excel (XLSX)</div>
              <div class="export-sub">Formatted report</div>
            </div>
            <div class="export-card" @click="exportLogs('pdf')">
              <div class="export-icon">📕</div>
              <div class="export-name">PDF Report</div>
              <div class="export-sub">Official statement</div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI REPORTS -->
      <div v-if="tab === 'reports'" class="fade-up fade-up-2">
        <div class="card" style="padding:32px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px">
            <div>
              <div class="t-label" style="margin-bottom:8px">Inventory Intelligence</div>
              <p style="font-size:14px;color:var(--text-2)">AI-powered analysis of your current item names and categories.</p>
            </div>
            <button class="btn btn-gold" @click="fetchAiSummary" :disabled="aiSummaryLoading">
              {{ aiSummaryLoading ? 'Analyzing...' : 'Generate Intelligence Report ✦' }}
            </button>
          </div>

          <div v-if="aiSummary" class="ai-report-content" style="background:var(--bg-raised);padding:32px;border-radius:16px;border:1px solid var(--border);line-height:1.7;white-space:pre-wrap;font-size:15px;color:var(--text)">
            {{ aiSummary }}
          </div>
          <div v-else-if="!aiSummaryLoading" class="empty-report" style="text-align:center;padding:64px;background:var(--bg-raised);border-radius:16px;border:1px dashed var(--border)">
             <div style="font-size:40px;margin-bottom:16px">📊</div>
             <div style="font-weight:600;color:var(--text-2)">No report generated yet</div>
             <div style="font-size:13px;color:var(--text-3)">Click the button above to analyze your inventory trends.</div>
          </div>
          <div v-if="aiSummaryLoading" style="text-align:center;padding:64px">
             <div class="btn-spin" style="width:40px;height:40px;margin:0 auto 16px"></div>
             <div style="color:var(--text-3)">Gemini is studying your auction floor...</div>
          </div>
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
                  <div class="t-mono" style="margin-bottom:4px">{{ u.email }}</div>
                  <div v-if="u.kycData" style="display:flex;gap:8px" class="mt-1">
                    <a v-if="u.kycData.idUrl" :href="u.kycData.idUrl" target="_blank" class="t-label" style="text-decoration:none;color:var(--blue)">[ID View]</a>
                    <a v-if="u.kycData.selfieUrl" :href="u.kycData.selfieUrl" target="_blank" class="t-label" style="text-decoration:none;color:var(--orange)">[Selfie View]</a>
                  </div>
                </td>
                <td style="text-align:right;font-family:var(--font-display)">{{ fmt(u.credits) }}</td>
                <td style="text-align:center">
                  <span class="badge" :class="u.isVerified ? 'badge-live' : u.kycStatus === 'pending' ? 'badge-orange' : 'badge-muted'">
                    {{ u.isVerified ? 'Verified' : u.kycStatus === 'pending' ? 'Pending' : 'None' }}
                  </span>
                </td>
                <td style="text-align:right">
                  <div style="display:flex;gap:8px;justify-content:flex-end;align-items:center">
                    <span v-if="u.isFlagged" class="badge badge-red" title="Suspicious activity detected">FLAGGED</span>
                    <button v-if="u.kycStatus === 'pending' && hasPermission('manage_users')" class="btn btn-ghost btn-sm" style="color:var(--green)" @click="processKYC(u.uid,'approved')">Approve KYC</button>
                    <button v-if="(u.kycStatus === 'approved' || u.isVerified) && hasPermission('manage_users')" class="btn btn-ghost btn-sm" style="color:var(--red)" @click="cancelKYC(u.uid)">Cancel KYC</button>
                    <button v-if="u.subscriptionStatus === 'active' && hasPermission('manage_users')" class="btn btn-ghost btn-sm" style="color:var(--orange)" @click="cancelSubscription(u.uid)">Cancel Sub</button>
                    <button v-if="u.role !== 'admin' && authStore.role === 'admin'" class="btn btn-gold btn-sm" @click="promoteToAdmin(u.uid)">Make Admin</button>
                    <button v-if="u.status !== 'blocked' && hasPermission('manage_users')" class="btn btn-ghost btn-sm" style="color:var(--red)" @click="toggleUserStatus(u.uid, 'blocked')">Block</button>
                    <button v-else-if="u.status === 'blocked' && hasPermission('manage_users')" class="btn btn-ghost btn-sm" style="color:var(--green)" @click="toggleUserStatus(u.uid, 'active')">Unblock</button>
                    <button v-if="hasPermission('view_audit')" class="btn btn-ghost btn-sm" @click="openAudit(u)">Audit</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- EMPLOYEES -->
      <div v-if="tab === 'employees' && authStore.role === 'admin'" class="fade-up fade-up-2">
        <div class="card" style="overflow:hidden">
          <div style="padding:20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)">
            <div class="t-label">Employee Management ({{ employees.length }})</div>
            <button class="btn btn-gold btn-sm" @click="openAddEmployee">Add Employee</button>
          </div>
          <table v-if="employees.length" class="data-table">
            <thead><tr><th>Employee</th><th>Added At</th><th style="text-align:center">Permissions</th><th style="text-align:right">Actions</th></tr></thead>
            <tbody>
              <tr v-for="emp in employees" :key="emp.id">
                <td>
                  <div style="font-weight:600;font-size:14px">{{ emp.username }}</div>
                  <div class="t-mono">{{ emp.email }}</div>
                </td>
                <td class="t-mono" style="font-size:12px">{{ fmtDate(emp.employeeAddedAt) }}</td>
                <td style="text-align:center">
                  <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;max-width:200px">
                    <span v-for="pKey in permissionKeys" :key="pKey.key" 
                      v-show="emp.permissions?.[pKey.key]"
                      class="badge badge-live" style="font-size:10px;padding:2px 4px"
                    >{{ pKey.label }}</span>
                  </div>
                </td>
                <td style="text-align:right">
                  <div style="display:flex;gap:8px;justify-content:flex-end">
                    <button class="btn btn-ghost btn-sm" @click="openEmployeeEdit(emp)">Edit</button>
                    <button class="btn btn-danger btn-sm" @click="removeEmployee(emp.id)">Remove</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-else title="No employees added" icon="👥" subtitle="Promote users to employees to share management tasks." />
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

            <MediaUpload v-model="newAuction.imageUrl" label="Image" />

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
              <MediaUpload v-model="editItem.imageUrl" label="Image" />
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

    <!-- Ship Dialog -->
    <Teleport to="body">
      <Transition name="page">
        <div v-if="showShip" class="dialog-overlay" @click.self="showShip=false">
          <div class="dialog">
            <div class="dialog__header">
              <div class="t-label">Process Shipment</div>
              <button class="btn btn-ghost btn-sm" @click="showShip=false">✕</button>
            </div>
            <div v-if="shipOrder" style="display:flex;flex-direction:column;gap:16px;padding:24px">
              <div class="field-wrap">
                <label class="field-label">Update Shipping Address (Verified)</label>
                <textarea v-model="shipOrder.shippingAddress" class="field" rows="2"></textarea>
              </div>
              <div class="field-wrap">
                <label class="field-label">Courier Service</label>
                <input v-model="shipOrder.courierService" class="field" placeholder="e.g. BlueDart, FedEx" />
              </div>
              <div class="field-wrap">
                <label class="field-label">Tracking URL / Link</label>
                <input v-model="shipOrder.trackingUrl" class="field" placeholder="https://bluedart.com/track/..." />
              </div>
              <div style="font-size:12px;color:var(--text-3);background:var(--bg-raised);padding:10px;border-radius:8px">
                Order will be marked as <strong>SHIPPED</strong>. User will receive a notification and can mark it as delivered.
              </div>
            </div>
            <div style="display:flex;gap:10px;padding:0 24px 24px;justify-content:flex-end">
              <button class="btn btn-ghost" @click="showShip=false">Cancel</button>
              <button class="btn btn-gold" :disabled="submitting" @click="updateFulfillment">{{ submitting ? 'Updating…' : 'Confirm Shipment' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Employee Dialog (Add/Edit) -->
    <Teleport to="body">
      <Transition name="page">
        <div v-if="showEmployeeDialog" class="dialog-overlay" @click.self="showEmployeeDialog=false">
          <div class="dialog">
            <div class="dialog__header">
              <div class="t-label">{{ editingEmployee ? 'Edit Permissions' : 'Add Employee' }}</div>
              <button class="btn btn-ghost btn-sm" @click="showEmployeeDialog=false">✕</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:16px;padding:24px">
              <div v-if="!editingEmployee" class="field-wrap">
                <label class="field-label">User Email (User must be already registered)</label>
                <input v-model="employeeForm.email" required class="field" placeholder="user@example.com" />
              </div>
              <div v-else class="field-wrap">
                <label class="field-label">Permissions for {{ editingEmployee.username }}</label>
              </div>
              
              <div class="permissions-grid">
                <label v-for="p in permissionKeys" :key="p.key" class="perm-opt">
                  <input type="checkbox" v-model="employeeForm.permissions[p.key]" />
                  <span>{{ p.label }}</span>
                </label>
              </div>
            </div>
            <div style="display:flex;gap:10px;padding:0 24px 24px;justify-content:flex-end">
              <button class="btn btn-ghost" @click="showEmployeeDialog=false">Cancel</button>
              <button class="btn btn-gold" :disabled="submitting" @click="addEmployee">
                {{ submitting ? (editingEmployee ? 'Updating…' : 'Adding…') : (editingEmployee ? 'Save Permissions' : 'Add Employee') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <!-- Proposal Preview Dialog -->
    <Teleport to="body">
      <Transition name="page">
        <div v-if="showPropPreview" class="dialog-overlay" @click.self="showPropPreview=false">
          <div class="dialog">
            <div class="dialog__header">
              <div class="t-label">Proposal Details</div>
              <button class="btn btn-ghost btn-sm" @click="showPropPreview=false">✕</button>
            </div>
            <div v-if="selectedProp" style="padding:24px;display:flex;flex-direction:column;gap:16px">
              <img v-if="selectedProp.imageUrl" :src="selectedProp.imageUrl" style="width:100%;height:180px;object-fit:cover;border-radius:12px;border:1px solid var(--border)" />
              
              <div>
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
                   <span class="badge" :class="selectedProp.type === 'listing' ? 'badge-live' : 'badge-muted'">{{ selectedProp.type?.toUpperCase() }}</span>
                   <h2 style="font-size:18px;font-weight:700">{{ selectedProp.title }}</h2>
                </div>
                <p style="font-size:14px;color:var(--text-2);line-height:1.6">{{ selectedProp.description }}</p>
              </div>

              <div v-if="selectedProp.type === 'listing'" style="background:var(--bg-raised);padding:16px;border-radius:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div><div class="t-label" style="font-size:10px">Starting Price</div><div style="font-weight:600">{{ fmt(selectedProp.minBid || selectedProp.startingPrice) }}</div></div>
                <div><div class="t-label" style="font-size:10px">Duration</div><div style="font-weight:600">{{ selectedProp.duration }}h</div></div>
                <div><div class="t-label" style="font-size:10px">Category</div><div style="font-weight:600">{{ selectedProp.category }}</div></div>
                <div><div class="t-label" style="font-size:10px">Seller</div><div style="font-weight:600">{{ selectedProp.sellerName || selectedProp.userId }}</div></div>
              </div>

              <div style="font-size:12px;color:var(--text-3)">
                Submitted at: {{ fmtDate(selectedProp.submittedAt || selectedProp.createdAt) }}
              </div>
            </div>
            <div v-if="selectedProp && hasPermission('manage_proposals')" style="display:flex;gap:12px;padding:0 24px 24px;justify-content:flex-end">
               <button class="btn btn-danger" @click="selectedProp.source === 'auction' ? reviewProposal(selectedProp.id, false) : approveProposal(selectedProp.id, 'rejected')">Reject Proposal</button>
               <button class="btn btn-gold" @click="selectedProp.source === 'auction' ? reviewProposal(selectedProp.id, true) : approveProposal(selectedProp.id, 'approved')">Approve & Publish</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <!-- Support Ticket Conversation Dialog -->
    <Teleport to="body">
      <Transition name="page">
        <div v-if="showTicketDetail" class="dialog-overlay" @click.self="showTicketDetail=false">
          <div class="dialog dialog--wide">
            <div class="dialog__header">
              <div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="badge" :class="selectedTicket?.status">{{ selectedTicket?.status?.toUpperCase() }}</span>
                  <div class="t-label">Conversation</div>
                </div>
                <div style="font-size:14px;color:var(--text-2);margin-top:4px">{{ selectedTicket?.subject }}</div>
              </div>
              <button class="btn btn-ghost btn-sm" @click="showTicketDetail=false">✕</button>
            </div>
            
            <div class="dialog__body ticket-chat-admin" style="max-height:450px;overflow-y:auto;padding:24px;background:var(--bg-page)">
              <div v-if="!selectedTicket" style="padding:40px;text-align:center"><v-progress-circular indeterminate color="var(--gold)"></v-progress-circular></div>
              <template v-else>
                <!-- Initial Message -->
                <div class="chat-item chat-item--user" style="display:flex;flex-direction:column;align-items:flex-start;margin-bottom:20px">
                  <div class="chat-bubble" style="background:var(--bg-raised);padding:14px;border-radius:12px;max-width:85%;border:1px solid var(--border)">
                    <div class="chat-meta" style="font-size:11px;color:var(--text-3);margin-bottom:6px"><strong>{{ selectedTicket.username }}</strong> • {{ fmtDate(selectedTicket.createdAt) }}</div>
                    <div class="chat-text" style="font-size:14px;color:var(--text);line-height:1.5">{{ selectedTicket.message }}</div>
                  </div>
                </div>
                <!-- Replies -->
                <div v-for="r in selectedTicket.replies" :key="r.id" 
                  class="chat-item" :class="r.isAdminReply ? 'chat-item--admin' : 'chat-item--user'"
                  :style="`display:flex;flex-direction:column;align-items:${r.isAdminReply?'flex-end':'flex-start'};margin-bottom:20px`"
                >
                  <div class="chat-bubble" :style="`background:${r.isAdminReply?'var(--gold-dim)':'var(--bg-raised)'};padding:14px;border-radius:12px;max-width:85%;border:1px solid ${r.isAdminReply?'var(--gold-border)':'var(--border)'}`">
                    <div class="chat-meta" style="font-size:11px;color:var(--text-3);margin-bottom:6px"><strong>{{ r.isAdminReply ? 'Support Team' : r.username }}</strong> • {{ fmtDate(r.createdAt) }}</div>
                    <div class="chat-text" style="font-size:14px;color:var(--text);line-height:1.5">{{ r.message }}</div>
                  </div>
                </div>
              </template>
            </div>

            <div v-if="selectedTicket && selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed'" 
              class="dialog__footer d-flex flex-column gap-3" style="padding:20px;background:var(--bg-card);border-top:1px solid var(--border)">
              <textarea v-model="replyMessage" class="field" rows="3" placeholder="Type a message to the user..."></textarea>
              <div class="d-flex justify-space-between align-center">
                <div class="d-flex gap-2">
                   <button class="btn btn-ghost btn-sm" style="color:var(--green)" @click="resolveTicket(selectedTicket.id, 'resolved')">Resolve Ticket</button>
                </div>
                <button class="btn btn-gold" :disabled="replying || !replyMessage.trim()" @click="submitAdminReply">
                  {{ replying ? 'Sending...' : 'Send Reply' }}
                </button>
              </div>
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

/* Switch Toggle */
.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; background-color: var(--border-strong); transition: .4s; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
input:checked + .slider { background-color: var(--gold); }
input:checked + .slider:before { transform: translateX(20px); }
.slider.round { border-radius: 34px; }
.slider.round:before { border-radius: 50%; }

/* Dialog */
.dialog-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:300; display:flex; align-items:center; justify-content:center; padding:24px; }
.dialog { background:var(--bg-card); border:1px solid var(--border-md); border-radius:var(--r-lg); width:100%; max-width:560px; }
.dialog--wide { max-width:720px; }
.dialog__header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px; border-bottom:1px solid var(--border); }

.permissions-grid { 
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; 
  padding: 16px; background: var(--bg-raised); border-radius: 12px; border: 1px solid var(--border);
}
.perm-opt { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-2); cursor: pointer; }
.perm-opt input { width: 16px; height: 16px; accent-color: var(--gold); }


.export-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.export-card { 
  background:var(--bg-raised); border:1px solid var(--border); border-radius:16px; padding:24px; text-align:center; 
  cursor:pointer; transition:all 0.2s; 
}
.export-card:hover { border-color:var(--gold); transform:translateY(-4px); background:var(--bg-hover); }
.export-icon { font-size:32px; margin-bottom:12px; }
.export-name { font-weight:700; color:var(--text); margin-bottom:4px; }
.export-sub { font-size:12px; color:var(--text-3); }

@media (max-width:768px) { .two-col { grid-template-columns:1fr; } .export-grid { grid-template-columns:1fr; } }
</style>