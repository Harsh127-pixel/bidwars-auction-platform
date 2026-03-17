# ⚙️ BidWars — Setup Guide

This document covers everything you need to get BidWars running locally, configure Firebase, and deploy to production on Render.

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Firebase Project Configuration](#2-firebase-project-configuration)
3. [Clone & Install Dependencies](#3-clone--install-dependencies)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Running Locally](#5-running-locally)
6. [Firebase Security Rules](#6-firebase-security-rules)
7. [Deploying to Render](#7-deploying-to-render)
8. [Verifying the Deployment](#8-verifying-the-deployment)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. System Requirements

| Requirement | Version |
|---|---|
| Node.js | `^20.19.0` or `>=22.12.0` |
| npm | `>=9.0.0` |
| Git | Any recent version |
| Firebase Account | Free Spark plan or above |
| Google Cloud Account | For Gemini API key |

> **Tip:** Use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions:
> ```bash
> nvm install 20
> nvm use 20
> ```

---

## 2. Firebase Project Configuration

BidWars uses Firebase for its database (Firestore) and authentication. You need **two** things from Firebase: a **Web App config** (for the frontend) and a **Service Account key** (for the backend).

### Step 1 — Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g., `bidwars-prod`) → continue
3. Disable Google Analytics if not needed → click **Create project**

### Step 2 — Enable Authentication

1. In the Firebase console sidebar, go to **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in method**, enable **Email/Password**

### Step 3 — Create a Firestore Database

1. Go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (you will add rules in [Section 6](#6-firebase-security-rules))
4. Select a region close to your users (e.g., `asia-south1` for India) → **Enable**

### Step 4 — Register a Web App (for Frontend)

1. In **Project Overview**, click the **`</>`** (Web) icon
2. Enter an app nickname (e.g., `bidwars-frontend`) → **Register app**
3. Copy the `firebaseConfig` object — you will need these values for the frontend `.env`

### Step 5 — Generate a Service Account Key (for Backend)

1. Go to **Project Settings** (gear icon) → **Service accounts**
2. Click **Generate new private key** → **Generate key**
3. A `.json` file is downloaded — **keep this file secure and never commit it to Git**
4. Open the file and note the values for `project_id`, `client_email`, and `private_key`

### Step 6 — Get a Gemini API Key

1. Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API key** → copy the key
3. This goes into the backend `.env` as `GEMINI_API_KEY`

---

## 3. Clone & Install Dependencies

```bash
# Clone the repo
git clone https://github.com/Harsh127-pixel/bidwars-auction-platform.git
cd bidwars-auction-platform

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 4. Environment Variables Reference

### Backend — `/backend/.env`

Create a file at `backend/.env` with the following keys:

```env
# Server
PORT=5000

# Firebase Admin SDK (from the downloaded Service Account JSON)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_LONG_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Admin Configuration
ADMIN_EMAIL=admin@bidwars.elite

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

> ⚠️ **Critical:** The `FIREBASE_PRIVATE_KEY` must be:
> - Wrapped in **double quotes** `"..."`
> - Contain literal `\n` characters (not real newlines) exactly as they appear in the JSON file
> - If you open the JSON and copy the `private_key` field value, it should already be in the correct format

### Frontend — `/frontend/.env`

Create a file at `frontend/.env` with the following keys:

```env
# Firebase Web SDK (from the firebaseConfig object in Firebase console)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456

# Admin email — must match the backend ADMIN_EMAIL
VITE_ADMIN_EMAIL=admin@bidwars.elite
```

> All `VITE_` prefixed variables are automatically exposed to the Vue app by Vite. Never prefix a secret variable with `VITE_`.

---

## 5. Running Locally

Open **two terminal windows** from the repo root.

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

Expected output:
```
✅ Firebase Admin initialized
🚀 BidWars server running on port 5000
🔌 Socket.IO ready
```

The REST API is now available at `http://localhost:5000`.

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Open `http://localhost:5173` in your browser.

### Creating the First Admin Account

1. Register a new account using the email that matches `ADMIN_EMAIL` / `VITE_ADMIN_EMAIL` (default: `admin@bidwars.elite`)
2. This account automatically receives admin privileges in the app
3. Log in and navigate to the **Admin Floor** to begin managing auctions and users

---

## 6. Firebase Security Rules

Paste these rules into **Firestore Database → Rules** in the Firebase console to lock down access appropriately.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Auctions are publicly readable; only the backend (admin SDK) can write
    match /auctions/{auctionId} {
      allow read: if true;
      allow write: if false; // Writes handled server-side via Admin SDK
    }

    // Bids: authenticated users can read; only server can write
    match /bids/{bidId} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    // Wallet: users can only read their own wallet
    match /wallets/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }
  }
}
```

> These are recommended baseline rules. Adjust according to your specific access requirements.

---

## 7. Deploying to Render

The repository includes a `render.yaml` file for one-click deployment on [Render](https://render.com).

### Option A — Automatic via `render.yaml`

1. Push your forked repo to GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint**
3. Connect your GitHub account and select the `bidwars-auction-platform` repo
4. Render will detect `render.yaml` and configure services automatically
5. Add all environment variables from [Section 4](#4-environment-variables-reference) in the Render dashboard under each service's **Environment** tab
6. Click **Apply** — Render will build and deploy both services

### Option B — Manual Deployment

**Backend (Web Service):**

| Setting | Value |
|---|---|
| Environment | `Node` |
| Build Command | `cd backend && npm install` |
| Start Command | `cd backend && npm start` |
| Root Directory | *(leave blank)* |

Add all backend environment variables in the Render dashboard.

**Frontend (Static Site):**

| Setting | Value |
|---|---|
| Environment | `Static Site` |
| Build Command | `cd frontend && npm install && npm run build` |
| Publish Directory | `frontend/dist` |

Add all `VITE_*` frontend environment variables in the Render dashboard.

> **Important:** After deploying the backend, copy its Render service URL (e.g., `https://bidwars-api.onrender.com`) and set it as the API base URL in your frontend environment or Axios config before building.

---

## 8. Verifying the Deployment

After deployment, confirm the following:

- [ ] Frontend loads at your Render static site URL
- [ ] Login / Register flows complete without errors
- [ ] Marketplace page loads and displays auctions (if any exist)
- [ ] Admin account can access the Admin Floor
- [ ] Placing a bid updates in real time for another browser session (Socket.IO check)
- [ ] Wallet credits display correctly on the Dashboard

---

## 9. Troubleshooting

### `FIREBASE_PRIVATE_KEY` errors on backend start

The private key format is the most common issue. Try this in your `.env`:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

If the error persists, add this to your backend config file to force newline parsing:

```js
privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
```

---

### Frontend shows blank page after build

- Confirm all `VITE_FIREBASE_*` variables are set correctly
- Run `npm run build` locally and check the terminal for errors
- Ensure `VITE_FIREBASE_PROJECT_ID` matches exactly what is in the Firebase console

---

### Socket.IO not connecting

- Verify the backend `PORT` is correct and not blocked by a firewall
- In production, ensure the frontend Socket.IO client URL points to the deployed backend URL, not `localhost`
- On Render's free tier, the backend service may spin down after inactivity — the first connection will be slow (cold start)

---

### `npm install` fails on Node version mismatch

```bash
node -v   # Must be ^20.19.0 or >=22.12.0
nvm use 20
npm install
```

---

### Admin Floor is not accessible

- Confirm the account email exactly matches `ADMIN_EMAIL` (backend) and `VITE_ADMIN_EMAIL` (frontend) — including case
- Log out and log back in after updating the `.env` files
- Check the browser console for any auth errors

---

*For additional help, open an issue at [github.com/Harsh127-pixel/bidwars-auction-platform/issues](https://github.com/Harsh127-pixel/bidwars-auction-platform/issues)*
