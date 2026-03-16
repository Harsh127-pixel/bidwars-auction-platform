const db = require('../config/firebase');

/**
 * REPORTING SERVICE
 * Aggregates platform sales, fees, and user engagement.
 */
class ReportService {
  async getPlatformSummary() {
    const auctions = await db.collection('auctions').get();
    const deposits = await db.collection('transactions').where('type', '==', 'WALLET_TOPUP').get();
    
    let totalSales = 0;
    let platformFees = 0;
    let completedAuctions = 0;
    let totalDeposits = 0;

    const dailyRevenue = {};
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(date => dailyRevenue[date] = 0);

    const users = await db.collection('users').get();
    const userMap = {};
    users.forEach(doc => userMap[doc.id] = doc.data());

    auctions.forEach(doc => {
      const data = doc.data();
      if (data.status === 'closed' && data.highestBidder) {
        const bid = data.highestBid || 0;
        totalSales += bid;
        
        // Dynamic Fee Calculation based on Seller Tier
        const seller = userMap[data.sellerId] || { membershipTier: 'Bronze' };
        const rate = seller.membershipTier === 'Gold' ? 0.01 : (seller.membershipTier === 'Silver' ? 0.03 : 0.05);
        platformFees += bid * rate;
        
        completedAuctions++;

        // Time-series aggregation
        if (data.endTime) {
          const date = new Date(data.endTime.toDate ? data.endTime.toDate() : data.endTime).toISOString().split('T')[0];
          if (dailyRevenue[date] !== undefined) {
            dailyRevenue[date] += bid;
          }
        }
      }
    });

    let totalLiquidity = 0;
    deposits.forEach(doc => {
      totalLiquidity += (doc.data().amount || 0);
    });

    const flagged = await db.collection('auctions').where('flagged', '==', true).get();
    
    let kycPending = 0;
    const tiers = { Gold: 0, Silver: 0, Bronze: 0 };
    users.forEach(doc => {
      const u = doc.data();
      if (u.kycStatus === 'pending') kycPending++;
      const tier = u.membershipTier || 'Bronze';
      if (tiers[tier] !== undefined) tiers[tier]++;
    });

    return {
      totalSales,
      platformFees,
      completedAuctions,
      kycPending,
      fraudAlerts: flagged.size,
      tierDistribution: tiers,
      totalLiquidity,
      timeSeries: {
        labels: last7Days.map(d => d.split('-').slice(1).join('/')),
        values: last7Days.map(d => dailyRevenue[d])
      }
    };
  }
}

module.exports = new ReportService();
