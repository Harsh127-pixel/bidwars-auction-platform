// FILE: frontend/src/services/api.js
import axios from 'axios'
import { API_URL } from '../config/api'
import { auth } from '../config/firebase'

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
})

// Inject Firebase ID token on every request
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser
    if (user) {
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // Not signed in — proceed without auth header
  }
  return config
})

// Surface backend error messages cleanly
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error
      || err.response?.data?.message
      || err.message
      || 'Network error'
    return Promise.reject(new Error(msg))
  }
)

export default api