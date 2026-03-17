# 📖 BidWars — User & Admin Manual

This manual covers every role and workflow in the BidWars platform — from registering as a new bidder to managing the auction floor as an administrator.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Roles & Permissions](#2-roles--permissions)
3. [Getting Started — Bidder](#3-getting-started--bidder)
   - 3.1 [Registration](#31-registration)
   - 3.2 [Login](#32-login)
   - 3.3 [Dashboard Overview](#33-dashboard-overview)
4. [Wallet & Credits](#4-wallet--credits)
   - 4.1 [Depositing Credits](#41-depositing-credits)
   - 4.2 [EMD (Earnest Money Deposit)](#42-emd-earnest-money-deposit)
   - 4.3 [Transaction History](#43-transaction-history)
5. [Marketplace — Browsing Auctions](#5-marketplace--browsing-auctions)
6. [Placing a Bid](#6-placing-a-bid)
   - 6.1 [Auction Detail Page](#61-auction-detail-page)
   - 6.2 [Live Bidding Floor](#62-live-bidding-floor)
   - 6.3 [Outbid Notifications](#63-outbid-notifications)
   - 6.4 [Winning an Auction](#64-winning-an-auction)
7. [Admin Panel](#7-admin-panel)
   - 7.1 [Accessing the Admin Floor](#71-accessing-the-admin-floor)
   - 7.2 [Creating an Auction](#72-creating-an-auction)
   - 7.3 [Managing Auctions](#73-managing-auctions)
   - 7.4 [User Management & Auditing](#74-user-management--auditing)
   - 7.5 [Wallet & Credit Controls](#75-wallet--credit-controls)
8. [Real-Time Features](#8-real-time-features)
9. [Account Management](#9-account-management)
10. [Glossary](#10-glossary)

---

## 1. Platform Overview

BidWars is an **institutional-grade online auction marketplace** for repossessed assets, digital collectibles, and luxury goods. Key characteristics:

- **Live bidding** — bids are synchronized in real time across all active participants
- **Credit-based wallet** — all transactions use platform credits, not direct fiat payments
- **EMD system** — eligible auctions require a refundable deposit before bidding
- **Admin-controlled listings** — only administrators can create, modify, or close auctions
- **KYC-ready** — identity verification hooks are built in for future compliance integration

---

## 2. Roles & Permissions

| Action | Guest | Registered Bidder | Admin |
|---|:---:|:---:|:---:|
| Browse marketplace | ✅ | ✅ | ✅ |
| View auction details | ✅ | ✅ | ✅ |
| Register / Login | ✅ | — | — |
| Place bids | ❌ | ✅ | ✅ |
| Manage wallet | ❌ | ✅ | ✅ |
| View own bid history | ❌ | ✅ | ✅ |
| Create auctions | ❌ | ❌ | ✅ |
| Edit / close auctions | ❌ | ❌ | ✅ |
| View all users | ❌ | ❌ | ✅ |
| Adjust user credits | ❌ | ❌ | ✅ |
| Access Admin Floor | ❌ | ❌ | ✅ |

---

## 3. Getting Started — Bidder

### 3.1 Registration

1. Navigate to the homepage and click **Register** (or go to `/register`)
2. Fill in the registration form:
   - **Full Name** — your display name on the platform
   - **Email Address** — used for login; must be unique
   - **Password** — minimum 8 characters recommended
3. Click **Create Account**
4. You are automatically logged in and redirected to your **Dashboard**

> **Note:** If you register with the admin email address configured in the system (`ADMIN_EMAIL`), your account is automatically granted admin privileges.

---

### 3.2 Login

1. Navigate to `/login`
2. Enter your registered **Email** and **Password**
3. Click **Sign In**
4. On success, you are redirected to the **Marketplace** or your **Dashboard**

If you forget your password, use the **Forgot Password** link on the login page. A reset email is sent via Firebase Authentication.

---

### 3.3 Dashboard Overview

The **Sovereign Dashboard** is your personal command center. It shows:

| Section | Description |
|---|---|
| **Wallet Balance** | Current credit balance available for bidding |
| **Active Bids** | Auctions you are currently the highest bidder on |
| **Won Auctions** | Auctions you have won |
| **Bid History** | Full log of every bid you have placed |
| **Notifications** | Recent platform alerts and outbid events |

---

## 4. Wallet & Credits

BidWars uses a **credit-based wallet system**. All bids are placed using credits — no real-money transactions occur in the current version.

### 4.1 Depositing Credits

1. Navigate to **Wallet** from the sidebar or top navigation
2. Click **Add Credits**
3. Enter the amount you wish to deposit
4. Confirm — credits are added to your balance instantly

> In a production environment with a payment gateway integrated, this step would involve a real payment flow. Currently, credits are simulated.

---

### 4.2 EMD (Earnest Money Deposit)

Some high-value auctions require a **refundable EMD** to be locked before you can participate.

**How it works:**

1. Open an auction that requires EMD — you will see an **EMD Required** badge
2. Click **Pay EMD** — the specified amount is deducted from your wallet and locked
3. You can now place bids on this auction
4. **If you do not win:** the EMD is automatically refunded to your wallet after the auction closes
5. **If you win:** the EMD is applied toward your total obligation (settlement handled per auction terms)

> You cannot withdraw locked EMD funds while an auction is active.

---

### 4.3 Transaction History

All wallet activity is logged in the **Wealth Ledger**:

- Navigate to **Wallet → Transaction History**
- Each entry shows: date/time, type (deposit, bid lock, EMD, refund), and amount
- Entries are sorted newest first

---

## 5. Marketplace — Browsing Auctions

The **Marketplace Command Floor** (`/marketplace`) is the main listing view.

### Filters & Navigation

| Control | Function |
|---|---|
| **Search bar** | Filter listings by keyword (asset name, category) |
| **Status filter** | Show `Live`, `Upcoming`, or `Closed` auctions |
| **Category filter** | Filter by asset type (e.g., Vehicles, Electronics, Real Estate) |
| **Sort by** | End time, current bid, newest listed |

### Auction Card

Each card on the marketplace shows:

- Asset image and name
- **Live status indicator** (pulsing green = bidding active)
- Current highest bid
- Countdown timer to auction end
- **Bid Now** / **View Details** button

---

## 6. Placing a Bid

### 6.1 Auction Detail Page

Click any auction card to open its detail page. This page shows:

- Full asset description and images
- Current highest bid and bidder (anonymous handle)
- Complete **bid history** (all bids, newest first)
- Countdown timer
- Your current wallet balance
- The **Place Bid** panel

---

### 6.2 Live Bidding Floor

To place a bid:

1. Ensure you have sufficient **wallet credits** (your balance is shown on the page)
2. If EMD is required, complete the EMD payment first (see [Section 4.2](#42-emd-earnest-money-deposit))
3. In the **Place Bid** panel, enter a bid amount:
   - Your bid must be **higher than the current highest bid**
   - The minimum increment is shown below the input field
4. Click **Place Bid**
5. A confirmation toast appears: *"Bid placed successfully"*
6. The bid history and highest bid update instantly for all users on the page

> Bids are **binding** — once placed, a bid cannot be retracted.

---

### 6.3 Outbid Notifications

If another user places a higher bid after yours:

- A **Market Pulse** toast notification appears in the top-right corner: *"You have been outbid on [Asset Name]"*
- The auction card on your Dashboard updates its status to **Outbid**
- You may choose to place a new, higher bid

---

### 6.4 Winning an Auction

When an auction's countdown reaches zero:

- The highest bidder at that moment is declared the **winner**
- A notification is sent to all participants
- The winning bid amount appears in the winner's **Won Auctions** section on their Dashboard
- EMD (if any) transitions per the auction's settlement terms
- Losing bidders' EMDs are automatically refunded

---

## 7. Admin Panel

The Admin Floor is accessible only to accounts with the admin role.

### 7.1 Accessing the Admin Floor

1. Log in with the **admin email** configured in the system
2. Click **Admin Floor** in the navigation sidebar (visible only to admins)
3. The admin dashboard shows a summary of: total auctions, active users, recent bids, and platform wallet activity

---

### 7.2 Creating an Auction

1. In the Admin Floor, click **New Auction** (or navigate to **Auctions → Create**)
2. Fill in the auction form:

| Field | Description |
|---|---|
| **Asset Name** | Title displayed on the marketplace |
| **Category** | Asset type for filtering |
| **Description** | Full asset details (supports rich text) |
| **Image URL** | Link to the primary asset image |
| **Starting Bid** | Minimum opening bid amount (in credits) |
| **Minimum Increment** | The smallest amount by which each bid must exceed the last |
| **Start Time** | Date and time when bidding opens |
| **End Time** | Date and time when bidding closes |
| **EMD Required** | Toggle on/off; if on, enter the EMD amount |
| **Reserve Price** *(if applicable)* | Minimum price at which the item will actually sell |

3. Click **Publish Auction** — the listing appears on the Marketplace immediately if Start Time has passed, or in **Upcoming** status if it is in the future

---

### 7.3 Managing Auctions

Navigate to **Admin Floor → Auctions** to see a table of all auctions.

| Action | Description |
|---|---|
| **Edit** | Modify any field before bidding starts. Once a bid is placed, only description and images can be edited. |
| **Extend** | Push the end time forward (useful if there is low activity) |
| **Close Early** | Immediately end an auction; current highest bidder wins |
| **Cancel** | Cancel the auction entirely; all EMDs are refunded automatically |
| **View Bids** | See the full bid history for any auction |

---

### 7.4 User Management & Auditing

Navigate to **Admin Floor → Users** to view all registered accounts.

| Column | Description |
|---|---|
| **User ID** | Unique Firebase UID |
| **Email** | Registered email |
| **Display Name** | Name shown on bids |
| **Wallet Balance** | Current credit balance |
| **Bids Placed** | Total number of bids |
| **Status** | Active / Suspended |

**Admin actions per user:**

- **View Profile** — see full activity history
- **Adjust Credits** — manually add or deduct wallet credits (with audit note)
- **Suspend Account** — prevent a user from placing new bids
- **Reinstate Account** — re-enable a suspended account

> All admin actions on user accounts are logged in the audit trail with timestamp, admin email, and a reason note.

---

### 7.5 Wallet & Credit Controls

Navigate to **Admin Floor → Wallet Ledger** to review platform-wide credit flows:

- Total credits in circulation
- Per-user wallet summaries
- EMD locks currently active
- Manual credit adjustments log

---

## 8. Real-Time Features

BidWars uses **Socket.IO** to push updates without page refreshes.

| Event | What you see |
|---|---|
| New bid placed | Highest bid and bid history update instantly on the auction page |
| Outbid | Toast notification + Dashboard status update |
| Auction ending soon | Countdown pulse intensifies in the final 60 seconds |
| Auction closed | Status badge changes to **Closed**; winner announced |
| New auction listed | Marketplace updates automatically |

> Real-time features require a stable internet connection. If you experience stale data, refresh the page to re-establish the Socket.IO connection.

---

## 9. Account Management

### Changing Your Password

1. Go to **Profile → Security**
2. Click **Change Password**
3. Enter your current password and the new password twice
4. Click **Update Password**

### Updating Display Name

1. Go to **Profile → Settings**
2. Edit the **Display Name** field
3. Click **Save Changes**

### Logging Out

Click your avatar or name in the top navigation bar, then select **Sign Out**. Your session is cleared from the browser immediately.

---

## 10. Glossary

| Term | Definition |
|---|---|
| **EMD** | Earnest Money Deposit — a refundable credit lock required to participate in certain high-value auctions |
| **Market Pulse** | The real-time notification system that delivers instant alerts for bid events |
| **Sovereign Dashboard** | The personalized bidder dashboard showing portfolio, bids, and wallet |
| **Admin Floor** | The restricted administration panel for managing auctions and users |
| **Wealth Ledger** | The wallet transaction history log |
| **Live Status Indicator** | The pulsing green badge on active auction cards |
| **BWC Compliance** | BidWars Compliance — the internal security and audit standards the platform follows |
| **KYC** | Know Your Customer — identity verification protocol (architecture present, not yet fully integrated) |
| **Verified Circuit** | The eligibility check system that gates participation in restricted auctions |
| **Elite Indigo** | The platform's visual design system — deep indigo palette with glassmorphism effects |

---

*BidWars — Institutional-grade auction infrastructure. For support or to report issues, visit [github.com/Harsh127-pixel/bidwars-auction-platform/issues](https://github.com/Harsh127-pixel/bidwars-auction-platform/issues)*
