<!-- FILE: frontend/src/components/FloatingChat.vue -->
<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import socket from '../services/socket'

const authStore = useAuthStore()
const isOpen = ref(false)
const tickets = ref([])
const activeTicket = ref(null)
const replyText = ref('')
const loading = ref(false)
const chatBody = ref(null)
const view = ref('list') // 'list', 'chat', 'create'

const fetchTickets = async () => {
  if (!authStore.user) return
  try {
    const res = await api.get('/api/support/tickets')
    tickets.value = res.data.filter(t => t.status !== 'closed' && t.status !== 'resolved')
    
    // Auto-select if exactly one active ticket exists and we ARE in the list view
    if (tickets.value.length === 1 && view.value === 'list') {
      selectTicket(tickets.value[0])
    }
  } catch (err) { console.error('Chat fetch failed', err) }
}

const selectTicket = async (ticket) => {
  loading.value = true
  try {
    const res = await api.get(`/api/support/tickets/${ticket.id}`)
    activeTicket.value = res.data
    view.value = 'chat'
    scrollToBottom()
  } catch (err) {
    console.error('Failed to load chat', err)
  } finally {
    loading.value = false
  }
}

const startNewChat = () => {
  view.value = 'create'
}

const createTicket = async () => {
  if (!replyText.value.trim()) return
  loading.value = true
  try {
    const res = await api.post('/api/support/tickets', {
      subject: 'Chat Support Inquiry',
      message: replyText.value
    })
    replyText.value = ''
    fetchTickets()
    selectTicket(res.data)
  } catch {
    console.error('Failed to start chat')
  } finally {
    loading.value = false
  }
}

const sendReply = async () => {
  if (!replyText.value.trim() || !activeTicket.value) return
  const msg = replyText.value
  replyText.value = ''
  
  try {
    const res = await api.post(`/api/support/tickets/${activeTicket.value.id}/reply`, { message: msg })
    // Optimistic update (or wait for socket)
    if (!activeTicket.value.replies) activeTicket.value.replies = []
    activeTicket.value.replies.push(res.data)
    scrollToBottom()
  } catch {
    replyText.value = msg // restore on fail
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBody.value) {
      chatBody.value.scrollTop = chatBody.value.scrollHeight
    }
  })
}

const toggle = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    fetchTickets()
    if (activeTicket.value) scrollToBottom()
  }
}

const backToList = () => {
  activeTicket.value = null
  view.value = 'list'
  fetchTickets()
}

// Listen for 'open-support-chat' event from other pages (e.g. Wallet dispute)
onMounted(() => {
  const handleOpenChat = () => {
    isOpen.value = true
    fetchTickets()
  }
  window.addEventListener('open-support-chat', handleOpenChat)

  socket.on('ticketUpdate', (data) => {
    if (activeTicket.value && data.ticketId === activeTicket.value.id) {
      // Avoid duplicate if we just optimistically added
      const exists = activeTicket.value.replies.some(r => 
        r.createdAt === data.reply.createdAt && r.message === data.reply.message
      )
      if (!exists) {
        activeTicket.value.replies.push(data.reply)
        scrollToBottom()
      }
    } else {
      fetchTickets()
    }
  })
})

watch(isOpen, (val) => {
  if (val) fetchTickets()
})

const adminName = computed(() => {
  if (!activeTicket.value?.replies) return 'Support Team'
  const lastAdminReply = [...activeTicket.value.replies].reverse().find(r => r.isAdminReply)
  return lastAdminReply ? lastAdminReply.username : 'Support Admin'
})

</script>

