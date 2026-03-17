// FILE: frontend/src/config/api.js
// Single source of truth for all URL constants.
// Everything reads from .env — never hardcode URLs in components.

const isLocalhost =
	typeof window !== 'undefined' &&
	(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

const defaultBackendUrl = isLocalhost
	? 'http://localhost:5000'
	: 'https://backend-bidwars.onrender.com'

export const API_URL = import.meta.env.VITE_API_URL || defaultBackendUrl
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || defaultBackendUrl