// FILE: backend/services/ReportService.js
const { db } = require('../config/firebase')

// Safe timestamp-to-ms converter that handles all Firestore formats
const toMs = (ts) => {
  if (!ts) return 0
  try {
    if (typeof ts.toDate === 'function') return ts.toDate().getTime()
    if (ts._seconds) return ts._seconds * 1000
    if (ts.seconds) return ts.seconds * 1000
    const d = new Date(ts)
    return isNaN(d.getTime()) ? 0 : d.getTime()
  } catch {
    return 0
  }
}

class ReportService {
  async getPlatformSummary() {
    // Fetch all collections — no composite queries, no orderBy
    const [auctionsSnap, depositsSnap, usersSnap, flaggedSnap] = await Promise.all([
      db.collection('auctions').get(),
      db.collection('transactions').where('type', '==', 'WALLET_TOPUP').get(),
      db.collection('users').get(),
      db.collection('users').where('isFlagged', '==', true).get(),
    ])

    let totalSales = 0
    let platformFees = 0
    let completedAuctions = 0

    // Build a user map for tier lookups
    const userMap = {}
    usersSnap.forEach(doc => { userMap[doc.id] = doc.data() })

    // Build last-7-days date keys
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      last7Days.push(d.toISOString().split('T')[0])
    }
    const dailyRevenue = {}
    last7Days.forEach(date => { dailyRevenue[date] = 0 })

    auctionsSnap.forEach(doc => {
      const data = doc.data()
      if (data.status === 'closed' && data.highestBidder) {
        const bid = data.highestBid || 0
        totalSales += bid
        completedAuctions++

        // Dynamic fee by seller tier
        const seller = userMap[data.sellerId] || {}
        const tier = seller.membershipTier || 'Bronze'
        const rate = tier === 'Gold' ? 0.01 : (tier === 'Silver' ? 0.03 : 0.05)
        platformFees += bid * rate

        // Time-series — safely parse endTime
        const endMs = toMs(data.endTime)
        if (endMs > 0) {
          const dateKey = new Date(endMs).toISOString().split('T')[0]
          if (dailyRevenue[dateKey] !== undefined) {
            dailyRevenue[dateKey] += bid
          }
        }
      }
    })

    // Total deposits
    let totalLiquidity = 0
    depositsSnap.forEach(doc => {
      totalLiquidity += (doc.data().amount || 0)
    })

    // KYC and tier distribution
    let kycPending = 0
    const tiers = { Gold: 0, Silver: 0, Bronze: 0 }
    usersSnap.forEach(doc => {
      const u = doc.data()
      if (u.kycStatus === 'pending') kycPending++
      const tier = u.membershipTier || 'Bronze'
      if (tiers[tier] !== undefined) tiers[tier]++
    })

    return {
      totalSales,
      platformFees: Math.round(platformFees),
      completedAuctions,
      kycPending,
      fraudAlerts: flaggedSnap.size,
      tierDistribution: tiers,
      totalLiquidity,
      timeSeries: {
        labels: last7Days.map(d => {
          const [, m, day] = d.split('-')
          return `${day}/${m}`
        }),
        values: last7Days.map(d => Math.round(dailyRevenue[d]))
      }
    }
  }

  async getAuditLogs() {
    const [txSnap, fulfillmentSnap, auctionSnap] = await Promise.all([
      db.collection('transactions').get(),
      db.collection('fulfillment_orders').get(),
      db.collection('auctions').where('status', '==', 'closed').get()
    ])

    const transactions = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const orders = fulfillmentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const auctions = auctionSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return { transactions, orders, auctions }
  }

  async getInventorySummary() {
    const auctionsSnap = await db.collection('auctions').get()
    const inventory = auctionsSnap.docs.map(doc => {
      const data = doc.data()
      return {
        title: data.title,
        category: data.category || 'Uncategorized',
        status: data.status,
        price: data.highestBid || data.minBid || 0
      }
    })

    const { generateAuctionSummary } = require('./aiListing')
    const summary = await generateAuctionSummary(inventory)
    return { summary }
  }
}

module.exports = new ReportService()