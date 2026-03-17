<!-- FILE: frontend/src/pages/Profile.vue -->
<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'
import api from '../services/api'
import MediaUpload from '../components/MediaUpload.vue'

const openSubscriptionModal = inject('openSubscriptionModal', () => {})

const authStore = useAuthStore()
const notification = useNotification()
const wonItems = ref([])
const notifications = ref([])
const activeTab = ref('account')

const kycLoading = ref(false)
const kycForm = ref({
  idType: 'Aadhaar',
  idNumber: '',
  idUrl: '',
  selfieUrl: ''
})
const showKycForm = ref(false)

const tier = computed(() => {
  if (authStore.user?.subscriptionStatus === 'active') {
    return authStore.user?.membershipTier || 'Silver'
  }
  return authStore.user?.membershipTier || 'Bronze'
})
const commissionRate = computed(() => {
  if (authStore.user?.subscriptionStatus === 'active') return 0
  return { Gold: 1, Silver: 3, Bronze: 5 }[tier.value] || 5
})
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const tierColor = computed(() => ({ Gold: 'var(--gold)', Silver: '#9BA3AF', Bronze: '#D97706' }[tier.value] || 'var(--orange)'))
const tierBg    = computed(() => ({ Gold: 'var(--gold-dim)', Silver: 'rgba(155,163,175,0.1)', Bronze: 'rgba(217,119,6,0.1)' }[tier.value] || 'var(--orange-dim)'))

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
const fmtDate = (ts) => {
  if (!ts) return 'N/A'
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  } catch { return 'N/A' }
}

const tabs = [
  { id: 'account',       label: 'Account',       icon: '◎' },
  { id: 'wins',          label: 'Won Items',      icon: '★' },
  { id: 'notifications', label: 'Notifications',  icon: '◉' },
  { id: 'preferences',   label: 'Preferences',    icon: '⊙' },
]

const submitKYC = async () => {
  if (!kycForm.value.idUrl) return notification.add('Please upload your ID document', 'error')
  kycLoading.value = true
  try {
    await api.post('/api/users/kyc/submit', kycForm.value)
    notification.add('KYC documents submitted for review!', 'success')
    showKycForm.value = false
  } catch (err) {
    notification.add('Submission failed: ' + (err.response?.data?.error || err.message), 'error')
  } finally {
    kycLoading.value = false
  }
}


const subscribe = async (plan) => {
  try {
    await api.post('/api/users/subscription', { plan, amount: 1000 }) // Example amount
    notification.add(`Subscribed to ${plan} plan!`, 'success')
  } catch { notification.add('Subscription failed.', 'error') }
}

const unsubscribe = async () => {
  try {
    await api.delete('/api/users/subscription')
    notification.add('Unsubscribed successfully.', 'success')
  } catch { notification.add('Failed to unsubscribe.', 'error') }
}

const logout = async () => {
  try {
    await authStore.logout()
    notification.add('Logged out successfully.', 'success')
  } catch { notification.add('Logout failed.', 'error') }
}

const confirmReceipt = async (id) => {
  try { await api.post(`/api/auctions/${id}/confirm-receipt`); notification.add('Escrow released.', 'success'); loadData() }
  catch { notification.add('Failed.', 'error') }
}

