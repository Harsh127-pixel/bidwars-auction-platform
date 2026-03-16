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
      await db.runTransaction(async (transaction) => {
        const auctionRef = db.collection("auctions").doc(auctionId);
        const userRef = db.collection("users").doc(userId);
        
        const auctionDoc = await transaction.get(auctionRef);
        const userDoc = await transaction.get(userRef);

        if (!auctionDoc.exists) throw "Auction listing not found.";
        if (!userDoc.exists) throw "User identity not found.";

        const auctionData = auctionDoc.data();
        const userData = userDoc.data();

        // 1. Validation Logic
        if (auctionData.status !== 'active') throw "This bidding floor is currently closed.";
        if (userData.credits < amount) throw "Insufficient wealth ledger balance for this bid.";

        // 2. Fraud Detection
        const fraudFlags = await fraudService.checkBiddingPattern(auctionId, userId, ip);
        if (fraudFlags.length > 0) {
          console.warn(`[FRAUD ALERT] User ${userId} flagged on ${auctionId}`);
          await fraudService.flagListing(auctionId, fraudFlags[0].detail);
          io.emit('admin:flagged', { auctionId, reason: fraudFlags[0].detail });
        }

        const currentPrice = auctionData.highestBid || auctionData.minBid;
        const increment = getMinIncrement(currentPrice);
        const minRequired = currentPrice + increment;

        if (amount < minRequired) {
          throw `Inadequate Offer. Market rules require a minimum increment of ₹${increment}. Next valid bid is ₹${minRequired}.`;
        }

        // 3. Proxy Competition Logic
        // Find existing top proxy if any
        const proxyRef = db.collection("proxyBids").doc(auctionId);
        const currentProxyDoc = await transaction.get(proxyRef);
        const currentProxyData = currentProxyDoc.exists ? currentProxyDoc.data() : null;

        let finalPrice = amount;
        let newWinnerId = userId;

        if (currentProxyData && currentProxyData.userId !== userId) {
          const existingMax = currentProxyData.maxAmount;
          
          if (amount > existingMax) {
            // New bidder beats old proxy
            // Price becomes old_max + increment
            finalPrice = calculateRequiredBid(existingMax);
            newWinnerId = userId;
            // Update proxy record for new winner
            transaction.set(proxyRef, { userId, maxAmount: amount, updatedAt: new Date() });
          } else {
            // Old proxy beats new bidder
            // Price becomes new_bid + increment
            finalPrice = calculateRequiredBid(amount);
            newWinnerId = currentProxyData.userId;
            // Old proxy remains, price goes up
            throw { type: 'OUTBID', message: `You have been instantly outbid by an existing proxy. Price is now ₹${finalPrice}.`, currentPrice: finalPrice };
          }
        } else {
          // No competing proxy or same user updating max
          transaction.set(proxyRef, { userId, maxAmount: amount, updatedAt: new Date() });
        }

        // 4. Financial Settlement (EMD/Hold)
        const newWinnerRef = db.collection("users").doc(newWinnerId);
        const newWinnerDoc = (newWinnerId === userId) ? userDoc : await transaction.get(newWinnerRef);
        const newWinnerData = newWinnerDoc.data();

        // If a new bidder takes the lead, or price increases for existing lead
        const priceIncrease = finalPrice - (auctionData.highestBid || 0);
        
        if (priceIncrease > 0) {
          if (newWinnerData.credits < priceIncrease) throw "Insufficient Liquid Credits for settlement.";
          
          transaction.update(newWinnerRef, {
            credits: admin.firestore.FieldValue.increment(-priceIncrease),
            heldCredits: admin.firestore.FieldValue.increment(priceIncrease)
          });

          // Log the hold
          ledgerService.logTransaction(transaction, newWinnerId, -priceIncrease, 'BID_HOLD', newWinnerData.credits, newWinnerData.credits - priceIncrease, auctionId);
        }

        // Refund previous bidder if they were outbid by a different user
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
        transaction.update(auctionRef, {
          highestBid: finalPrice,
          highestBidder: newWinnerId,
          bidCount: (auctionData.bidCount || 0) + 1,
          reserveMet: auctionData.reservePrice ? finalPrice >= auctionData.reservePrice : true,
          updatedAt: new Date()
        });

        // Record bid in history
        const bidLogRef = db.collection("bids").doc();
        transaction.set(bidLogRef, {
          auctionId,
          userId,
          amount: finalPrice,
          maxAmount: amount,
          ip,
          timestamp: new Date(),
          isProxy: !!isProxy
        });

        // Soft-close logic (Timer extension)
        const endTime = new Date(auctionData.endTime).getTime();
        if (endTime - Date.now() < 120000) { // 2 mins
          const newEndTime = new Date(endTime + 180000).toISOString();
          transaction.update(auctionRef, { endTime: newEndTime });
          io.emit("timerExtension", { auctionId, newEndTime });
        }

        io.emit("bidUpdate", { 
          auctionId, 
          userId: newWinnerId, 
          amount: finalPrice, 
          bidCount: (auctionData.bidCount || 0) + 1,
          reserveMet: auctionData.reservePrice ? finalPrice >= auctionData.reservePrice : true
        });
      });

    } catch (error) {
      console.error("Bidding Engine Error:", error);
      socket.emit("error", { 
        message: typeof error === 'string' ? error : (error.message || "Bidding transaction failed"),
        type: error.type || 'SERVER_ERROR'
      });
    }
  };

  io.on("connection", (socket) => {
    socket.on("placeBid", async (data) => await processBid(socket, data));
  });
};
