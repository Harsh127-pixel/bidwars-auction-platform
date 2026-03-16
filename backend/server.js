// FILE: backend/server.js
require("dotenv").config()

const express = require("express")
const cors = require("cors")
const http = require("http")
const { Server } = require("socket.io")
const db = require("./config/firebase")

const app = express()


// CORS — allow Render, Vercel, gaurangjadoun.in, and localhost (no port in prod)
const allowedOrigins = [
  "https://frontend-bidwars.onrender.com",
  "https://backend-bidwars.onrender.com",
  "https://bidwars-auction-platform.onrender.com",
  "https://bidwars-auction-platform.vercel.app",
  "https://gaurangjadoun.in",
  "http://localhost",
  "https://localhost",
  "http://127.0.0.1",
  "https://127.0.0.1"
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true)
    // Allow all localhost in dev, and allow prod domains
    if (
      allowedOrigins.some(o => origin && origin.startsWith(o)) ||
      (process.env.NODE_ENV !== "production" && origin && origin.startsWith("http://localhost"))
    ) {
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

app.use("/api", auctionRoutes)
app.use("/api/users", userRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/proposals", proposalRoutes)

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
})

app.set("io", io)

const scheduler = require("./services/scheduler")
scheduler.init(io, db)

require("./sockets/bidding")(io, db)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`\n[Server] Running on http://localhost:${PORT}`)
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`)
  console.log(`[Server] Allowed CORS origins: ${allowedOrigins.join(", ")}\n`)
})