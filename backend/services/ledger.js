const firebase = require('../config/firebase');

/**
 * Professional Ledger Service
 * Handles atomic credit movements and transaction logging.
 */
class LedgerService {
  get db() {
    if (!firebase.db) throw new Error("Firestore 'db' not initialized in LedgerService");
    return firebase.db;
  }

  get admin() {
    return firebase.admin;
  }
  /**
   * Log a transaction entry within an existing Firestore transaction
   * @param {object} transaction - Firestore Transaction object
   * @param {string} userId - Target User ID
   * @param {number} amount - Amount change
   * @param {string} type - Transaction type
   * @param {number} prevBalance - Balance before change
   * @param {number} newBalance - Balance after change
   * @param {string} auctionId - Associated auction
   */
  logTransaction(transaction, userId, amount, type, prevBalance, newBalance, auctionId = null) {
    const ledgerRef = this.db.collection('transactions').doc();
    transaction.set(ledgerRef, {
      userId,
      amount,
      type,
      auctionId,
      prevBalance,
      newBalance,
      status: 'COMPLETED',
      createdAt: this.admin.firestore.FieldValue.serverTimestamp()
    });
  }

  /**
   * Perform an atomic transaction and log it to the ledger (Standalone)
   */
  async recordTransaction(userId, amount, type, auctionId = null) {
    const userRef = this.db.collection('users').doc(userId);

    return this.db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("User does not exist in ledger.");

      const currentCredits = userDoc.data().credits || 0;
      const newBalance = currentCredits + amount;
      if (newBalance < 0) throw new Error("Insufficient Liquid Credits.");

      t.update(userRef, { credits: newBalance });
      this.logTransaction(t, userId, amount, type, currentCredits, newBalance, auctionId);

      return { newBalance };
    });
  }

  async getHistory(userId) {
    try {
      console.log(`[Ledger] Fetching history for user: ${userId}`);
      if (!this.db) throw new Error("Database not connected");
      
      const snapshot = await this.db.collection('transactions')
        .where('userId', '==', userId)
        .limit(100)
        .get();
      
      console.log(`[Ledger] Found ${snapshot.size} transactions for ${userId}`);
      
      const toMs = (ts) => {
        if (!ts) return 0;
        if (typeof ts === 'number') return ts;
        if (ts._seconds) return ts._seconds * 1000;
        if (ts.seconds) return ts.seconds * 1000;
        if (ts.toDate) return ts.toDate().getTime();
        return new Date(ts).getTime() || 0;
      };

      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
    } catch (err) {
      console.error(`[Ledger] getHistory Error:`, err.message);
      throw err;
    }
  }
}

module.exports = new LedgerService();
