# 🏢 Executive Admin Floor (Administration)

The **BidWars** admin floor provides surveillance and liquidation control for platform operators.

---

## 🛰️ Executive Surveillance
A dashboard for auditing high-value assets and participant activity.

### How it Works:
1.  **Administrative Route Guard**: 
    - Routes like `/admin` are protected by `isAdmin` middleware.
    - Only users with an `admin` role (and an email matching `VITE_ADMIN_EMAIL`) can access this floor.
2.  **Surveillance Data**: 
    - Fetches the entire directory of auctions, including closed or archived ones.
    - Displays **Highest Bid** versus **Floor Price** to evaluate liquidation performance.

---

## ⚖️ Liquidation Command
The creation and management of auction assets.

### How it Works:
1.  **Asset Creation**: 
    - Admins fill out the **Liquidation Protocol Form** (Title, Minimum Bid, EMD, End Date, Category, Image URL).
    - **Minimum Floor Price**: Sets the absolute starting point for all tenders.
2.  **Asset Liquidation (Delete)**:
    - Admins can arch an auction from the floor at any time.
    - **BWC Purge Protocol**: Removes the asset from the marketplace and potentially invalidates any currently active bids.
3.  **Real-Time Dashboard**: 
    - The admin floor refreshes automatically after any liquidation activity to maintain data accuracy.

---

## ⚙️ Technical Blueprint
- **Frontend Page**: `frontend/src/pages/Admin.vue`
- **Backend Admin SDK**: `backend/config/firebase.js` (used for role elevation).
- **Executive Middleware**: `backend/middleware/adminMiddleware.js`
- **Identity Sync**: Env variable `ADMIN_EMAIL` matches the admin's credential.
