module.exports = (io,db)=>{

 io.on("connection",(socket)=>{

   socket.on("placeBid", async(data)=>{

      const {auctionId,userId,amount} = data

      const auctionRef = db.collection("auctions").doc(auctionId)
      const userRef = db.collection("users").doc(userId)

      try {
        const auction = await auctionRef.get()
        const user = await userRef.get()

        // SANDBOX MODE: If the auction/user is mock, just emit the bid for demo purposes
        if (!auction.exists) {
            console.log(`[SANDBOX] Item:${auctionId} is mock. Emitting live update.`);
            
            // If the user exists in DB, we'll try to update their participation metadata
            if (user.exists) {
                try {
                    await userRef.update({
                        lastActiveBid: auctionId,
                        updatedAt: new Date()
                    });
                } catch(e) { console.error("User metadata update failed", e) }
            }

            io.emit("bidUpdate", { 
              auctionId: String(auctionId), 
              userId: String(userId), 
              amount: parseFloat(amount) 
            });
            return;
        }

        if (!user.exists) {
            throw "User identity not found in database. Please register/login.";
        }

        await db.runTransaction(async (transaction) => {
          // ... rest of the existing transaction logic ...
          const auctionDoc = await transaction.get(auctionRef)
          const userDoc = await transaction.get(userRef)
          
          const auctionData = auctionDoc.data()
          const userData = userDoc.data()

          if (amount <= auctionData.highestBid) throw "Bid too low"
          if (userData.credits < amount) throw "Insufficient credits"

          if (auctionData.highestBidder) {
            const prevBidderRef = db.collection("users").doc(auctionData.highestBidder)
            const prevBidder = await transaction.get(prevBidderRef)
            if (prevBidder.exists) {
              const prevData = prevBidder.data()
              transaction.update(prevBidderRef, {
                credits: prevData.credits + auctionData.highestBid,
                heldCredits: Math.max(0, prevData.heldCredits - auctionData.highestBid)
              })
            }
          }

          transaction.update(userRef, {
            credits: userData.credits - amount,
            heldCredits: (userData.heldCredits || 0) + amount
          })

          transaction.update(auctionRef, {
            highestBid: amount,
            highestBidder: userId
          })
        })

        io.emit("bidUpdate", { auctionId, userId, amount })
        console.log(`Bid of ${amount} placed by ${userId} on ${auctionId}`)

      } catch (error) {
        console.error("Bidding Error:", error)
        socket.emit("error", { message: error })
      }

   })

 })

}