const downloadCert = async (id) => {
  try {
    const res = await api.get(`/api/auctions/${id}/certificate`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a'); a.href = url; a.download = `Certificate_${id.slice(0,8)}.pdf`; a.click()
  } catch { notification.add('Could not download certificate.', 'error') }
}

const markRead = async (id) => {
  try { await api.post(`/api/notifications/${id}/read`); loadData() } catch {}
}

const markAllRead = async () => {
  try {
    await Promise.all(notifications.value.filter(n => !n.read).map(n => api.post(`/api/notifications/${n.id}/read`)))
    loadData()
  } catch {}
}

const loadData = async () => {
  try {
    const [aRes, nRes] = await Promise.all([api.get('/api/auctions'), api.get('/api/notifications')])
    wonItems.value = aRes.data.filter(a => a.highestBidder === authStore.user?.uid && a.status === 'closed')
    notifications.value = nRes.data
  } catch {}
}

onMounted(loadData)
</script>

<template>
  <div class="profile-page">
    <div class="page-wrap">

      <!-- PROFILE HERO -->
      <div class="profile-hero fade-up">
        <div class="profile-hero__glow" :style="`background: radial-gradient(ellipse 60% 120% at 0% 50%, ${tierBg} 0%, transparent 70%)`"></div>
        <div class="profile-hero__inner">
          <div class="avatar-wrap">
            <div class="avatar">{{ (authStore.user?.username || 'U')[0].toUpperCase() }}</div>
            <div v-if="authStore.user?.isVerified" class="avatar-verified" title="Verified">✓</div>
          </div>
          <div class="profile-hero__info">
            <div class="hero-username">{{ authStore.user?.username }}</div>
            <div class="hero-email">{{ authStore.user?.email }}</div>
            <div class="hero-chips">
              <span class="hero-chip" :style="`background:${tierBg};border-color:${tierColor}30;color:${tierColor}`">
                {{ tier }} Member
              </span>
              <span class="hero-chip">Since {{ fmtDate(authStore.user?.createdAt) }}</span>
              <span v-if="authStore.user?.isVerified" class="hero-chip hero-chip--green">✓ KYC Verified</span>
              <span v-else-if="authStore.user?.kycStatus === 'pending'" class="hero-chip hero-chip--orange">⏳ Pending Verification</span>
            </div>
          </div>
          <div class="profile-hero__stats">
            <div class="hero-stat">
              <div class="hero-stat__val">{{ wonItems.length }}</div>
              <div class="hero-stat__label">Items Won</div>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <div class="hero-stat__val">{{ commissionRate }}%</div>
              <div class="hero-stat__label">Platform Fee</div>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <div class="hero-stat__val" :class="unreadCount ? 'hero-stat__val--orange' : ''">{{ unreadCount }}</div>
              <div class="hero-stat__label">Unread</div>
            </div>
          </div>
        </div>
      </div>

      <!-- TABS -->
      <div class="tabs-bar fade-up fade-up-1">
        <button v-for="t in tabs" :key="t.id"
          class="tab-btn" :class="{'tab-btn--active': activeTab === t.id}"
          @click="activeTab = t.id">
          <span class="tab-btn__icon">{{ t.icon }}</span>
          {{ t.label }}
          <span v-if="t.id === 'notifications' && unreadCount" class="tab-badge">{{ unreadCount }}</span>
        </button>
      </div>

      <!-- TAB PANELS -->
      <Transition name="panel" mode="out-in">

        <!-- ACCOUNT -->
        <div v-if="activeTab === 'account'" key="account" class="panel fade-up">
          <div class="panel-grid">
            <div class="info-card">
              <div class="card-section-label">Identity</div>
              <div class="detail-row"><span class="detail-key">Username</span><span class="detail-val">{{ authStore.user?.username }}</span></div>
              <div class="detail-row"><span class="detail-key">Email</span><span class="detail-val">{{ authStore.user?.email }}</span></div>
              <div class="detail-row"><span class="detail-key">Membership</span>
                <span :style="`color:${tierColor};font-weight:600`">{{ tier }}</span>
              </div>
              <div class="detail-row"><span class="detail-key">Platform fee</span><span class="detail-val">{{ commissionRate }}%</span></div>
              <div class="detail-row" style="border:none"><span class="detail-key">KYC Status</span>
                <span class="status-badge"
                  :class="authStore.user?.isVerified ? 'status-badge--green' : authStore.user?.kycStatus === 'pending' ? 'status-badge--orange' : 'status-badge--muted'">
                  {{ authStore.user?.isVerified ? 'Verified' : authStore.user?.kycStatus === 'pending' ? 'Pending' : 'Unverified' }}
                </span>
              </div>
            </div>

            <div v-if="!authStore.user?.isVerified" class="kyc-card">
              <div v-if="authStore.user?.kycStatus === 'pending'" class="kyc-pending">
                <div class="kyc-pending__icon">⏳</div>
                <div class="kyc-pending__title">Verification In Progress</div>
                <div class="kyc-pending__sub">Admin is reviewing your submission. You'll be notified once it's complete.</div>
              </div>
              <div v-else-if="!showKycForm" class="kyc-prompt">
                <div class="kyc-prompt__icon">🛡</div>
                <div class="kyc-prompt__title">Verify Your Identity</div>
                <div class="kyc-prompt__sub">Unlock premium and government-repossession auctions by completing KYC verification.</div>
                <ul class="kyc-perks">
                  <li>✓ Access to premium lots</li>
                  <li>✓ Higher bid limits</li>
                  <li>✓ Trusted bidder badge</li>
                </ul>
                <button class="btn-kyc" @click="showKycForm = true">
                  Complete KYC Now
                </button>
              </div>
              <div v-else class="kyc-form-wrap">
                <div class="d-flex align-center justify-space-between mb-4">
                  <div class="kyc-form-title">Identity Verification</div>
                  <v-btn icon="mdi-close" variant="text" size="small" @click="showKycForm = false"></v-btn>
                </div>

                <div class="d-flex flex-column gap-4">
                  <div class="field-wrap">
                    <label class="field-label">Document Type</label>
                    <select v-model="kycForm.idType" class="field">
                      <option>Aadhaar</option>
                      <option>PAN Card</option>
                      <option>Passport</option>
                      <option>Driver License</option>
                    </select>
                  </div>

                  <div class="field-wrap">
                    <label class="field-label">Document Number (Optional)</label>
                    <input v-model="kycForm.idNumber" class="field" placeholder="e.g. XXXX-XXXX-XXXX" />
                  </div>

                  <MediaUpload
                    v-model="kycForm.idUrl"
                    label="Upload ID Document (Image or PDF)"
                    accept="image/*,application/pdf"
                    mode="pdf"
                  />

                  <MediaUpload
                    v-model="kycForm.selfieUrl"
                    label="Selfie for Face Verification"
                    accept="image/*"
                    mode="image"
                  />

                  <button class="btn-kyc mt-2" :disabled="kycLoading" @click="submitKYC">
                    <span v-if="kycLoading" class="btn-spin"></span>
                    {{ kycLoading ? 'Submitting…' : 'Submit for Review' }}
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="kyc-card kyc-card--verified">
              <div style="font-size:40px;margin-bottom:12px">🛡</div>
              <div class="kyc-prompt__title">Identity Verified</div>
              <div class="kyc-prompt__sub">You have full access to all auction categories.</div>
            </div>

            <!-- SUBSCRIPTION & ACTIONS -->
            <div class="subscription-card">
              <div class="card-section-label">Subscription</div>
              <div v-if="authStore.user?.subscriptionStatus === 'active'" class="subscription-active-banner">
                <div class="sub-active__glow"></div>
                <div class="sub-active__badge">✦ PRO</div>
                <div class="sub-active__title">BidWars Pro Member</div>
                <div class="sub-active__plan">
                  {{ authStore.user?.subscriptionPlan === 'yearly' ? 'Annual Plan' : 'Monthly Plan' }}
                </div>
                <div class="sub-active__features">
                  <div class="sub-active__feature"><span>💸</span> <strong>0% platform fee</strong> on all wins</div>
                  <div class="sub-active__feature"><span>⚡</span> Priority bid processing</div>
                  <div class="sub-active__feature"><span>👑</span> {{ tier }} tier membership</div>
                  <div class="sub-active__feature"><span>🔓</span> Exclusive auction access</div>
                </div>
                <button class="btn-cancel-sub" @click="unsubscribe">Cancel Subscription</button>
              </div>
              <div v-else class="subscription-upsell" @click="openSubscriptionModal('general')">
                <div class="upsell-icon">✦</div>
                <div class="upsell-content">
                  <div class="upsell-title">Upgrade to Pro</div>
                  <div class="upsell-sub">Remove all platform fees & unlock exclusive features</div>
                  <div class="upsell-perks">
                    <span>0% fees</span>
                    <span>Priority bids</span>
                    <span>Analytics</span>
                  </div>
                </div>
                <div class="upsell-arrow">→</div>
              </div>
            </div>

            <div class="actions-card">
              <div class="card-section-label">Account Actions</div>
              <button class="btn-action-secondary" @click="logout">
                Logout
              </button>
            </div>
          </div>
        </div>

        <!-- WON ITEMS -->
        <div v-else-if="activeTab === 'wins'" key="wins" class="panel fade-up">
          <div v-if="wonItems.length" class="wins-grid">
            <div v-for="(item, i) in wonItems" :key="item.id"
              class="win-card" :style="`animation-delay:${i*0.05}s`">
              <div class="win-card__img">
                <img :src="item.imageUrl || 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?w=400&q=80'" :alt="item.title" />
              </div>
              <div class="win-card__body">
                <div class="win-card__title">{{ item.title }}</div>
                <div class="win-card__price">{{ fmt(item.highestBid) }}</div>
                <div class="win-card__status">
                  <span class="status-badge" :class="item.escrowStatus === 'released' ? 'status-badge--green' : 'status-badge--orange'">
                    {{ item.escrowStatus === 'released' ? 'Delivered' : 'In Escrow' }}
                  </span>
                </div>
                <div class="win-card__actions">
                  <button v-if="item.escrowStatus === 'held'" class="btn-action btn-action--primary" @click="confirmReceipt(item.id)">
                    Confirm Receipt
                  </button>
                  <button v-if="item.escrowStatus === 'released'" class="btn-action" @click="downloadCert(item.id)">
                    ↓ Certificate
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-panel">
            <div class="empty-panel__icon">★</div>
            <div class="empty-panel__title">No wins yet</div>
            <div class="empty-panel__sub">Start bidding to win your first item</div>
            <router-link to="/auctions" class="btn-action btn-action--primary" style="margin-top:16px;display:inline-flex">
              Browse Auctions →
            </router-link>
          </div>
        </div>

        <!-- NOTIFICATIONS -->
        <div v-else-if="activeTab === 'notifications'" key="notifications" class="panel fade-up">
          <div class="notif-card">
            <div v-if="unreadCount" class="notif-actions">
              <span style="font-size:13px;color:var(--text-2)">{{ unreadCount }} unread</span>
              <button class="btn-text" @click="markAllRead">Mark all read</button>
            </div>
            <TransitionGroup v-if="notifications.length" name="tx" tag="div">
              <div v-for="n in notifications" :key="n.id"
                class="notif-row" :class="{'notif-row--unread': !n.read}">
                <div class="notif-dot" :class="n.read ? 'notif-dot--read' : 'notif-dot--unread'"></div>
                <div class="notif-content">
                  <div class="notif-msg">{{ n.message }}</div>
                  <div class="notif-date">{{ fmtDate(n.createdAt) }}</div>
                </div>
                <button v-if="!n.read" class="btn-text" @click="markRead(n.id)">Read</button>
              </div>
            </TransitionGroup>
            <div v-else class="empty-panel" style="padding:40px">
              <div class="empty-panel__icon">◉</div>
              <div class="empty-panel__title">All caught up</div>
              <div class="empty-panel__sub">No notifications yet</div>
            </div>
          </div>
        </div>

        <!-- PREFERENCES -->
        <div v-else-if="activeTab === 'preferences'" key="preferences" class="panel fade-up">
          <div class="pref-card">
            <div class="card-section-label">Notification Settings</div>
            <div class="pref-row">
              <div class="pref-row__info">
                <div class="pref-row__title">SMS Notifications</div>
                <div class="pref-row__sub">Get outbid alerts and auction reminders via SMS</div>
              </div>
              <label class="toggle">
                <input type="checkbox"
                  :checked="authStore.user?.preferences?.smsNotifications"
                  @change="authStore.updatePreferences({ smsNotifications: $event.target.checked })" />
                <span class="toggle-track"></span>
              </label>
            </div>

            <div class="card-section-label" style="margin-top:24px">Bidding Settings</div>
            <div class="pref-row">
              <div class="pref-row__info">
                <div class="pref-row__title">Confidential Bidding</div>
                <div class="pref-row__sub">Hide your username from other bidders in live auctions</div>
              </div>
              <label class="toggle">
                <input type="checkbox"
                  :checked="authStore.user?.preferences?.confidentialBidding"
                  @change="authStore.updatePreferences({ confidentialBidding: $event.target.checked })" />
                <span class="toggle-track"></span>
              </label>
            </div>
            <div class="pref-row" style="border:none">
              <div class="pref-row__info">
                <div class="pref-row__title">Two-Factor Authentication</div>
                <div class="pref-row__sub">Add an extra layer of security to your account</div>
              </div>
              <label class="toggle">
                <input type="checkbox"
                  :checked="authStore.user?.preferences?.twoFactor"
                  @change="authStore.updatePreferences({ twoFactor: $event.target.checked })" />
                <span class="toggle-track"></span>
              </label>
            </div>
          </div>
        </div>

      </Transition>
    </div>
  </div>
</template>

<style scoped>
.profile-page { min-height: 100vh; background: var(--bg); padding-bottom: 64px; }

/* HERO */
.profile-hero {
  position: relative; overflow: hidden;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 20px; margin: 32px 0 24px; padding: 32px;
}
.profile-hero__glow { position: absolute; inset: 0; pointer-events: none; }
.profile-hero__inner { position: relative; display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }

/* Avatar */
.avatar-wrap { position: relative; flex-shrink: 0; }
.avatar {
  width: 80px; height: 80px;
  background: var(--orange-dim); border: 2px solid rgba(251,146,60,0.35);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 32px; color: var(--orange);
  animation: popIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes popIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
.avatar-verified {
  position: absolute; bottom: 0; right: 0;
  width: 22px; height: 22px; background: var(--green); color: #fff;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; border: 2px solid var(--bg-card);
}

.profile-hero__info { flex: 1; min-width: 0; }
.hero-username { font-family: var(--font-display); font-size: clamp(22px, 3vw, 32px); color: var(--text); margin-bottom: 4px; }
.hero-email { font-size: 14px; color: var(--text-2); margin-bottom: 12px; }
.hero-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.hero-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600;
  background: var(--bg-raised); border: 1px solid var(--border-md);
  border-radius: 20px; padding: 4px 12px; color: var(--text-2);
}
.hero-chip--green  { background: var(--green-dim);  border-color: rgba(74,222,128,0.25);  color: var(--green); }
.hero-chip--orange { background: var(--orange-dim); border-color: rgba(251,146,60,0.25); color: var(--orange); }

.profile-hero__stats { display: flex; align-items: center; gap: 20px; flex-shrink: 0; }
.hero-stat { text-align: center; }
.hero-stat__val { font-family: var(--font-display); font-size: 28px; color: var(--text); line-height: 1; }
.hero-stat__val--orange { color: var(--orange); }
.hero-stat__label { font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }
.hero-stat__divider { width: 1px; height: 40px; background: var(--border); }

/* TABS */
.tabs-bar { display: flex; gap: 4px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 2px; }
.tab-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 18px; border-radius: 10px; border: none;
  background: transparent; color: var(--text-2);
  font-family: var(--font-body); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
}
.tab-btn:hover { background: var(--bg-card); color: var(--text); }
.tab-btn--active { background: var(--bg-card); color: var(--text); font-weight: 600; border: 1px solid var(--border-md); }
.tab-btn__icon { font-size: 12px; }
.tab-badge {
  min-width: 18px; height: 18px; padding: 0 5px;
  background: var(--orange); color: #fff; border-radius: 9px;
  font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center;
}

