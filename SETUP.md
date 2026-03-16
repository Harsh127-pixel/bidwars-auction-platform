# ⚙️ BidWars: Platform Initialization Protocol (PIP)

This document provides definitive technical instructions for establishing the **BidWars** institutional bidding floor from scratch.

---

## 🛠️ Requirements & Environment Sovereignty

### Operating Support
- **Node.js**: `^20.19.0` or `>=22.12.0`
- **Package Manager**: [npm](https://www.npmjs.com/) (Standard) or [yarn](https://yarnpkg.com/)

---

## 🏗️ Phase 1: Infrastructure Calibration (Firebase)

BidWars requires a **Firebase Project** for identity verification, wealth ledger storage, and high-stakes asset auditing.

1.  **Project Creation**: 
    - Go to [Firebase Console](https://console.firebase.google.com/).
    - Create a new project titled `bidwars-elite-market`.
2.  **Identity Protocol (Authentication)**:
    - Enable **Email/Password** provider.
3.  **Data Sovereignty (Firestore)**:
    - Initialize **Cloud Firestore** in production mode.
    - Select a global region with absolute low-latency (e.g., `asia-south1`).
4.  **Service Access Manager (Backend Admin SDK)**:
    - Go to **Project Settings** > **Service Accounts**.
    - Click **Generate new private key** for Node.js.
    - Securely store the JSON file; you will need its contents for the backend `.env`.

---

## 🔧 Phase 2: Backend Command Logic (`/backend`)

The backend coordinates the **BWC Core Encryption** and real-time bidding synchronization.

1.  **Dependency Initialization**:
    ```bash
    cd backend
    npm install
    ```
2.  **Environment Calibration**:
    Create `.env` using your Service Account details:
    ```env
    PORT=5000
    FIREBASE_PROJECT_ID=your-project-id
    FIREBASE_CLIENT_EMAIL=your-service-account-email
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourSecretKey\n-----END PRIVATE KEY-----"
    ADMIN_EMAIL=admin@bidwars.elite
    ```
3.  **Surveillance Initialization**:
    Run the command to verify the server heartbeat:
    ```bash
    npm run dev
    ```

---

## 🎨 Phase 3: Frontend Control Floor (`/frontend`)

The frontend implements the **Elite Indigo** visual strategy using MD3 protocols.

1.  **Dependency Initialization**:
    ```bash
    cd frontend
    npm install
    ```
2.  **Environment Calibration**:
    Create `.env` with your Firebase Web Config:
    ```env
    VITE_FIREBASE_API_KEY=AIzaSyA_...
    VITE_FIREBASE_AUTH_DOMAIN=bidwars-elite-market.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=bidwars-elite-market
    VITE_FIREBASE_STORAGE_BUCKET=bidwars-elite-market.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
    VITE_FIREBASE_APP_ID=1:123456789:web:abcdef...
    VITE_ADMIN_EMAIL=admin@bidwars.elite
    ```
3.  **Global UI Synchronization**:
    The platform uses **TailwindCSS 4** and **Vuetify 4 (preview/alpha features)** for high-fidelity aesthetics.
    ```bash
    npm run dev
    ```

---

## 🚦 Phase 4: Verification Protocol

To verify the platform is operational:
1.  Navigate to `http://localhost:5173/register`.
2.  Complete the **Enrollment Request**.
3.  Access the **Executive Admin Floor** via `http://localhost:5173/admin` (using the email defined in `ADMIN_EMAIL`).
4.  Initialize the **Institutional Liquidation** by creating your first auction.

---

## 📜 Maintenance Handshakes
If you update the **Bidding Protocols**, ensure the `socket.io` definitions are synchronized between the backend (`/sockets/bidding.js`) and the frontend (`/services/socket.js`). 