<template>
  <div class="floating-chat-container">
    <!-- Toggle Button -->
    <v-btn
      v-if="authStore.role !== 'admin' && authStore.role !== 'employee'"
      @click="toggle"
      icon="mdi-chat-processing"
      :color="isOpen ? 'var(--bg-card)' : 'var(--gold)'"
      size="large"
      elevation="8"
      class="chat-toggle-btn"
      :class="{ 'is-open': isOpen }"
    >
      <v-icon :color="isOpen ? 'var(--text-primary)' : 'black'">
        {{ isOpen ? 'mdi-close' : 'mdi-chat-processing' }}
      </v-icon>
    </v-btn>

    <!-- Chat Window -->
    <Transition name="chat-slide">
      <div v-if="isOpen" class="chat-window">
        <!-- Header -->
        <div class="chat-header">
          <div v-if="view !== 'list'" class="chat-back" @click="backToList">
            <v-icon size="20">mdi-chevron-left</v-icon>
          </div>
          <div class="chat-header-info">
            <div class="chat-title">
              {{ view === 'chat' ? adminName : 'BidWars Support' }}
            </div>
            <div class="chat-status">
              <span class="status-dot"></span> Online
            </div>
          </div>
          <button class="chat-close-btn" @click="isOpen = false">✕</button>
        </div>

        <!-- Body: LIST -->
        <div v-if="view === 'list'" class="chat-body chat-list">
          <div class="salutation-card">
            <div class="salutation-icon">👋</div>
            <div class="salutation-text">
              <div class="salutation-hi">Hi {{ authStore.user?.username || '' }}! How can we help?</div>
              <div class="salutation-sub">Our team is typically online and ready to assist you.</div>
            </div>
          </div>

          <div v-if="tickets.length" class="active-chats-label">Active Conversations</div>
          <div v-for="t in tickets" :key="t.id" class="chat-item" @click="selectTicket(t)">
            <div class="chat-item-avatar">
              <v-icon size="16">mdi-message-text-outline</v-icon>
            </div>
            <div class="chat-item-info">
              <div class="chat-item-subject">{{ t.subject }}</div>
              <div class="chat-item-last">#{{ t.id.slice(0,6) }} • {{ t.status }}</div>
            </div>
            <v-icon size="16" color="var(--text-3)">mdi-chevron-right</v-icon>
          </div>

          <v-btn block flat class="new-chat-btn mt-4" @click="startNewChat">
            Start New Conversation
          </v-btn>
        </div>

        <!-- Body: CREATE -->
        <div v-else-if="view === 'create'" class="chat-body chat-create">
          <div class="create-prompt">Tell us what's on your mind...</div>
          <textarea v-model="replyText" class="chat-input-area" placeholder="Type your message here..."></textarea>
          <v-btn block flat color="var(--gold)" class="send-prompt-btn" :loading="loading" @click="createTicket">
            Send Message
          </v-btn>
        </div>

        <!-- Body: CHAT -->
        <div v-else-if="view === 'chat'" class="chat-body" ref="chatBody">
          <div class="chat-history">
            <div class="msg-bubble system-msg">
              Thread started: {{ new Date(activeTicket.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) }}
            </div>
            
            <div class="msg-group" :class="{ 'msg-group--user': true }">
              <div class="msg-bubble msg-bubble--user">
                {{ activeTicket.message }}
              </div>
            </div>

            <div v-for="r in activeTicket.replies" :key="r.id" 
              class="msg-group" :class="{ 'msg-group--user': !r.isAdminReply, 'msg-group--admin': r.isAdminReply }">
              <div class="msg-bubble" :class="r.isAdminReply ? 'msg-bubble--admin' : 'msg-bubble--user'">
                {{ r.message }}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer (Only in Chat view) -->
        <div v-if="view === 'chat'" class="chat-footer">
          <input 
            v-model="replyText" 
            @keyup.enter="sendReply" 
            placeholder="Type a message..." 
            class="chat-input"
          />
          <v-btn icon="mdi-send" variant="text" size="small" color="var(--gold)" @click="sendReply" :disabled="!replyText.trim()"></v-btn>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.floating-chat-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2000;
}

