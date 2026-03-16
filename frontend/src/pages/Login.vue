<template>
  <v-container class="fill-height pa-0" fluid>
    <!-- Environmental HUD -->
    <div class="fixed inset-0 hud-overlay z-0 opacity-30"></div>
    
    <v-row align="center" justify="center" class="fill-height ma-0 relative z-10">
      <v-col cols="12" sm="10" md="10" lg="8" xl="6" class="d-flex justify-center">
        <v-card 
          elevation="24" 
          class="rounded-3xl overflow-hidden d-flex flex-column flex-md-row w-100 bg-surface border-subtle shadow-premium animate-zoom"
          style="min-height: 640px;"
        >
          <!-- Institutional Visual Pane -->
          <v-col cols="12" md="6" lg="5" class="pa-0 relative bg-primary d-flex flex-column justify-center align-center text-center text-white overflow-hidden order-1 md:order-2">
            <v-img
              src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000"
              cover
              class="absolute inset-0 opacity-20 scale-110"
            ></v-img>
            
            <div class="pa-12 relative z-10 w-100">
              <v-avatar color="white" class="rounded-2xl shadow-2xl mb-10 rotate-3 border-4 border-white-opacity-20" size="80">
                <v-icon icon="mdi-shield-crown" color="primary" size="40"></v-icon>
              </v-avatar>
              <h1 class="text-h2 font-weight-black tracking-tighter italic mb-6 leading-none">
                Elite <span class="not-italic opacity-40">Indigo</span>
              </h1>
              <p class="text-h6 font-weight-medium opacity-70 leading-relaxed ma-0 max-w-sm mx-auto">
                Secure the institutional bidding floor for high-stakes repossessed assets and digital collectibles.
              </p>
              
              <div class="mt-16 d-flex flex-column gap-4 align-center">
                <div class="d-flex align-center gap-4 py-2 px-6 rounded-pill border border-white-opacity-10 bg-white-opacity-5 backdrop-blur-md">
                  <v-icon icon="mdi-shield-check" size="20" color="success"></v-icon>
                  <span class="text-[10px] font-weight-black tracking-[0.3em] uppercase">Verified Circuit</span>
                </div>
                <div class="d-flex align-center gap-4 py-2 px-6 rounded-pill border border-white-opacity-10 bg-white-opacity-5 backdrop-blur-md">
                  <v-icon icon="mdi-lock-outline" size="20"></v-icon>
                  <span class="text-[10px] font-weight-black tracking-[0.3em] uppercase">BWC Core Encryption</span>
                </div>
              </div>
            </div>

            <!-- Decorative HUD Arc -->
            <div class="absolute bottom-n20 left-n20 w-80 h-80 rounded-circle border-4 border-white opacity-5"></div>
          </v-col>

          <!-- Authentication Command Pane -->
          <v-col cols="12" md="6" lg="7" class="pa-12 pa-md-16 d-flex flex-column justify-center bg-surface relative order-2 md:order-1">
            <div class="mb-12 text-left">
              <div class="d-flex align-center gap-3 mb-2">
                <v-chip color="primary" size="x-small" variant="flat" class="font-weight-black px-3 py-3 text-[9px] tracking-widest">GATEWAY 01</v-chip>
                <p class="text-overline font-weight-black text-primary tracking-[0.4em] uppercase ma-0 opacity-60">Identity Session</p>
              </div>
              <h3 class="text-[52px] font-weight-black italic tracking-tighter ma-0 leading-none">
                Protocol <span class="text-primary not-italic">Submission</span>
              </h3>
            </div>

            <v-form @submit.prevent="handleLogin" class="space-y-8">
              <v-text-field
                v-model="email"
                label="DIGITAL MAIL IDENTITY"
                variant="outlined"
                rounded="xl"
                prepend-inner-icon="mdi-email-outline"
                class="font-weight-bold"
                placeholder="identity@bidwars.elite"
                type="email"
                hide-details="auto"
                :rules="[v => !!v || 'Identifier required']"
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="PASSKEY PROTOCOL"
                variant="outlined"
                rounded="xl"
                prepend-inner-icon="mdi-lock-outline"
                class="font-weight-bold"
                placeholder="••••••••"
                type="password"
                hide-details="auto"
                :rules="[v => !!v || 'Passkey required']"
              ></v-text-field>

              <div class="d-flex align-center justify-space-between pt-2">
                <v-checkbox label="PERSISTENCE MODE" color="primary" hide-details density="comfortable" class="font-weight-black text-[11px] tracking-widest"></v-checkbox>
                <a href="#" class="text-[11px] font-weight-black text-primary text-decoration-none hover:opacity-100 opacity-40 transition-opacity tracking-widest uppercase">Lost Access?</a>
              </div>

              <v-btn
                type="submit"
                color="primary"
                block
                height="80"
                rounded="pill"
                class="font-weight-black text-caption tracking-[0.4em] mt-8 shadow-xl"
                elevation="12"
                :loading="loading"
                prepend-icon="mdi-orbit-variant"
              >
                EXECUTE SESSION
              </v-btn>

              <div class="text-center mt-12 pt-8 border-t border-subtle border-opacity-30">
                <p class="text-caption font-weight-bold text-muted-custom uppercase tracking-[0.2em] opacity-40">
                  New to the Indigo circuit?
                  <router-link to="/register" class="text-primary font-weight-black text-decoration-none ml-2 border-b-2 border-primary border-opacity-20 pb-1">Request Enrollment</router-link>
                </p>
              </div>
            </v-form>
          </v-col>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'
import { useNotification } from '../services/notification'

const email = ref('')
const password = ref('')
const loading = ref(false)
const authStore = useAuthStore()
const router = useRouter()
const notification = useNotification()

const handleLogin = async () => {
  if (!email.value || !password.value) return
  loading.value = true
  try {
    const success = await authStore.login(email.value, password.value)
    if (success) {
      notification.add("Identity Verified • Marketplace Session Established", "success")
      router.push('/')
    } else {
      notification.add("Authorization Denied • Credentials Mismatch", "error")
    }
  } catch (err) {
    notification.add("System Dispatch Error • Please retry protocol", "error")
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.animate-zoom {
  animation: zoomIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.98) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.shadow-premium {
  box-shadow: 0 40px 80px -12px rgba(0, 0, 0, 0.4), 0 20px 40px -20px rgba(0, 0, 0, 0.5) !important;
}

.hud-overlay {
  background: radial-gradient(circle at center, transparent 0%, rgba(var(--v-theme-primary), 0.15) 100%);
  pointer-events: none;
}

.z-10 { z-index: 10; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }

.v-card {
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
