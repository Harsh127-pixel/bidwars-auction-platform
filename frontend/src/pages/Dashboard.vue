<!-- FILE: frontend/src/pages/Dashboard.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'
import api from '../services/api'


const authStore    = useAuthStore()
const notification = useNotification()
const auctions     = ref([])
const orders       = ref([])
const loading      = ref(true)
const processing   = ref(false)
const showAddFunds = ref(false)
const topupAmount  = ref(100)
const disputeId    = ref(null)
const disputeReason = ref('')
const showDisputeModal = ref(false)

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

const activeBids = computed(() =>
  auctions.value.filter(a => a.highestBidder === authStore.user?.uid && a.status === 'active')
)
const wonItems = computed(() =>
  auctions.value.filter(a => a.highestBidder === authStore.user?.uid && a.status === 'closed')
)
const totalBidValue = computed(() =>
  activeBids.value.reduce((sum, a) => sum + (a.highestBid || 0), 0)
)

const openDispute = (id) => { disputeId.value = id; disputeReason.value = ''; showDisputeModal.value = true }
const submitDispute = async () => {
  if (!disputeReason.value.trim()) return
  try {
    await api.post('/api/disputes', { auctionId: disputeId.value, reason: disputeReason.value })
    notification.add('Dispute filed. Support will review shortly.', 'success')
    showDisputeModal.value = false
  } catch { notification.add('Failed to file dispute.', 'error') }
}

const fetchOrders = async () => {
  try {
    const res = await api.get('/api/users/orders')
    orders.value = res.data
  } catch {}
}

const markDelivered = async (orderId) => {
  if (!confirm('Have you received this item?')) return
  processing.value = true
  try {
    await api.put(`/api/users/orders/${orderId}/delivered`)
    notification.add('Item marked as delivered. Enjoy!', 'success')
    fetchOrders()
  } catch { notification.add('Action failed', 'error') }
  finally { processing.value = false }
}
const handleAddFunds = async () => {
  if (!topupAmount.value || topupAmount.value < 100) return notification.add('Min amount ₹100', 'error')
  processing.value = true
  try {
    // We reuse the existing payment logic. Since Wallet.vue has the full UI, 
    // here we just simulate a direct server call or redirect.
    // For now, let's keep it simple as requested - a direct credit simulation for the dashboard "quick add"
    await api.post('/api/payments/create-order', { amount: topupAmount.value })
    notification.add(`Order for ₹${topupAmount.value} initiated. Redirecting to Wallet...`, 'info')
    window.location.href = '/wallet'
  } catch { notification.add('Action failed', 'error') }
  finally { processing.value = false }
}

onMounted(async () => {
  try {
    const res = await api.get('/api/auctions')
    auctions.value = res.data
    await fetchOrders()
  } catch {}
  finally { loading.value = false }
})
</script>

