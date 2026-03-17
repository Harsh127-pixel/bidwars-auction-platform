// FILE: backend/server.js
require("dotenv").config()

const express = require("express")
const cors = require("cors")
const http = require("http")
const { Server } = require("socket.io")
const { db } = require("./config/firebase")

const app = express()

const parseOrigins = (value) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

// CORS — allow deployed frontends and localhost in development
const defaultOrigins = [
  "https://frontend-bidwars.onrender.com",
  "https://backend-bidwars.onrender.com",
  "https://bidwars-auction-platform.onrender.com",
  "https://bidwars-auction-platform.vercel.app",
  "https://bidwarss.vercel.app",
  "https://gaurangjadoun.in",
  "https://bidwars.gaurangjadoun.in",
  "https://bidwars.gaurangjadoun.me",
  "http://bidwars.gaurangjadoun.me",
  "http://bidwars.gaurangjadoun.in",
  "http://localhost",
  "https://localhost",
  "http://127.0.0.1",
  "https://127.0.0.1"
]

const configuredOrigins = [
  ...parseOrigins(process.env.CLIENT_ORIGINS),
  ...parseOrigins(process.env.CLIENT_ORIGIN)
]

const allowedOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])]

const isAllowedOrigin = (origin) => {
  if (!origin) return true
  return (
    allowedOrigins.some((o) => origin.startsWith(o)) ||
    (process.env.NODE_ENV !== "production" && origin.startsWith("http://localhost"))
  )
}

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true)
    }
    callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  credentials: true
}))

app.use(express.json())

// Health check — use this to confirm the backend is reachable
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

const auctionRoutes = require("./routes/auctionRoutes")
const userRoutes = require("./routes/userRoutes")
const adminRoutes = require("./routes/adminRoutes")
const paymentRoutes = require("./routes/paymentRoutes")
const proposalRoutes = require("./routes/proposalRoutes")
const supportRoutes = require("./routes/supportRoutes")
const uploadRoutes = require("./routes/uploadRoutes")
const walletRoutes = require("./routes/walletRoutes")

app.use("/api", auctionRoutes)
app.use("/api/users", userRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/proposals", proposalRoutes)
app.use("/api/support", supportRoutes)
const notificationRoutes = require("./routes/notificationRoutes")
app.use("/api/notifications", notificationRoutes)
app.use("/api/media", uploadRoutes)
app.use("/api/wallet", walletRoutes)

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true)
      }
      callback(new Error(`CORS blocked for Socket.io: ${origin}`))
    },
    methods: ["GET", "POST"],
    credentials: true
  }
})

app.set("io", io)

const scheduler = require("./services/scheduler")
const notificationService = require("./services/notificationService")
scheduler.init(io, db)
notificationService.setIo(io)

require("./sockets/bidding")(io, db)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`\n[Server] Running on http://localhost:${PORT}`)
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`)
  console.log(`[Server] Allowed CORS origins: ${allowedOrigins.join(", ")}\n`)
})