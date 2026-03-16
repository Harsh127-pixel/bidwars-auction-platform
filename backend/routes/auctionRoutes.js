const express = require("express")
const admin = require("firebase-admin")
const router = express.Router()
const db = require("../config/firebase")
const { generateListingDescription } = require("../services/aiListing")

router.post("/generateDescription", async (req, res) => {
  const { itemName, features } = req.body
  try {
    const description = await generateListingDescription(itemName, features)
    res.json({ description })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post("/createAuction", async (req,res)=>{
  const { title, description, category, minBid, imageUrl, startTime, endTime } = req.body

  const auction = await db.collection("auctions").add({
    title,
    description,
    category,
    minBid: parseFloat(minBid),
    highestBid: parseFloat(minBid),
    highestBidder: null,
    imageUrl,
    status: "active",
    startTime: startTime ? new Date(startTime) : new Date(),
    endTime: new Date(endTime),
    createdAt: new Date()
  })

  res.json({ id: auction.id })
})

// Admin: Update User Credits
router.post("/admin/updateCredits", async (req, res) => {
  const { userId, credits } = req.body
  try {
    await db.collection("users").doc(userId).set({
      credits: parseFloat(credits),
      heldCredits: 0
    }, { merge: true })
    res.json({ success: true, message: `Credits updated for ${userId}` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: Close Auction
router.post("/admin/closeAuction", async (req, res) => {
  const { auctionId } = req.body
  try {
    const auctionRef = db.collection("auctions").doc(auctionId)
    const auctionDoc = await auctionRef.get()
    
    if (!auctionDoc.exists) throw new Error("Auction not found")
    
    const auctionData = auctionDoc.data()
    
    // If there's a winner, finalize their held credits
    if (auctionData.highestBidder) {
      const winnerRef = db.collection("users").doc(auctionData.highestBidder)
      await winnerRef.update({
        heldCredits: admin.firestore.FieldValue.increment(-auctionData.highestBid)
        // Note: Credits were already deducted during bidding
      })
    }

    await auctionRef.update({ status: "closed", endTime: new Date() })
    res.json({ success: true, winner: auctionData.highestBidder })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get("/auctions", async (req,res)=>{

 const snapshot = await db.collection("auctions").get()

 const auctions = snapshot.docs.map(doc=>({
   id:doc.id,
   ...doc.data()
 }))

 res.json(auctions)

})

module.exports = router
