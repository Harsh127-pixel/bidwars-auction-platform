const db = require('../config/firebase');

/**
 * FRAUD DETECTION SERVICE
 * Detects shill bidding and suspicious IP patterns.
 */
class FraudService {
  async checkBiddingPattern(auctionId, userId, ip) {
    const flags = [];
    
    try {
      // 1. IP Matching (Same IP multiple accounts on same listing)
      const recentBids = await db.collection('bids')
        .where('auctionId', '==', auctionId)
        .where('ip', '==', ip)
        .get();
        
      const otherUsersOnSameIp = new Set();
      recentBids.forEach(doc => {
        if (doc.data().userId !== userId) {
          otherUsersOnSameIp.add(doc.data().userId);
        }
      });
      
      if (otherUsersOnSameIp.size > 0) {
        flags.push({
          type: 'SHILL_IP_MATCH',
          severity: 'high',
          detail: `IP detected on multiple accounts: ${[...otherUsersOnSameIp].join(', ')}`
        });
      }

      // 2. Behavioral Analysis: Price Pumping (Shill Relationship)
      // If a user bids on many of this seller's items but never wins
      const auctionDoc = await db.collection('auctions').doc(auctionId).get();
      const sellerId = auctionDoc.data().sellerId;

      if (sellerId && sellerId !== 'admin' && sellerId !== userId) {
        // Query recent bids by this user on this seller's items
        const sellerAuctions = await db.collection('auctions')
          .where('sellerId', '==', sellerId)
          .limit(10)
          .get();
        
        const sellerAuctionIds = sellerAuctions.docs.map(doc => doc.id);
        
        let attempts = 0;
        let wins = 0;

        for (const sId of sellerAuctionIds) {
          const userBidOnThis = await db.collection('bids')
            .where('auctionId', '==', sId)
            .where('userId', '==', userId)
            .get();
          
          if (!userBidOnThis.empty) {
            attempts++;
            const auctionData = (await db.collection('auctions').doc(sId).get()).data();
            if (auctionData.highestBidder === userId && auctionData.status === 'closed') {
              wins++;
            }
          }
        }

        // Flag: High activity with single seller, zero wins
        if (attempts >= 3 && wins === 0) {
          flags.push({
            type: 'SHILL_RELATIONSHIP',
            severity: 'medium',
            detail: `User has bid on ${attempts} items from this seller with 0 wins. Potential price pumping.`
          });
        }
      }

    } catch (e) {
      console.error("Fraud Check Error:", e);
    }
    
    return flags;
  }

  async flagListing(auctionId, reason) {
    await db.collection('auctions').doc(auctionId).update({
      flagged: true,
      flagReason: reason,
      updatedAt: new Date()
    });
  }
}

module.exports = new FraudService();
