import './assets/main.css'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#4f46e5', // Indigo 600
          secondary: '#6366f1',
          accent: '#818cf8',
          error: '#f43f5e',
          info: '#3b82f6',
          success: '#10b981',
          warning: '#f59e0b',
          surface: '#ffffff',
          'on-surface': '#0f172a',
          background: '#f8fafc',
        },
      },
      dark: {
        colors: {
          primary: '#6366f1', // Indigo 500
          secondary: '#818cf8',
          accent: '#a5b4fc',
          error: '#fb7185',
          info: '#60a5fa',
          success: '#34d399',
          warning: '#fbbf24',
          surface: '#0f172a',
          'on-surface': '#f8fafc',
          background: '#020617',
        },
      },
    },
  },
  defaults: {
    VCard: {
      flat: true,
      backgroundColor: 'surface',
    },
    VBtn: {
      flat: true,
      class: 'text-none font-weight-black tracking-widest',
    },
    VTextField: {
      variant: 'outlined',
      rounded: 'xl',
    },
    VSelect: {
      variant: 'outlined',
      rounded: 'xl',
    },
    VTextarea: {
      variant: 'outlined',
      rounded: 'xl',
    },
    VContainer: {
      class: 'max-w-1280 mx-auto px-4',
    }
  },
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
