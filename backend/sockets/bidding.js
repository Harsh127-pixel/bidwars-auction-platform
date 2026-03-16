module.exports = (io, db) => {
  
  // Shared bidding logic to allow both manual and proxy bids
  const processBid = async (socket, data) => {
    const { auctionId, userId, amount, isProxy } = data
    const auctionRef = db.collection("auctions").doc(auctionId)
    const userRef = db.collection("users").doc(userId)

    try {
      const auction = await auctionRef.get()
      const user = await userRef.get()

      // SANDBOX MODE: If the auction/user is mock
      if (!auction.exists) {
        console.log(`[SANDBOX] Item:${auctionId} is mock${isProxy ? ' (PROXY)' : ''}. Emitting updates.`);
        if (user.exists) {
          try {
            await userRef.update({
              lastActiveBid: auctionId,
              updatedAt: new Date()
            });
          } catch(e) { console.error("User metadata update failed", e) }
        }
        io.emit("bidUpdate", { auctionId: String(auctionId), userId: String(userId), amount: parseFloat(amount) });
        return;
      }

      if (!user.exists) throw "User identity not found in database.";
      
      const userDataCheck = user.data()
      if (!['bidder', 'admin'].includes(userDataCheck.role)) {
        throw "Your account role does not permit active bidding."
      }

      if (!userDataCheck.isVerified && userDataCheck.role !== 'admin') {
        throw "Access Denied: Level 3 Identity Verification (KYC) required for bidding."
      }

      const ledgerService = require('../services/ledger');

      await db.runTransaction(async (transaction) => {
        const auctionDoc = await transaction.get(auctionRef)
        const userDoc = await transaction.get(userRef)
        const auctionData = auctionDoc.data()
        const userData = userDoc.data()

        const minIncrement = 10;
        const requiredBid = (auctionData.highestBid || auctionData.minBid) + minIncrement;

        if (amount < requiredBid) {
          throw `Inadequate Offer. Market rules require a minimum increment of ₹${minIncrement}. Next valid bid is ₹${requiredBid.toLocaleString()}.`
        }
        
        if (userData.credits < amount) throw "Insufficient credits to cover bid."

        // 1. Refund previous bidder (if any)
        if (auctionData.highestBidder) {
          const prevBidderRef = db.collection("users").doc(auctionData.highestBidder)
          const prevBidder = await transaction.get(prevBidderRef)
          if (prevBidder.exists) {
            const prevData = prevBidder.data()
            const refundAmount = auctionData.highestBid
            const newPrevBalance = prevData.credits + refundAmount
            
            transaction.update(prevBidderRef, {
              credits: newPrevBalance,
              heldCredits: Math.max(0, (prevData.heldCredits || 0) - refundAmount)
            })

            ledgerService.logTransaction(transaction, auctionData.highestBidder, refundAmount, 'OUTBID_REFUND', prevData.credits, newPrevBalance, auctionId);
          }
        }

        // 2. Lock current bidder's credits (Commitment)
        const newBalance = userData.credits - amount
        transaction.update(userRef, {
          credits: newBalance,
          heldCredits: (userData.heldCredits || 0) + amount
        })

        ledgerService.logTransaction(transaction, userId, -amount, 'BID_COMMITMENT', userData.credits, newBalance, auctionId);

        // 3. Update auction record
        transaction.update(auctionRef, {
          highestBid: amount,
          highestBidder: userId
        })

        // SOFT CLOSE LOGIC: If bid placed in last 2 mins, extend by 3 mins
        const now = Date.now()
        const endTime = new Date(auctionData.endTime).getTime()
        const diff = endTime - now
        
        if (diff > 0 && diff < 120000) { // Less than 2 minutes remaining
          const newEndTime = new Date(endTime + 180000).toISOString() // Add 3 mins
          transaction.update(auctionRef, { endTime: newEndTime })
          io.emit("timerExtension", { auctionId, newEndTime })
          console.log(`[SOFT CLOSE] Auction ${auctionId} extended to ${newEndTime}`);
        }
      })

      io.emit("bidUpdate", { auctionId, userId, amount, isProxy })
      console.log(`Bid of ${amount} placed by ${userId} on ${auctionId} ${isProxy ? '(AUTO)' : ''}`);

      // PROXY BIDDING ENGINE: Check if anyone else has a higher ceiling
      const proxyBids = await db.collection("proxyBids")
        .where("auctionId", "==", auctionId)
        .where("ceiling", ">", amount)
        .orderBy("ceiling", "desc")
        .get()

      if (!proxyBids.empty) {
        // Find the top proxy that isn't the person who just bid
        const topProxy = proxyBids.docs.find(doc => doc.data().userId !== userId)
        if (topProxy) {
          const proxyData = topProxy.data()
          const nextBid = amount + 10 // Increment by ₹10
          
          console.log(`[PROXY] Auto-bidding ₹${nextBid} for User ${proxyData.userId}`);
          
          // Schedule the proxy bid (recursion)
          setTimeout(() => {
            processBid(socket, { 
              auctionId, 
              userId: proxyData.userId, 
              amount: nextBid,
              isProxy: true 
            })
          }, 1000)
        }
      }

    } catch (error) {
      console.error("Bidding Error:", error)
      socket.emit("error", { message: typeof error === 'string' ? error : "Transaction failed" })
    }
  }

  io.on("connection", (socket) => {
    socket.on("placeBid", async (data) => {
      await processBid(socket, data)
    })

    socket.on("setProxyBid", async (data) => {
      const { auctionId, userId, ceiling } = data
      try {
        await db.collection("proxyBids").doc(`${auctionId}_${userId}`).set({
          auctionId,
          userId,
          ceiling: parseFloat(ceiling),
          updatedAt: new Date()
        })
        socket.emit("proxyStatus", { status: "active", ceiling })
        console.log(`Proxy bid set for ${userId} on ${auctionId} at ₹${ceiling}`)
      } catch (err) {
        socket.emit("error", { message: "Failed to set Proxy Bid" })
      }
    })
  })
}
