# 💸 Wealth Ledger & Escrow Protocol (Wallet)

The **BidWars** wealth ledger is the institutional banking environment for managing bidder liquidity.

---

## 🏛️ Portfolio Intelligence
A centralized view of the participant's accessible capital.

### How it Works:
1.  **Identity Wallet Sync**: 
    - Fetches the user's `credits` and `escrow` balances from their record in Firestore.
    - Updated in real-time as bids are placed or won.
2.  **Credit Ledger**:
    - **Purchasable Credits**: Participants can currently top up credits in increments (1000, 5000, 10000).
    - **Top-up Protocol**: Integrates `topupService` to update the Firestore balance synchronously.
3.  **Visual Depth**: Uses glassmorphism and institutional icons to define different capital categories.

---

## ⚖️ Escrow Protocol (EMD)
Ensuring participant commitment on high-stakes tenders.

### How it Works:
1.  **Earnest Money Deposit (EMD)**: 
    - When a participant bids, the EMD amount is move from their **Available Credits** to **Escrow**.
    - This "locks" the commitment to ensure they can fulfill the tender.
2.  **Settlement Release**:
    - If a participant is outbid, the EMD is released back to their **Available Credits** immediately.
    - If a participant wins, the EMD is applied towards the final settlement price.
3.  **Bidding Guard**:
    - The `AuctionDetail.vue` component blocks any bid if the wallet's `availableCredits` < `EMD`.
    - **Wealth Warning**: Prompting the participant to "Initialize Capital Injection" to continue.

---

## ⚙️ Technical Blueprint
- **Frontend Wallet**: `frontend/src/pages/Wallet.vue`
- **Wallet Service**: Firestore atomic updates for credits/escrow.
- **Top-up Logic**: `frontend/src/services/wallet.js`
- **Data Collections**: `users/` (credits & escrow fields)