/* Panel transition */
.panel-enter-active, .panel-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.panel-enter-from { opacity: 0; transform: translateY(8px); }
.panel-leave-to   { opacity: 0; }

/* ACCOUNT PANEL */
.panel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
.info-card, .kyc-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 16px; padding: 24px;
}
.kyc-card--verified { text-align: center; padding: 40px 24px; }

.card-section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); margin-bottom: 16px; }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
.detail-key { color: var(--text-2); font-size: 13px; }
.detail-val { color: var(--text); font-weight: 500; }

.status-badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
  letter-spacing: 0.05em; text-transform: uppercase;
}
.status-badge--green  { background: var(--green-dim);  color: var(--green);  border: 1px solid rgba(74,222,128,0.2); }
.status-badge--orange { background: var(--orange-dim); color: var(--orange); border: 1px solid rgba(251,146,60,0.2); }
.status-badge--muted  { background: var(--bg-raised);  color: var(--text-2); border: 1px solid var(--border-md); }

/* KYC */
.kyc-pending { text-align: center; padding: 16px 0; }
.kyc-pending__icon { font-size: 36px; margin-bottom: 12px; }
.kyc-pending__title { font-family: var(--font-display); font-size: 18px; color: var(--orange); margin-bottom: 8px; }
.kyc-pending__sub { font-size: 13px; color: var(--text-2); line-height: 1.6; }