<template>
  <div class="dash-page">
    <div class="page-wrap">

      <!-- HERO GREETING -->
      <div class="dash-hero fade-up">
        <div class="dash-hero__glow"></div>
        <div class="dash-hero__inner">
          <div>
            <div class="dash-eyebrow">My Dashboard</div>
            <h1 class="dash-greeting">Hello, {{ authStore.user?.username || 'Bidder' }} 👋</h1>
            <p class="dash-sub">Track your live bids, wins, and account balance.</p>
          </div>
          <router-link to="/auctions" class="btn-browse">Browse Auctions →</router-link>
        </div>
      </div>

      <!-- STAT TILES -->
      <div class="stat-grid fade-up fade-up-1">
        <div class="stat-tile stat-tile--featured">
          <div class="stat-tile__label">Available Balance</div>
          <div class="stat-tile__val stat-tile__val--large">{{ fmt(authStore.user?.credits) }}</div>
          <div class="stat-tile__sub">{{ fmt(authStore.user?.heldCredits) }} held in escrow</div>
          <router-link to="/wallet" class="stat-tile__cta">
            Add Funds +
          </router-link>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__icon stat-tile__icon--green">⚡</div>
          <div class="stat-tile__val">{{ activeBids.length }}</div>
          <div class="stat-tile__label">Active Bids</div>
          <div class="stat-tile__sub">{{ fmt(totalBidValue) }} committed</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__icon stat-tile__icon--orange">★</div>
          <div class="stat-tile__val">{{ wonItems.length }}</div>
          <div class="stat-tile__label">Items Won</div>
          <div class="stat-tile__sub">All time</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__icon stat-tile__icon--blue">◈</div>
          <div class="stat-tile__val">{{ authStore.user?.reputation || 100 }}</div>
          <div class="stat-tile__label">Reputation</div>
          <div class="stat-tile__sub">{{ authStore.user?.membershipTier || 'Bronze' }} tier</div>
        </div>
      </div>



      <!-- KYC BANNER -->
      <Transition name="banner">
        <div v-if="!authStore.user?.isVerified" class="kyc-banner fade-up fade-up-2">
          <div class="kyc-banner__icon">🛡</div>
          <div class="kyc-banner__body">
            <div class="kyc-banner__title">Complete Identity Verification</div>
            <div class="kyc-banner__sub">Unlock premium and government-repossession lots.</div>
          </div>
          <router-link to="/profile" class="btn-verify">Verify Now →</router-link>
        </div>
      </Transition>

      <!-- ACTIVE BIDS -->
      <div class="section fade-up fade-up-3">
        <div class="section-head">
          <h2 class="section-title">Active Bids</h2>
          <router-link to="/auctions" class="section-link">Browse More →</router-link>
        </div>

        <div v-if="loading" class="bid-skel-list">
          <div v-for="n in 3" :key="n" class="bid-skel"></div>
        </div>

        <div v-else-if="activeBids.length" class="bid-list">
          <TransitionGroup name="row">
            <div v-for="a in activeBids" :key="a.id" class="bid-row">
              <div class="bid-row__info">
                <div class="bid-row__title">{{ a.title }}</div>
                <div class="bid-row__id">{{ a.id.slice(0,8).toUpperCase() }}</div>
              </div>
              <div class="bid-row__mid">
                <div class="bid-row__bid">{{ fmt(a.highestBid) }}</div>
                <div class="bid-row__label">Your bid</div>
              </div>
              <div class="bid-row__status">
                <span class="status-dot"></span> Live
              </div>
              <router-link :to="'/auction/' + a.id" class="btn-view">View →</router-link>
            </div>
          </TransitionGroup>
        </div>

        <div v-else class="section-empty">
          <div class="section-empty__icon">◈</div>
          <div class="section-empty__title">No active bids</div>
          <div class="section-empty__sub">Find something worth bidding on</div>
          <router-link to="/auctions" class="btn-browse-sm">Browse Auctions →</router-link>
        </div>
      </div>

      <!-- MY ORDERS -->
      <div v-if="orders.length" class="section fade-up fade-up-4">
        <div class="section-head">
          <h2 class="section-title">Shipping & Fulfillment</h2>
        </div>
        <div class="bid-list">
          <div v-for="o in orders" :key="o.id" class="bid-row" style="align-items: flex-start;">
            <div class="bid-row__info">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span class="badge" :class="o.status==='delivered'?'badge-live':o.status==='shipped'?'badge-orange':'badge-muted'">
                  {{ o.status?.toUpperCase() }}
                </span>
                <div class="bid-row__title">{{ o.auctionTitle }}</div>
              </div>
              <div class="bid-row__id">ORDER: {{ o.id }}</div>
              
              <div v-if="o.status === 'shipped'" style="margin-top:12px;padding:12px;background:var(--bg-raised);border-radius:10px;border:1px solid var(--border)">
                <div class="t-label" style="margin-bottom:4px">Tracking Information</div>
                <div style="font-size:13px;margin-bottom:8px">Carrier: <strong>{{ o.courierService }}</strong></div>
                <a :href="o.trackingUrl" target="_blank" class="btn-tracking">Track Shipment ↗</a>
              </div>
            </div>
            
            <div style="text-align:right">
              <button v-if="o.status === 'shipped'" class="btn-delivered" :disabled="processing" @click="markDelivered(o.id)">
                Confirm Receipt
              </button>
              <div v-else-if="o.status === 'delivered'" style="color:var(--green);font-size:12px;font-weight:700">✓ DELIVERED</div>
              <div v-else style="color:var(--text-3);font-size:12px">Awaiting Dispatch</div>
            </div>
          </div>
        </div>
      </div>

      <!-- WON ITEMS -->
      <div v-if="wonItems.length" class="section fade-up fade-up-4">
        <div class="section-head">
          <h2 class="section-title">Won Items</h2>
        </div>
        <div class="bid-list">
          <div v-for="a in wonItems" :key="a.id" class="bid-row">
            <div class="bid-row__info">
              <div class="bid-row__title">{{ a.title }}</div>
              <div class="bid-row__id">{{ a.id.slice(0,8).toUpperCase() }}</div>
            </div>
            <div class="bid-row__mid">
              <div class="bid-row__bid bid-row__bid--won">{{ fmt(a.highestBid) }}</div>
              <div class="bid-row__label">Final price</div>
            </div>
            <div class="bid-row__status bid-row__status--won">✓ Won</div>
            <button class="btn-dispute" @click="openDispute(a.id)">Report Issue</button>
          </div>
        </div>
      </div>

    </div>

    <!-- DISPUTE MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDisputeModal" class="modal-overlay" @click.self="showDisputeModal = false">
          <div class="modal">
            <div class="modal-head">
              <h3 class="modal-title">Report an Issue</h3>
              <button class="modal-close" @click="showDisputeModal = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="field-wrap">
                <label class="field-label">Describe the problem</label>
                <textarea v-model="disputeReason" class="field" rows="4"
                  placeholder="e.g. Item not received, item doesn't match description…"></textarea>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn-cancel" @click="showDisputeModal = false">Cancel</button>
              <button class="btn-submit-dispute" :disabled="!disputeReason.trim()" @click="submitDispute">
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>


  </div>
