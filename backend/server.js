const express = require("express")
const cors = require("cors")
const http = require("http")
const { Server } = require("socket.io")
const db = require("./config/firebase")

const app = express()

// Test Firebase Connection
db.listCollections()
  .then(() => console.log("Firebase Connected Successfully"))
  .catch((err) => console.error("Firebase Connection Error:", err))


app.use(cors())
app.use(express.json())

const auctionRoutes = require("./routes/auctionRoutes")
app.use("/api", auctionRoutes)

const server = http.createServer(app)

const io = new Server(server,{
  cors:{origin:"*"}
})

app.set('io', io)

require("./sockets/bidding")(io, db)

const PORT = process.env.PORT || 5000
server.listen(PORT,()=>{
  console.log(`Server running on port ${PORT}`)
})