.chat-toggle-btn {
  width: 56px; height: 56px;
  border: 1px solid rgba(0,0,0,0.1);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.chat-toggle-btn.is-open { transform: rotate(90deg); }

.chat-window {
  position: absolute;
  bottom: 72px;
  right: 0;
  width: 360px;
  height: 520px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
}

/* WINDOW HEADER */
.chat-header {
  padding: 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}
.chat-back { cursor: pointer; color: var(--text-2); }
.chat-header-info { flex: 1; }
.chat-title { font-weight: 700; font-size: 15px; color: var(--text-primary); }
.chat-status { font-size: 11px; color: var(--text-3); display: flex; align-items: center; gap: 4px; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
.chat-close-btn { color: var(--text-3); font-size: 14px; background: none; border: none; cursor: pointer; }

/* BODY */
.chat-body { flex: 1; overflow-y: auto; padding: 16px; }

/* LIST VIEW */
.salutation-card {
  background: linear-gradient(135deg, var(--gold-dim) 0%, transparent 100%);
  border: 1px solid var(--gold-border);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}
.salutation-icon { font-size: 24px; }
.salutation-hi { font-weight: 700; font-size: 16px; color: var(--text-primary); margin-bottom: 4px; }
.salutation-sub { font-size: 13px; color: var(--text-2); line-height: 1.4; }

.active-chats-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-3); margin-bottom: 12px; padding-left: 4px; }
.chat-item {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  background: var(--bg-raised); border: 1px solid var(--border);
  border-radius: 12px; cursor: pointer; margin-bottom: 8px; transition: all 0.2s;
}
.chat-item:hover { border-color: var(--gold); background: var(--bg-card); }
.chat-item-avatar { width: 32px; height: 32px; border-radius: 8px; background: var(--gold-dim); display: flex; align-items: center; justify-content: center; color: var(--gold); }
.chat-item-info { flex: 1; }
.chat-item-subject { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
.chat-item-last { font-size: 11px; color: var(--text-3); }

.new-chat-btn { background: var(--gold) !important; color: #000 !important; font-weight: 700; text-transform: none; border-radius: 12px; height: 44px; }

/* CREATE VIEW */
.create-prompt { font-size: 14px; color: var(--text-2); margin-bottom: 12px; }
.chat-input-area {
  width: 100%; height: 120px; background: var(--bg-raised); border: 1px solid var(--border);
  border-radius: 12px; padding: 12px; color: var(--text-primary); font-family: inherit; font-size: 14px; resize: none; margin-bottom: 16px;
}
.send-prompt-btn { font-weight: 700; text-transform: none; border-radius: 12px; height: 44px; }

/* CHAT VIEW */
.chat-history { display: flex; flex-direction: column; gap: 12px; }
.system-msg { align-self: center; font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; background: var(--bg-raised); padding: 4px 10px; border-radius: 20px; }

.msg-group { display: flex; flex-direction: column; max-width: 85%; }
.msg-group--user { align-self: flex-end; align-items: flex-end; }
.msg-group--admin { align-self: flex-start; }

.msg-bubble { padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.4; border: 1px solid var(--border); }
.msg-bubble--user { background: var(--gold); color: #000; border-bottom-right-radius: 2px; border-color: transparent; }
.msg-bubble--admin { background: var(--bg-raised); color: var(--text-primary); border-bottom-left-radius: 2px; }

/* FOOTER */
.chat-footer { padding: 12px; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 8px; }
.chat-input { flex: 1; background: var(--bg-raised); border: 1px solid var(--border); border-radius: 20px; padding: 8px 16px; color: var(--text-primary); font-size: 14px; outline: none; }
.chat-input:focus { border-color: var(--gold); }

/* ANIMATION */
.chat-slide-enter-active, .chat-slide-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.chat-slide-enter-from, .chat-slide-leave-to { opacity: 0; transform: scale(0.9) translateY(20px); }

@media (max-width: 480px) {
  .chat-window { width: calc(100vw - 48px); right: 0; height: 70vh; }
}
</style>
