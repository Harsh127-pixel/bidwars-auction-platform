<!-- FILE: frontend/src/pages/NotFound.vue -->
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="error-page">
    <div class="glow-container">
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>
    </div>

    <div class="content fade-up">
      <div class="error-code">404</div>
      <h1 class="error-title">Page Not Found</h1>
      <p class="error-message">
        The asset or page you're looking for has been moved, 
        delisted, or never existed in this auction hall.
      </p>

      <div class="actions">
        <button @click="goBack" class="btn btn-outline">
          <v-icon start>mdi-arrow-left</v-icon>
          Go Back
        </button>
        <router-link to="/" class="btn btn-primary">
          Return Home
        </router-link>
      </div>
    </div>

    <div class="footer">
      Ref Code: <span class="t-mono">{{ Math.random().toString(36).slice(2, 9).toUpperCase() }}</span>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  text-align: center;
  padding: 24px;
}

.glow-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.glow {
  position: absolute;
  width: 40vw;
  height: 40vw;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
}

.glow-1 {
  background: var(--primary);
  top: -10%;
  left: -10%;
}

.glow-2 {
  background: #3b82f6;
  bottom: -10%;
  right: -10%;
}

.content {
  position: relative;
  z-index: 1;
  max-width: 500px;
}

.error-code {
  font-family: var(--font-display);
  font-size: clamp(80px, 15vw, 150px);
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, var(--text) 0%, var(--text-3) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
  letter-spacing: -0.05em;
}

.error-title {
  font-family: var(--font-display);
  font-size: clamp(24px, 5vw, 32px);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 16px;
}

.error-message {
  font-size: 16px;
  color: var(--text-2);
  line-height: 1.6;
  margin-bottom: 32px;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  text-decoration: none;
}

.btn-primary {
  background: var(--text);
  color: var(--bg);
}

.btn-primary:hover {
  background: var(--text-2);
  transform: translateY(-2px);
}

.btn-outline {
  background: transparent;
  color: var(--text);
  border: 1.5px solid var(--border-md);
}

.btn-outline:hover {
  background: var(--bg-hover);
  border-color: var(--text);
}

.footer {
  position: absolute;
  bottom: 24px;
  font-size: 12px;
  color: var(--text-3);
  font-family: var(--font-mono);
}

.fade-up {
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
