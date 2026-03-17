const { getMinIncrement, calculateRequiredBid } = require('../utils/proxyEngine');
const fraudService = require('../services/fraud');
const ledgerService = require('../services/ledger');
const admin = require('firebase-admin');
const notificationService = require('../services/notificationService');

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
          // Account auto-flagging is handled inside fraudService.checkBiddingPattern
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
            // New bidder wins. If they used proxy, only bid min required to beat existing max.
            // If they bid manually, they jump to the full amount.
            finalPrice = isProxy ? calculateRequiredBid(existingMax) : amount;
            newWinnerId = userId;
            transaction.set(proxyRef, { userId, maxAmount: amount, updatedAt: new Date() });
          } else {
            // Existing proxy wins. Increase price to just above new bid.
            finalPrice = calculateRequiredBid(amount);
            newWinnerId = currentProxyData.userId;
            const err = new Error(`You have been instantly outbid by an existing proxy. Price is now ₹${finalPrice.toLocaleString()}.`);
            err.type = 'OUTBID';
            err.currentPrice = finalPrice;
            throw err;
          }
        } else {
          // No previous proxy or same user increasing max
          // If first bidder, use minBid. If not, use minRequired if proxy.
          if (isProxy) {
            finalPrice = auctionData.highestBidder ? minRequired : auctionData.minBid;
          } else {
            finalPrice = amount;
          }
          transaction.set(proxyRef, { userId, maxAmount: amount, updatedAt: new Date() });
        }

        // 4. Financial Settlement (EMD/Hold)
        // A. Full Refund to Previous Bidder (if someone else was winning)
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
            
            // Outbid notification
            notificationService.send(auctionData.highestBidder, 'OUTBID', `You've been outbid on ${auctionData.title}! Price is now ₹${finalPrice.toLocaleString()}.`, { auctionId });
          }
        }

        // B. Hold Amount from Current Winner
        // If it's a new winner, hold the full finalPrice. 
        // If it's the same winner just increasing their lead, hold the difference.
        const currentHeldByWinner = (auctionData.highestBidder === newWinnerId) ? auctionData.highestBid : 0;
        const netDeduction = finalPrice - currentHeldByWinner;

        if (netDeduction > 0) {
          const newWinnerRef = db.collection("users").doc(newWinnerId);
          // Re-fetch winner data to ensure latest credits
          const newWinnerDocActual = (newWinnerId === userId) ? userDoc : await transaction.get(newWinnerRef);
          if (newWinnerDocActual.exists) {
            const nwData = newWinnerDocActual.data();
            if (nwData.credits < netDeduction) throw new Error("Insufficient Liquid Credits for settlement.");
            
            transaction.update(newWinnerRef, {
              credits: admin.firestore.FieldValue.increment(-netDeduction),
              heldCredits: admin.firestore.FieldValue.increment(netDeduction)
            });
            ledgerService.logTransaction(transaction, newWinnerId, -netDeduction, 'BID_HOLD', nwData.credits, nwData.credits - netDeduction, auctionId);
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
          participants: admin.firestore.FieldValue.arrayUnion(userId, newWinnerId),
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