.kyc-prompt { text-align: center; }
.kyc-prompt__icon { font-size: 40px; margin-bottom: 12px; }
.kyc-prompt__title { font-family: var(--font-display); font-size: 20px; color: var(--text); margin-bottom: 8px; }
.kyc-prompt__sub { font-size: 13px; color: var(--text-2); line-height: 1.6; margin-bottom: 16px; }
.kyc-perks { list-style: none; padding: 0; margin: 0 0 20px; display: flex; flex-direction: column; gap: 6px; align-items: center; }
.kyc-perks li { font-size: 13px; color: var(--green); }

.btn-kyc {
  width: 100%; padding: 13px; background: var(--orange); color: #fff;
  border: none; border-radius: 10px; font-family: var(--font-body); font-size: 14px; font-weight: 700;
  cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-kyc:hover:not(:disabled) { background: #f97316; transform: translateY(-1px); }
.btn-kyc:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.btn-spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.kyc-form-wrap { text-align: left; }
.kyc-form-title { font-family: var(--font-display); font-size: 18px; font-weight: 600; color: var(--text); }

/* WINS */
.wins-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.win-card {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px;
  overflow: hidden; transition: border-color 0.2s, transform 0.2s;
  animation: slideUp 0.4s ease both;
}
@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
.win-card:hover { border-color: var(--border-md); transform: translateY(-3px); }
.win-card__img { aspect-ratio: 16/9; overflow: hidden; background: var(--bg-raised); }
.win-card__img img { width: 100%; height: 100%; object-fit: cover; }
.win-card__body { padding: 16px; }
.win-card__title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.win-card__price { font-family: var(--font-display); font-size: 20px; color: var(--green); margin-bottom: 10px; }
.win-card__status { margin-bottom: 12px; }
.win-card__actions { display: flex; gap: 8px; }

.btn-action {
  flex: 1; padding: 9px 14px; border-radius: 8px; border: 1px solid var(--border-md);
  background: var(--bg-raised); color: var(--text-2); font-family: var(--font-body);
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
  text-decoration: none; text-align: center; display: flex; align-items: center; justify-content: center;
}
.btn-action:hover { background: var(--bg-hover); color: var(--text); }
.btn-action--primary { background: var(--orange); color: #fff; border-color: transparent; }
.btn-action--primary:hover { background: #f97316; }

/* NOTIFICATIONS */
.notif-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
.notif-actions {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid var(--border);
}
.btn-text { background: none; border: none; color: var(--orange); font-family: var(--font-body); font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-text:hover { color: #f97316; }

.notif-row {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 16px 20px; border-bottom: 1px solid var(--border); transition: background 0.15s;
}
.notif-row:last-child { border-bottom: none; }
.notif-row--unread { background: rgba(251,146,60,0.03); }
.notif-row:hover { background: var(--bg-raised); }
.notif-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.notif-dot--unread { background: var(--orange); box-shadow: 0 0 8px rgba(251,146,60,0.5); }
.notif-dot--read   { background: var(--border-strong); }
.notif-content { flex: 1; }
.notif-msg  { font-size: 14px; color: var(--text); line-height: 1.5; }
.notif-date { font-size: 12px; color: var(--text-3); margin-top: 3px; }
.tx-enter-active { transition: all 0.25s ease; }
.tx-enter-from   { opacity: 0; transform: translateX(-8px); }

/* SUBSCRIPTION CARD */
.subscription-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 16px; padding: 20px;
  grid-column: 1 / -1;
}

.subscription-active-banner {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 100%);
  border: 1px solid var(--gold-border); border-radius: 14px; padding: 22px;
  animation: subBannerIn 0.5s cubic-bezier(0.16,1,0.3,1);
}
@keyframes subBannerIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

.sub-active__glow {
  position: absolute; top: 0; left: 0; right: 0; height: 80px;
  background: radial-gradient(ellipse 80% 100% at 50% 0%, rgba(212,175,55,0.15) 0%, transparent 100%);
  pointer-events: none;
}
.sub-active__badge {
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--gold); color: #000;
  font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 4px 12px; border-radius: 20px; margin-bottom: 10px;
}
.sub-active__title {
  font-family: var(--font-display); font-size: 20px; color: var(--text); margin-bottom: 4px;
}
.sub-active__plan { font-size: 13px; color: var(--text-3); margin-bottom: 14px; }
.sub-active__features { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
.sub-active__feature { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-2); }
.sub-active__feature span { font-size: 16px; }
.sub-active__feature strong { color: var(--text); }

.btn-cancel-sub {
  background: none; border: 1px solid var(--border-md); color: var(--text-3);
  font-family: var(--font-body); font-size: 12px; font-weight: 600;
  padding: 7px 14px; border-radius: 8px; cursor: pointer; transition: all 0.15s;
}
.btn-cancel-sub:hover { border-color: var(--red); color: var(--red); background: var(--red-dim); }

/* UPSELL CARD */
.subscription-upsell {
  display: flex; align-items: center; gap: 16px; cursor: pointer;
  background: linear-gradient(135deg, var(--gold-dim) 0%, transparent 100%);
  border: 1.5px dashed var(--gold-border); border-radius: 14px; padding: 18px 20px;
  transition: all 0.2s;
}
.subscription-upsell:hover {
  border-color: var(--gold); background: linear-gradient(135deg, rgba(212,175,55,0.12) 0%, transparent 100%);
  transform: translateY(-1px);
}
.upsell-icon { font-size: 28px; color: var(--gold); flex-shrink: 0; }
.upsell-content { flex: 1; }
.upsell-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.upsell-sub { font-size: 13px; color: var(--text-3); margin-bottom: 8px; }
.upsell-perks { display: flex; gap: 8px; flex-wrap: wrap; }
.upsell-perks span {
  font-size: 11px; font-weight: 700; padding: 2px 9px;
  background: var(--gold-dim); border: 1px solid var(--gold-border);
  color: var(--gold); border-radius: 20px;
}
.upsell-arrow { font-size: 20px; color: var(--gold); flex-shrink: 0; transition: transform 0.2s; }
.subscription-upsell:hover .upsell-arrow { transform: translateX(4px); }

/* Actions card */
.actions-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 16px; padding: 20px;
  display: flex; flex-direction: column; gap: 10px;
}
.btn-action-secondary {
  width: 100%; padding: 11px 16px; border-radius: 10px;
  background: var(--bg-raised); border: 1px solid var(--border-md);
  color: var(--text-2); font-family: var(--font-body); font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.btn-action-secondary:hover { background: var(--bg-hover); color: var(--text); }

/* PREFERENCES */
.pref-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; max-width: 600px; }
.pref-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 16px 0; border-bottom: 1px solid var(--border); }
.pref-row:last-child { border-bottom: none; }
.pref-row__info { flex: 1; }
.pref-row__title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
.pref-row__sub   { font-size: 12px; color: var(--text-3); line-height: 1.5; }

/* Toggle */
.toggle { position: relative; cursor: pointer; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle-track {
  display: block; width: 48px; height: 26px;
  background: var(--bg-raised); border: 1px solid var(--border-md);
  border-radius: 13px; transition: background 0.2s, border-color 0.2s; position: relative;
}
.toggle-track::after {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 18px; height: 18px; background: var(--text-3); border-radius: 50%;
  transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), background 0.2s;
}
.toggle input:checked + .toggle-track { background: var(--orange-dim); border-color: rgba(251,146,60,0.4); }
.toggle input:checked + .toggle-track::after { transform: translateX(22px); background: var(--orange); }

/* Empty */
.empty-panel { padding: 52px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.empty-panel__icon  { font-size: 32px; opacity: 0.25; }
.empty-panel__title { font-family: var(--font-display); font-size: 18px; color: var(--text-2); }
.empty-panel__sub   { font-size: 13px; color: var(--text-3); }

/* RESPONSIVE */
@media (max-width: 768px) {
  .profile-hero { padding: 24px; margin: 20px 0 20px; }
  .profile-hero__stats { width: 100%; justify-content: center; padding-top: 16px; border-top: 1px solid var(--border); }
  .panel-grid { grid-template-columns: 1fr; }
  .tabs-bar { gap: 2px; }
  .tab-btn { padding: 8px 12px; font-size: 13px; }
}
@media (max-width: 480px) {
  .profile-hero__inner { gap: 16px; }
  .avatar { width: 64px; height: 64px; font-size: 26px; }
  .hero-username { font-size: 22px; }
}
</style>