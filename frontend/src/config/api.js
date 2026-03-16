// FILE: frontend/src/config/api.js
// Single source of truth for all URL constants.
// Everything reads from .env — never hardcode URLs in components.

export const API_URL    = import.meta.env.VITE_API_URL    || 'http://localhost:5000'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'