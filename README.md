# 🏛️ BidWars: Elite Auction Marketplace

BidWars is a high-fidelity, institutional-grade auction platform designed for high-stakes repossessed assets, digital collectibles, and luxury goods. Built with a focus on **absolute viewport symmetry**, the **Elite Indigo** aesthetic, and **Material Design 3** principles, it provides a seamless and secure bidding experience.

---

## 🚀 Key Features

### 💎 Elite Aesthetic & UX
- **Elite Indigo Pro**: A premium design system using deep indigos, glassmorphism, and subtle micro-animations.
- **Institutional Onboarding**: Re-calibrated **Login** and **Register** gateways with dual-pane scaling and HUD-overlays.
- **Marketplace Command Floor**: High-fidelity product grid with live status indicators and real-time market pulse.
- **Sovereign Dashboard**: Personalized portfolio view for bidders and executives.

### 🛡️ Security & Protocol
- **BWC Core Encryption**: Secure session management and identity verification.
- **Verified Circuit**: Participation protocols for institutional bidding floors.
- **KYC-Ready Protocol**: Ready for global liquidity pool integration.
- **Admin Surveillance**: Dedicated administration floor for asset liquidation and user auditing.

### ⚡ Real-Time Intelligence
- **Live Bidding Floor**: Instant bid synchronization via Socket.IO.
- **Market Pulse**: Real-time notifications and toast protocols for auction events.
- **Wealth Ledger**: Integrated wallet system for Managing Credits and EMD (Earnest Money Deposit).

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [Vue 3](https://vuejs.org/) (Composition API)
- **UI Engine**: [Vuetify 3](https://vuetifyjs.com/) (Material Design 3)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/) & SASS
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Routing**: Vue Router 4
- **Real-Time**: Socket.IO Client

### Backend
- **Server**: [Node.js](https://nodejs.org/) & [Express 5](https://expressjs.com/)
- **Database/Auth**: [Firebase](https://firebase.google.com/) (Firestore & Admin SDK)
- **Communications**: Socket.IO
- **AI Integration**: Google Generative AI (Gemini SDK)

---

## ⚙️ Initial Setup Protocol

### Prerequisites
- Node.js (`^20.19.0` or `>=22.12.0`)
- Firebase Account & Project Configuration
- Service Account Credentials for Admin SDK

### 1. Repository Initialization
```bash
git clone <repository-url>
cd bidwars-auction-platform
```

### 2. Backend Calibration
```bash
cd backend
npm install
```
Create a `.env` file in the `/backend` directory:
```env
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="your-private-key"
ADMIN_EMAIL=admin@bidwars.elite
```

### 3. Frontend Execution
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `/frontend` directory:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_ADMIN_EMAIL=admin@bidwars.elite
```

---

## 🚦 Running the Platform

### Start Backend Development Logic
```bash
cd backend
npm run dev
```

### Start Frontend Control Floor
```bash
cd frontend
npm run dev
```

---

## 📂 Project Architecture
```text
/backend
  ├── config/        # Firebase & Server configurations
  ├── routes/        # API Endpoints (Auctions, Bids, Wallet)
  ├── sockets/       # Real-time bidding logic
  └── server.js      # Main entry point

/frontend
  ├── src/
  │   ├── pages/     # Main views (Admin, Dashboard, Login, Wallet)
  │   ├── components/# Reusable MD3 components
  │   ├── store/     # Pinia stores (Auth, Auction)
  │   └── services/  # API & Socket services
```

---

## 📜 Compliance & Security
This platform follows **BWC Compliance Standards**. All transactions and bids are audited within the **Identity Verified** circuit. 