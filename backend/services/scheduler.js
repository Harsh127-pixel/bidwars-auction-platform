const cron = require('node-cron');
const admin = require('firebase-admin');
const auctionService = require('./auctionService');

/**
 * Initializes background scheduled tasks
 * @param {Object} io - Socket.io instance
 * @param {Object} db - Firestore instance
 */
exports.init = (io, db) => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    console.log('[SCHEDULER] Heartbeat...');
    
    try {
      // 1. Check for expired auctions and finalize them
      await auctionService.closeExpiredAuctions(io);

      // 2. Final Call notifications
      const now = Date.now();
      const targetTime = now + (15 * 60 * 1000); // 15 mins from now
      
      // Look for auctions ending in the next 15-16 minutes
      // Firestore doesn't have a direct "exactly 15 mins" query easily with ranges,
      // so we query a small window.
      const startTime = new Date(targetTime - 30000); // 14.5 mins
      const endTime = new Date(targetTime + 30000);   // 15.5 mins

      // Fetch all auctions without filters (avoids index requirements) then filter in-memory
      const snapshot = await db.collection('auctions').get();

      const now2 = Date.now();
      const relevantDocs = snapshot.docs.filter(doc => {
        const d = doc.data();
        if (d.status !== 'active') return false;
        const et = d.endTime;
        if (!et) return false;
        const endMs = et._seconds ? et._seconds * 1000 : new Date(et).getTime();
        return endMs >= startTime.getTime() && endMs <= endTime.getTime();
      });

      for (const doc of relevantDocs) {
        const auctionId = doc.id;
        const auctionData = doc.data();

        console.log(`[SCHEDULER] Found auction ending soon: ${auctionData.title}`);

        // Find all watchers for this auction
        const watchlistSnapshot = await db.collection('watchlist')
          .where('auctionId', '==', auctionId)
          .get();

        if (watchlistSnapshot.empty) continue;

        const userIds = watchlistSnapshot.docs.map(w => w.data().userId);

        // Store notification for each user
        for (const uid of userIds) {
          await db.collection('notifications').add({
            userId: uid,
            type: 'FINAL_CALL',
            auctionId: auctionId,
            message: `Final Call: "${auctionData.title}" ends in 15 minutes!`,
            createdAt: new Date(),
            read: false
          });
        }

        // Emit socket event for real-time notification if users are online
        io.emit('auction:finalCall', {
          auctionId,
          title: auctionData.title,
          userIds // Frontend will filter based on local user
        });
      }

    } catch (err) {
      console.error('[SCHEDULER ERROR]', err);
    }
  });
};
