const { db, admin } = require('../config/firebase');

/**
 * Professional Ledger Service
 * Handles atomic credit movements and transaction logging.
 */
class LedgerService {
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
    const ledgerRef = db.collection('transactions').doc();
    transaction.set(ledgerRef, {
      userId,
      amount,
      type,
      auctionId,
      prevBalance,
      newBalance,
      status: 'COMPLETED',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  /**
   * Perform an atomic transaction and log it to the ledger (Standalone)
   */
  async recordTransaction(userId, amount, type, auctionId = null) {
    const userRef = db.collection('users').doc(userId);

    return db.runTransaction(async (t) => {
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

  /**
   * Retrieve transaction history for a user
   */
  async getHistory(userId) {
    // Fetch without orderBy to avoid composite index requirement in sandbox
    const snapshot = await db.collection('transactions')
      .where('userId', '==', userId)
      .limit(100)
      .get();
    
    // Sort in-memory (Latest first)
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const getTs = (obj) => {
          if (!obj?.createdAt) return 0;
          if (obj.createdAt._seconds) return obj.createdAt._seconds;
          if (obj.createdAt.seconds) return obj.createdAt.seconds;
          if (obj.createdAt instanceof Date) return obj.createdAt.getTime() / 1000;
          return 0;
        };
        return getTs(b) - getTs(a);
      });
  }
}

module.exports = new LedgerService();
