# 🏛️ Marketplace & Live Bidding Floor (Auctions)

The **BidWars** marketplace is the platform's high-stakes command floor, providing real-time intelligence for asset liquidation.

---

## 💎 Multi-Tender Marketplace (Auction List)
A high-fidelity grid displaying all institutional assets currently under liquidation.

### How it Works:
1.  **Market Tenders**: Fetches all active auctions from the Firebase `auctions` collection.
2.  **Asset Status**: Each card dynamically displays the **Bid Count**, **Highest Bid**, and **Asset Category** (e.g., Luxury, Repossessed).
3.  **Display Optimization**: Uses `line-clamp` protocols for descriptions to maintain grid symmetry across diverse screen resolutions.
4.  **Real-Time Pulse**: When an auction state changes (e.g., someone bids), the list is automatically updated via `onSnapshot` listeners.

---

## ⚖️ Live Bidding Floor (Auction Detail)
The core interaction floor for asset acquisition.

### How it Works:
1.  **Escalation Deck (Bidding Interface)**: 
    - Participants must enter an amount higher than the `highestBid` by at least the specified `minIncrement`.
    - **Minimum Validation**: Prevents "low-balling" the tender.
2.  **EMD Authorization Gateway**: 
    - Participants MUST have enough balance to cover the **EMD (Earnest Money Deposit)** to participate.
    - If the balance is insufficient, the system blocks the bid and prompts for a **Wealth Top-up**.
3.  **Socket.IO Synchronization (BWC Protocol)**:
    - Bids are broadcasted to ALL active participants simultaneously.
    - **Scanner Animation**: Triggered on every new bid to signify verification.
4.  **Settlement Audit**: 
    - Real-time history of all bids, including who was outbid and at what timestamp.
5.  **Market Pulse (Toast)**: 
    - Notifications like "Identity Verified • Highest Bid Registered" provide institutional feedback.

---

## ⚙️ Technical Blueprint
- **Frontend Detail**: `frontend/src/pages/AuctionDetail.vue`
- **Backend Route**: `backend/routes/auctionRoutes.js`
- **Real-Time Module**: `backend/sockets/bidding.js`
- **Data Collections**: `auctions/` & `bids/` (Firestore)
