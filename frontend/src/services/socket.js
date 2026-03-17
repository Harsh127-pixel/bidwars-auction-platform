// FILE: frontend/src/services/socket.js
// Connects lazily with reconnection limits so ERR_CONNECTION_REFUSED
// doesn't spam the console if the backend is slow to start.
import { io } from "socket.io-client"
import { SOCKET_URL } from "../config/api"

const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 10000,
  timeout: 10000,
  transports: ["websocket", "polling"], // Prioritize WebSocket
  withCredentials: true
})

// Connect once the DOM is ready — gives the backend time to start
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    socket.connect()
  })
}

socket.on("connect", () => {
  console.log("[Socket] Connected to server")
})

socket.on("connect_error", (err) => {
  // Only log once, not on every retry
  if (!socket._connectErrLogged) {
    console.warn("[Socket] Cannot reach backend — real-time updates paused. Retrying...")
    socket._connectErrLogged = true
  }
})

socket.on("connect", () => {
  socket._connectErrLogged = false  // reset on successful connect
})

export default socket