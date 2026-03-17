const { getMinIncrement, calculateRequiredBid } = require('../utils/proxyEngine');
const fraudService = require('../services/fraud');
const ledgerService = require('../services/ledger');
const admin = require('firebase-admin');

module.exports = (io, db) => {
  
  /**
   * CORE PROXY ENGINE
   * Handles the complex comparison between a new bidder's max and the existing top proxy.
   */
  const processBid = async (socket, data) => {
    const { auctionId, userId, amount, isProxy } = data;
    const ip = socket.handshake.address;

    try {
      let result = null;

      await db.runTransaction(async (transaction) => {
        const auctionRef = db.collection("auctions").doc(auctionId);
        const userRef = db.collection("users").doc(userId);
        
        const auctionDoc = await transaction.get(auctionRef);
        const userDoc = await transaction.get(userRef);

        if (!auctionDoc.exists) throw new Error("Auction listing not found.");
        if (!userDoc.exists) throw new Error("User identity not found.");

        const auctionData = auctionDoc.data();
        const userData = userDoc.data();

        // 1. Validation Logic
        if (auctionData.status !== 'active') throw new Error("This bidding floor is currently closed.");
        if (userData.credits < amount) throw new Error("Insufficient wealth ledger balance for this bid.");

        // 2. Fraud Detection
        const fraudFlags = await fraudService.checkBiddingPattern(auctionId, userId, ip);
        if (fraudFlags.length > 0) {
          console.warn(`[FRAUD ALERT] User ${userId} flagged on ${auctionId}`);
          await fraudService.flagListing(auctionId, fraudFlags[0].detail);
          // Flagged events happen inside transaction but it's okay for logging
        }

        const currentPrice = auctionData.highestBid || auctionData.minBid;
        const increment = getMinIncrement(currentPrice);
        const minRequired = currentPrice + increment;

        if (amount < minRequired) {
          throw new Error(`Inadequate Offer. Market rules require a minimum increment of ₹${increment}. Next valid bid is ₹${minRequired}.`);
        }

        // 3. Proxy Competition Logic
        const proxyRef = db.collection("proxyBids").doc(auctionId);
        const currentProxyDoc = await transaction.get(proxyRef);
        const currentProxyData = currentProxyDoc.exists ? currentProxyDoc.data() : null;

        let finalPrice = amount;
        let newWinnerId = userId;

        if (currentProxyData && currentProxyData.userId !== userId) {
          const existingMax = currentProxyData.maxAmount;
          
          if (amount > existingMax) {
            finalPrice = calculateRequiredBid(existingMax);
            newWinnerId = userId;
            transaction.set(proxyRef, { userId, maxAmount: amount, updatedAt: new Date() });
          } else {
            finalPrice = calculateRequiredBid(amount);
            newWinnerId = currentProxyData.userId;
            const err = new Error(`You have been instantly outbid by an existing proxy. Price is now ₹${finalPrice.toLocaleString()}.`);
            err.type = 'OUTBID';
            err.currentPrice = finalPrice;
            throw err;
          }
        } else {
          transaction.set(proxyRef, { userId, maxAmount: amount, updatedAt: new Date() });
        }

        // 4. Financial Settlement (EMD/Hold)
        const priceIncrease = finalPrice - (auctionData.highestBid || 0);
        
        if (priceIncrease > 0) {
          const newWinnerRef = db.collection("users").doc(newWinnerId);
          // Re-fetch winner data if it's someone else (for current credits)
          const newWinnerDocActual = (newWinnerId === userId) ? userDoc : await transaction.get(newWinnerRef);
          const nwData = newWinnerDocActual.data();

          if (nwData.credits < priceIncrease) throw new Error("Insufficient Liquid Credits for settlement.");
          
          transaction.update(newWinnerRef, {
            credits: admin.firestore.FieldValue.increment(-priceIncrease),
            heldCredits: admin.firestore.FieldValue.increment(priceIncrease)
          });

          ledgerService.logTransaction(transaction, newWinnerId, -priceIncrease, 'BID_HOLD', nwData.credits, nwData.credits - priceIncrease, auctionId);
        }

        // Refund previous bidder
        if (auctionData.highestBidder && auctionData.highestBidder !== newWinnerId) {
          const prevBidderRef = db.collection("users").doc(auctionData.highestBidder);
          const prevBidderDoc = await transaction.get(prevBidderRef);
          if (prevBidderDoc.exists) {
            const pbData = prevBidderDoc.data();
            const refundAmount = auctionData.highestBid;
            transaction.update(prevBidderRef, {
              credits: admin.firestore.FieldValue.increment(refundAmount),
              heldCredits: admin.firestore.FieldValue.increment(-refundAmount)
            });
            ledgerService.logTransaction(transaction, auctionData.highestBidder, refundAmount, 'BID_REFUND', pbData.credits, pbData.credits + refundAmount, auctionId);
          }
        }

        // 5. Commit Data
        const bidCount = (auctionData.bidCount || 0) + 1;
        const reserveMet = auctionData.reservePrice ? finalPrice >= auctionData.reservePrice : true;
        
        transaction.update(auctionRef, {
          highestBid: finalPrice,
          highestBidder: newWinnerId,
          bidCount: bidCount,
          reserveMet: reserveMet,
          updatedAt: new Date()
        });

        const bidLogRef = db.collection("bids").doc();
        transaction.set(bidLogRef, {
          auctionId, userId, amount: finalPrice, maxAmount: amount, ip, timestamp: new Date(), isProxy: !!isProxy
        });

        // Soft-close logic
        let newEndTime = null;
        const et = auctionData.endTime;
        const endTime = et?.toDate ? et.toDate().getTime() : new Date(et).getTime();
        if (endTime - Date.now() < 120000) {
          newEndTime = new Date(endTime + 180000).toISOString();
          transaction.update(auctionRef, { endTime: newEndTime });
        }

        // Prepare result for side effects outside transaction
        result = { 
          auctionId, 
          newWinnerId, 
          finalPrice, 
          bidCount, 
          reserveMet, 
          newEndTime,
          status: auctionData.status
        };
      });

      // Side Effects (Socket emissions) after transaction success
      if (result) {
        if (result.newEndTime) {
          io.emit("timerExtension", { auctionId: result.auctionId, newEndTime: result.newEndTime });
        }
        io.emit("bidUpdate", { 
          auctionId: result.auctionId, 
          userId: result.newWinnerId, 
          amount: result.finalPrice, 
          bidCount: result.bidCount,
          reserveMet: result.reserveMet
        });
      }

    } catch (error) {
      console.error("Bidding Engine Error:", error.message || error);
      socket.emit("error", { 
        message: error.message || "Bidding transaction failed",
        type: error.type || 'SERVER_ERROR',
        currentPrice: error.currentPrice
      });
    }
  };

  io.on("connection", (socket) => {
    socket.on("placeBid", async (data) => await processBid(socket, data));
  });
};