</template>

<style scoped>
.dash-page { min-height: 100vh; background: var(--bg); padding-bottom: 64px; }

/* HERO */
.dash-hero {
  position: relative; overflow: hidden;
  padding: 40px 0; margin-bottom: 28px;
}
.dash-hero__glow {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 70% 120% at 0% 50%, rgba(251,146,60,0.07) 0%, transparent 60%);
}
.dash-hero__inner {
  position: relative; display: flex; align-items: center;
  justify-content: space-between; gap: 20px; flex-wrap: wrap;
}
.dash-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--orange); margin-bottom: 10px; }
.dash-greeting {
  font-family: var(--font-display); font-size: clamp(28px, 4vw, 44px);
  font-weight: 600; color: var(--text); margin-bottom: 8px;
  animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
.dash-sub { font-size: 15px; color: var(--text-2); }
.btn-browse {
  padding: 12px 22px; background: var(--orange); color: #fff;
  border: none; border-radius: 12px; font-family: var(--font-body); font-size: 14px; font-weight: 700;
  text-decoration: none; transition: all 0.2s; white-space: nowrap; flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(251,146,60,0.3);
}
.btn-browse:hover { background: #f97316; transform: translateY(-1px); }

/* STAT GRID */
.stat-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 14px; margin-bottom: 24px; }
.stat-tile {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px;
  padding: 20px 22px; display: flex; flex-direction: column; gap: 4px;
  transition: transform 0.2s, border-color 0.2s;
}
.stat-tile:hover { transform: translateY(-2px); border-color: var(--border-md); }
.stat-tile--featured {
  background: var(--orange-dim); border-color: rgba(251,146,60,0.25);
}
.stat-tile__icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 16px; margin-bottom: 8px; }
.stat-tile__icon--green  { background: var(--green-dim);  color: var(--green); }
.stat-tile__icon--orange { background: var(--orange-dim); color: var(--orange); }
.stat-tile__icon--blue   { background: var(--blue-dim);   color: var(--blue); }
.stat-tile__label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); }
.stat-tile__val { font-family: var(--font-display); font-size: 28px; color: var(--text); line-height: 1; }
.stat-tile__val--large { font-size: 36px; color: var(--orange); }
.stat-tile__sub { font-size: 12px; color: var(--text-2); margin-top: 2px; }
.stat-tile__cta {
  margin-top: 14px; font-size: 13px; font-weight: 600; color: var(--orange);
  text-decoration: none; display: inline-flex; align-items: center; gap: 4px;
  transition: gap 0.15s;
}
.stat-tile__cta:hover { gap: 8px; }

/* KYC BANNER */
.kyc-banner {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  padding: 18px 22px; margin-bottom: 28px;
  background: var(--orange-dim); border: 1px solid rgba(251,146,60,0.25); border-radius: 14px;
}
.kyc-banner__icon { font-size: 28px; flex-shrink: 0; }
.kyc-banner__body { flex: 1; }
.kyc-banner__title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
.kyc-banner__sub   { font-size: 13px; color: var(--text-2); }
.btn-verify {
  padding: 9px 18px; background: var(--orange); color: #fff;
  border-radius: 10px; font-family: var(--font-body); font-size: 13px; font-weight: 700;
  text-decoration: none; transition: background 0.15s; flex-shrink: 0;
}
.btn-verify:hover { background: #f97316; }
.banner-enter-active, .banner-leave-active { transition: all 0.3s ease; }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translateY(-8px); }

/* SECTION */
.section { margin-bottom: 36px; }
.section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-title { font-family: var(--font-display); font-size: 22px; color: var(--text); }
.section-link { font-size: 13px; color: var(--orange); font-weight: 600; text-decoration: none; }
.section-link:hover { color: #f97316; }

/* BID LIST */
.bid-list { display: flex; flex-direction: column; gap: 8px; }
.bid-row {
  display: flex; align-items: center; gap: 14px;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px;
  padding: 14px 18px; transition: border-color 0.2s, transform 0.2s;
}
.bid-row:hover { border-color: var(--border-md); transform: translateX(2px); }
.bid-row__img { width: 56px; height: 44px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
.bid-row__info { flex: 1; min-width: 0; }
.bid-row__title { font-size: 14px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bid-row__id    { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); margin-top: 2px; }
.bid-row__mid   { text-align: right; flex-shrink: 0; }
.bid-row__bid   { font-family: var(--font-display); font-size: 18px; color: var(--text); }
.bid-row__bid--won { color: var(--green); }
.bid-row__label { font-size: 11px; color: var(--text-3); }
.bid-row__status { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--green); white-space: nowrap; flex-shrink: 0; }
.bid-row__status--won { color: var(--green); }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); animation: pulse 1.5s ease infinite; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

