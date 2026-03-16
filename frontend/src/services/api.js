import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { useAuthStore } from '../store/auth';

const api = axios.create({
  baseURL: API_BASE_URL
});

// Interceptor to inject Firebase ID Token into every request
api.interceptors.request.use(async (config) => {
  const authStore = useAuthStore();
  const token = await authStore.getToken();
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
