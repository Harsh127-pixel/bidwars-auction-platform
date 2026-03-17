# 🏛️ BidWars — Elite Auction Marketplace

> A high-fidelity, institutional-grade auction platform for repossessed assets, digital collectibles, and luxury goods. Built with real-time bidding, a premium **Elite Indigo** design system, and **Material Design 3** principles.

🔗 **Live Demo**: [bidwars.gaurangjadoun.in](https://bidwars.gaurangjadoun.in)
For testing the app:
admin_login:admin@bidwars.elite
admin_password:Admin@123

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Setup Instructions](#-setup-instructions)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Running the Platform](#-running-the-platform)
- [Known Limitations](#-known-limitations)

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [Vue 3](https://vuejs.org/) (Composition API) | Core UI framework |
| [Vuetify 3](https://vuetifyjs.com/) | Material Design 3 component library |
| [TailwindCSS 4](https://tailwindcss.com/) + SASS | Utility-first styling & custom theming |
| [Pinia](https://pinia.vuejs.org/) | Global state management |
| Vue Router 4 | Client-side routing |
| Socket.IO Client | Real-time bidding & live notifications |

### Backend
| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) (`^20.19.0` or `>=22.12.0`) | Runtime environment |
| [Express 5](https://expressjs.com/) | REST API server |
| [Firebase Firestore](https://firebase.google.com/) | Primary database |
| Firebase Admin SDK | Server-side authentication & admin operations |
| Socket.IO | WebSocket server for real-time events |
| Google Generative AI (Gemini SDK) | AI-powered features |

### Infrastructure
| Technology | Purpose |
|---|---|
| Firebase Auth | User identity & session management |
| Render | Cloud hosting & deployment (`render.yaml` included) |

---

## ✨ Features

### 🎨 Elite Aesthetic & UX
- **Elite Indigo Pro Design System** — deep indigos, glassmorphism effects, and micro-animations throughout
- **Institutional Onboarding** — dual-pane Login and Register gateways with HUD-style overlays
- **Marketplace Command Floor** — high-fidelity product grid with live status badges and real-time market pulse indicators
- **Sovereign Dashboard** — personalized portfolio view for both bidders and admin executives
- **Fully Responsive** — absolute viewport symmetry across desktop and mobile

### ⚡ Real-Time Intelligence
- **Live Bidding Floor** — instant bid synchronization via Socket.IO; all connected users see bids update in real time
- **Market Pulse Notifications** — toast alerts for outbid events, auction closings, and platform announcements
- **Auction Countdown Timers** — live countdowns per listing that auto-close when time expires

### 💰 Wallet & Transactions
- **Wealth Ledger** — integrated wallet system for managing credits
- **EMD (Earnest Money Deposit)** support — bidders lock funds before participating in high-value auctions
- Deposit and withdrawal flows with transaction history

### 🛡️ Security & Compliance
- **BWC Core Encryption** — secure session management and identity verification
- **KYC-Ready Protocol** — architecture supports global liquidity pool and identity verification integrations
- **Admin Surveillance Floor** — dedicated admin panel for asset management, user auditing, and auction lifecycle control
- **Verified Circuit** — participation protocols enforce eligibility before a user can place bids

### 🤖 AI Integration
- **Google Gemini SDK** integrated on the backend for AI-assisted features (e.g., asset description generation, valuation hints)

---

## ⚙️ Setup Instructions

### Prerequisites

- **Node.js** `^20.19.0` or `>=22.12.0`
- **npm** `>=9`
- A **Firebase project** with Firestore enabled and a Web App registered
- A **Firebase Service Account** (JSON key) for the Admin SDK

---

### 1. Clone the Repository

```bash
git clone https://github.com/Harsh127-pixel/bidwars-auction-platform.git
cd bidwars-auction-platform
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `/backend` directory:

```env
PORT=5000
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
ADMIN_EMAIL=admin@bidwars.elite
GEMINI_API_KEY=your-google-gemini-api-key
```

> ⚠️ The `FIREBASE_PRIVATE_KEY` must be wrapped in double quotes and have literal `\n` newlines preserved exactly as they appear in the downloaded service account JSON.

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file inside the `/frontend` directory:

```env
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_ADMIN_EMAIL=admin@bidwars.elite
```

> All `VITE_FIREBASE_*` values are found in your Firebase project's **Project Settings → Your Apps → SDK setup and configuration**.

---

## 🚦 Running the Platform

### Development Mode

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
The API server starts at `http://localhost:5000`.

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
The Vue dev server starts at `http://localhost:5173` (or the next available port).

### Production Build

```bash
# Build the frontend
cd frontend
npm run build

# Start the backend in production
cd ../backend
npm start
```

---

## 📂 Project Structure

```
bidwars-auction-platform/
├── backend/
│   ├── config/          # Firebase Admin & server config
│   ├── routes/          # REST API routes (auctions, bids, wallet, users)
│   ├── sockets/         # Socket.IO real-time bidding logic
│   └── server.js        # Express app entry point
│
├── frontend/
│   └── src/
│       ├── pages/       # Route-level views (Admin, Dashboard, Login, Wallet, Marketplace)
│       ├── components/  # Reusable Material Design 3 components
│       ├── store/       # Pinia stores (auth, auction, wallet)
│       └── services/    # Axios API client & Socket.IO service
│
├── docs/                # Additional documentation & assets
├── render.yaml          # Render.com deployment configuration
├── .gitignore
├── README.md
└── SETUP.md
```

---

## ⚠️ Known Limitations

| Area | Limitation |
|---|---|
| **KYC / Identity Verification** | The KYC-ready architecture is present but full third-party identity verification (e.g., Stripe Identity, Onfido) is not yet integrated. Users are not currently verified against government IDs. |
| **Payment Gateway** | No real-money payment processor is integrated. The wallet system uses platform credits only; actual fiat on-ramp/off-ramp (e.g., Razorpay, Stripe) is not wired up. |
| **Email Notifications** | Transactional emails (outbid alerts, auction win confirmations) are not implemented. Notifications are in-app only via toast messages. |
| **Image / File Uploads** | Asset image management relies on externally hosted URLs. A dedicated file upload system (e.g., Firebase Storage) is not fully integrated in the current version. |
| **AI Features (Gemini)** | The Gemini SDK is integrated on the backend but AI-powered features may be limited to specific endpoints; not all listing flows have AI assistance enabled. |
| **Scalability** | Socket.IO runs on a single Node.js process. For high-concurrency auctions with many simultaneous bidders, a Redis adapter would be required to scale horizontally. |
| **Mobile App** | The platform is a responsive web app only; no native iOS or Android app exists. |
| **Auction Types** | Currently supports standard timed auctions. Dutch auctions, sealed-bid, and reserve-price auctions are not implemented. |
| **Test Coverage** | No automated unit or integration tests are included in the repository at this time. |

---

## 📜 License

This project is currently unlicensed. Contact the repository owner for usage permissions.

---

*Built with ❤️ by [Harsh127-pixel](https://github.com/Harsh127-pixel)*,[gj2908](https://github.com/gj2908)*,[Jahnvitivari12](https://github.com/Jahnvitivari12)*