.btn-view {
  padding: 7px 16px; background: transparent; border: 1px solid var(--border-md);
  border-radius: 8px; color: var(--text-2); font-family: var(--font-body); font-size: 13px; font-weight: 600;
  text-decoration: none; transition: all 0.15s; flex-shrink: 0;
}
.btn-view:hover { background: var(--bg-hover); color: var(--text); border-color: var(--border-strong); }
.btn-dispute {
  padding: 7px 14px; background: var(--red-dim); border: 1px solid rgba(248,113,113,0.2);
  border-radius: 8px; color: var(--red); font-family: var(--font-body); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; flex-shrink: 0;
}
.btn-dispute:hover { background: rgba(248,113,113,0.2); }

.btn-tracking {
  display: inline-block; padding: 6px 12px; background: var(--blue-dim); color: var(--blue);
  border-radius: 6px; font-size: 12px; font-weight: 700; text-decoration: none;
}
.btn-delivered {
  padding: 8px 16px; background: var(--green); color: #fff; border: none; border-radius: 8px;
  font-size: 12px; font-weight: 700; cursor: pointer; transition: transform 0.2s;
}
.btn-delivered:hover:not(:disabled) { transform: scale(1.03); background: #15803d; }

/* SKELETON */
.bid-skel-list { display: flex; flex-direction: column; gap: 8px; }
.bid-skel {
  height: 72px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }

/* EMPTY */
.section-empty { padding: 52px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.section-empty__icon  { font-size: 32px; opacity: 0.2; }
.section-empty__title { font-family: var(--font-display); font-size: 18px; color: var(--text-2); }
.section-empty__sub   { font-size: 13px; color: var(--text-3); }
.btn-browse-sm {
  margin-top: 14px; padding: 10px 20px; background: var(--orange); color: #fff;
  border-radius: 10px; font-family: var(--font-body); font-size: 13px; font-weight: 700;
  text-decoration: none; transition: background 0.15s;
}
.btn-browse-sm:hover { background: #f97316; }

/* Row transition */
.row-enter-active { transition: all 0.3s ease; }
.row-enter-from   { opacity: 0; transform: translateX(-10px); }

/* MODAL */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 400;
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.modal {
  background: var(--bg-card); border: 1px solid var(--border-md);
  border-radius: 18px; width: 100%; max-width: 460px;
}
.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid var(--border);
}
.modal-title { font-family: var(--font-display); font-size: 20px; color: var(--text); }
.modal-close {
  width: 32px; height: 32px; background: var(--bg-raised); border: none; border-radius: 50%;
  color: var(--text-2); cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 13px; transition: background 0.15s;
}
.modal-close:hover { background: var(--bg-hover); }
.modal-body { padding: 24px; }
.modal-foot {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 0 24px 24px;
}
.btn-cancel {
  padding: 10px 20px; background: var(--bg-raised); border: 1px solid var(--border-md);
  border-radius: 10px; color: var(--text-2); font-family: var(--font-body); font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { background: var(--bg-hover); color: var(--text); }
.btn-submit-dispute {
  padding: 10px 20px; background: var(--red-dim); border: 1px solid rgba(248,113,113,0.3);
  border-radius: 10px; color: var(--red); font-family: var(--font-body); font-size: 14px; font-weight: 700;
  cursor: pointer; transition: all 0.15s;
}
.btn-submit-dispute:hover:not(:disabled) { background: rgba(248,113,113,0.2); }
.btn-submit-dispute:disabled { opacity: 0.4; cursor: not-allowed; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1); }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal { transform: scale(0.95) translateY(8px); }
.modal-leave-to { opacity: 0; }

/* QUICK ADD CARD */
.quick-add-card {
  background: var(--bg-card); border: 1px solid var(--border-md); border-radius: 16px;
  padding: 24px; margin-bottom: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.quick-add-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 20px; }
.btn-quick-add {
  margin-top: 12px; padding: 12px 24px; background: var(--gold); color: #000;
  border: none; border-radius: 10px; font-family: var(--font-body); font-size: 14px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
}
.btn-quick-add:hover:not(:disabled) { transform: translateY(-1px); opacity: 0.9; }

@media (max-width: 900px) { .stat-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 480px) {
  .stat-grid { grid-template-columns: 1fr; }
  .bid-row__status { display: none; }
  .dash-hero__inner { flex-direction: column; align-items: flex-start; }
}
</style>