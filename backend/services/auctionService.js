const { db, admin } = require('../config/firebase');
const ledgerService = require('./ledger');

class AuctionService {
  /**
   * Closes auctions that have passed their end time.
   * Processes winners, settles held credits, and creates fulfillment orders.
   */
  async closeExpiredAuctions(io) {
    try {
      const now = new Date();
      // Find active auctions that should be closed
      const snapshot = await db.collection('auctions')
        .where('status', '==', 'active')
        .get();

      const expiredDocs = snapshot.docs.filter(doc => {
        const data = doc.data();
        const endTime = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime);
        return endTime <= now;
      });

      if (expiredDocs.length === 0) return;

      console.log(`[AuctionService] Processing ${expiredDocs.length} expired auctions.`);

      for (const doc of expiredDocs) {
        await this.finalizeAuction(doc.id, io);
      }
    } catch (err) {
      console.error('[AuctionService] Error closing auctions:', err.message);
    }
  }

  async finalizeAuction(auctionId, io) {
    try {
      let sideEffects = null;

      await db.runTransaction(async (transaction) => {
        const auctionRef = db.collection('auctions').doc(auctionId);
        const auctionDoc = await transaction.get(auctionRef);

        if (!auctionDoc.exists) return;

        const auctionData = auctionDoc.data();
        if (auctionData.status !== 'active') return;

        const winnerId = auctionData.highestBidder;
        const finalPrice = auctionData.highestBid || 0;
        const sellerId = auctionData.sellerId || 'admin';

        let winnerRef = null;
        let winnerDoc = null;
        let sellerRef = null;
        let sellerDoc = null;

        if (winnerId && finalPrice > 0) {
          winnerRef = db.collection('users').doc(winnerId);
          winnerDoc = await transaction.get(winnerRef);

          if (sellerId !== 'admin') {
            sellerRef = db.collection('users').doc(sellerId);
            sellerDoc = await transaction.get(sellerRef);
          }
        }

        transaction.update(auctionRef, {
          status: 'closed',
          closedAt: new Date(),
          updatedAt: new Date()
        });

        if (winnerId && finalPrice > 0 && winnerDoc && winnerDoc.exists) {
          const winnerData = winnerDoc.data();
          const platformFee = Math.round(finalPrice * 0.01);
          const netSellerAmount = finalPrice - platformFee;
          const revenueToAdd = sellerId === 'admin' ? finalPrice : platformFee;

          transaction.update(winnerRef, {
            heldCredits: admin.firestore.FieldValue.increment(-finalPrice)
          });

          ledgerService.logTransaction(
            transaction,
            winnerId,
            -finalPrice,
            'BID_WIN_FINAL',
            winnerData.credits + finalPrice,
            winnerData.credits,
            auctionId
          );

          if (sellerId !== 'admin' && sellerDoc && sellerDoc.exists) {
            const sellerData = sellerDoc.data();

            transaction.update(sellerRef, {
              credits: admin.firestore.FieldValue.increment(netSellerAmount)
            });

            ledgerService.logTransaction(
              transaction,
              sellerId,
              netSellerAmount,
              'AUCTION_SALE',
              sellerData.credits,
              sellerData.credits + netSellerAmount,
              auctionId
            );
          }

          const orderRef = db.collection('fulfillment_orders').doc();
          transaction.set(orderRef, {
            auctionId,
            auctionTitle: auctionData.title,
            winnerId,
            sellerId,
            amount: finalPrice,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
          });

          const adminWalletRef = db.collection('settings').doc('admin_wallet');
          transaction.set(adminWalletRef, {
            totalRevenue: admin.firestore.FieldValue.increment(revenueToAdd),
            lastUpdated: new Date()
          }, { merge: true });

          const adminRevenueRef = db.collection('admin_transactions').doc();
          transaction.set(adminRevenueRef, {
            type: sellerId === 'admin' ? 'AUCTION_REVENUE' : 'PLATFORM_FEE',
            auctionId,
            amount: revenueToAdd,
            userId: winnerId,
            createdAt: new Date()
          });

          sideEffects = {
            winnerId,
            sellerId,
            finalPrice,
            netSellerAmount,
            auctionTitle: auctionData.title,
            notifySeller: sellerId !== 'admin' && sellerDoc && sellerDoc.exists
          };
        }
      });

      if (sideEffects) {
        const notificationService = require('./notificationService');

        notificationService.send(
          sideEffects.winnerId,
          'AUCTION_WON',
          `Congratulations! You won the auction for "${sideEffects.auctionTitle}" with a bid of ₹${sideEffects.finalPrice}.`,
          { auctionId, amount: sideEffects.finalPrice }
        );

        if (sideEffects.notifySeller) {
          notificationService.send(
            sideEffects.sellerId,
            'ITEM_SOLD',
            `Your item "${sideEffects.auctionTitle}" was sold for ₹${sideEffects.finalPrice}. Net credited: ₹${sideEffects.netSellerAmount} (after 1% fee).`,
            { auctionId, amount: sideEffects.netSellerAmount }
          );
        }
      }

      if (io) {
        io.emit('auction:closed', {
          auctionId,
          winnerId: sideEffects?.winnerId || null,
          finalPrice: sideEffects?.finalPrice || 0,
          title: sideEffects?.auctionTitle || ''
        });
      }

      console.log(`[AuctionService] Auction ${auctionId} finalized.`);
    } catch (err) {
      console.error(`[AuctionService] Failed to finalize ${auctionId}:`, err.message);
    }
  }
}

module.exports = new AuctionService();
