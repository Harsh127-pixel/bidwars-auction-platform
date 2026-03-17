<!-- FILE: frontend/src/pages/Support.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'
import api from '../services/api'

const authStore = useAuthStore()
const notification = useNotification()
const subject = ref('')
const message = ref('')
const loading = ref(false)
const tickets = ref([])
const ticketsLoading = ref(true)

const fetchTickets = async () => {
  if (!authStore.user) return
  ticketsLoading.value = true
  try {
    const res = await api.get('/api/support/tickets')
    tickets.value = res.data
  } catch {
    // Silent fail or minimal notify
  } finally {
    ticketsLoading.value = false
  }
}

const submitTicket = async () => {
  if (!subject.value || !message.value) return
  loading.value = true
  try {
    await api.post('/api/support/tickets', { subject: subject.value, message: message.value })
    notification.add('Support ticket created. We will get back to you soon.', 'success')
    subject.value = ''
    message.value = ''
    fetchTickets()
  } catch {
    notification.add('Failed to submit ticket.', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(fetchTickets)
</script>

<template>
  <div class="support-page">
    <div class="page-wrap support-wrap">
      <div class="support-hero fade-up">
        <h1 class="support-title">How can we help?</h1>
        <p class="support-sub">Our support team is available 24/7 to assist you with any issues.</p>
      </div>

      <div class="support-grid">
        <!-- Ticket Form -->
        <div class="support-card fade-up">
          <h2 class="card-title">Open a Ticket</h2>
          <p class="card-desc">Have a question or problem? Send us a message and we'll help you out.</p>

          <form v-if="authStore.user" @submit.prevent="submitTicket" class="ticket-form">
            <div class="field-wrap">
              <label class="field-label">Subject</label>
              <input v-model="subject" type="text" placeholder="e.g. Payment Issue, Item Not Received" required class="field" />
            </div>
            <div class="field-wrap">
              <label class="field-label">Message</label>
              <textarea v-model="message" rows="5" placeholder="Please provide as much detail as possible..." required class="field"></textarea>
            </div>
            <button type="submit" class="btn-submit" :disabled="loading">
              {{ loading ? 'Submitting...' : 'Send Message' }}
            </button>
          </form>
          <div v-else class="login-prompt">
            <p>Please <router-link to="/login">sign in</router-link> to open a support ticket.</p>
          </div>
        </div>

        <!-- My Tickets -->
        <div v-if="authStore.user" class="support-card fade-up fade-up-1">
          <h2 class="card-title">My Tickets</h2>
          <p class="card-desc">Track your open and resolved support requests.</p>

          <div v-if="ticketsLoading" class="ticket-list">
            <div v-for="n in 3" :key="n" class="ticket-skel"></div>
          </div>
          <div v-else-if="tickets.length" class="ticket-list">
            <div v-for="t in tickets" :key="t.id" class="ticket-row">
              <div class="ticket-info">
                <div class="ticket-subject">{{ t.subject }}</div>
                <div class="ticket-meta">#{{ t.id.slice(0,8).toUpperCase() }} • {{ new Date(t.createdAt).toLocaleDateString() }}</div>
              </div>
              <div class="ticket-status" :class="t.status">{{ t.status.toUpperCase() }}</div>
            </div>
          </div>
          <div v-else class="empty-tickets">
            <p>You have no active tickets.</p>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="support-card fade-up fade-up-2">
          <h2 class="card-title">Alternative Contact</h2>
          <div class="contact-methods">
            <div class="contact-item">
              <span class="contact-icon">📞</span>
              <div class="contact-body">
                <div class="contact-label">Phone Support</div>
                <div class="contact-val">+91 1800 123 4567</div>
              </div>
            </div>
            <div class="contact-item">
              <span class="contact-icon">📧</span>
              <div class="contact-body">
                <div class="contact-label">Email</div>
                <div class="contact-val">support@bidwars.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.support-page { min-height: 100vh; background: var(--bg); padding: 60px 0; }
.support-wrap { max-width: 1100px; }
.support-hero { text-align: center; margin-bottom: 60px; }
.support-title { font-family: var(--font-display); font-size: 48px; color: var(--text); margin-bottom: 12px; }
.support-sub { font-size: 18px; color: var(--text-2); }

.support-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 32px; }

.support-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 32px; height: fit-content; }
.card-title { font-family: var(--font-display); font-size: 24px; color: var(--text); margin-bottom: 8px; }
.card-desc { font-size: 14px; color: var(--text-3); margin-bottom: 24px; }

.ticket-form { display: flex; flex-direction: column; gap: 20px; }
.btn-submit {
  padding: 14px; background: var(--orange); color: #fff; border: none; border-radius: 12px;
  font-family: var(--font-body); font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s;
}
.btn-submit:hover { background: #f97316; }

.ticket-list { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
.ticket-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px; background: var(--bg-raised); border: 1px solid var(--border); border-radius: 12px;
}
.ticket-subject { font-size: 14px; font-weight: 600; color: var(--text); }
.ticket-meta { font-size: 11px; color: var(--text-3); margin-top: 2px; }
.ticket-status { font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px; }
.ticket-status.open { background: var(--blue-dim); color: var(--blue); }
.ticket-status.closed { background: var(--bg-hover); color: var(--text-3); }
.ticket-status.resolved { background: var(--green-dim); color: var(--green); }

.contact-methods { display: flex; flex-direction: column; gap: 24px; }
.contact-item { display: flex; align-items: center; gap: 16px; }
.contact-icon { font-size: 24px; width: 48px; height: 48px; background: var(--bg-raised); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.contact-label { font-size: 12px; color: var(--text-3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.contact-val { font-size: 15px; color: var(--text); font-weight: 600; }

.login-prompt { text-align: center; padding: 40px 0; color: var(--text-2); }
.login-prompt a { color: var(--orange); font-weight: 700; text-decoration: none; }

.ticket-skel { height: 60px; background: var(--bg-raised); border-radius: 12px; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

@media (max-width: 900px) {
  .support-grid { grid-template-columns: 1fr; }
  .support-card:nth-child(2) { order: 3; }
}
</style>
