# 🔐 Identity & Access Governance (Authentication)

The **BidWars** authentication protocol ensures a secure, institutional-grade onboarding experience using Firebase-backed identity verification.

---

## 🚀 Enrollment Protocol (Register)
The registration portal is designed for high-fidelity identity creation.

### How it Works:
1.  **Professional Pseudonym Management**: Participants define a unique username used across the bidding floor.
2.  **Validation Circuit**: Real-time checks for unique identity collisions (email/username).
3.  **Institutional Logic**: 
    - **UI**: A dual-pane architecture where the visual strategy (left) balances the command form (right).
    - **Compliance**: Participants must acknowledge **BWC Compliance Standards** before enrollment.
4.  **Backend Dispatch**: The `handleRegister` function uses `authStore.register` to initialize the Firebase account and create a corresponding user record in Firestore.

---

## 🏛️ Identity Session (Login)
The login gateway provides a symmetrical entry point to the marketplace.

### How it Works:
1.  **Absolute Viewport Symmetry**: Re-centered using rigid `v-row` architecture to focus participant attention immediately on credentials.
2.  **Cryptographic Clarity**: Fields for **Digital Mail Identity** and **Passkey Protocol** use institutional-grade labels.
3.  **Session Persistence Mode**: An optional "Persistence Mode" allows the credential state to remain active across browser sessions.
4.  **Authorization Denial**: High-priority toast notifications alert the participant if credentials don't match the circuit.

---

## ⚙️ Technical Blueprint
- **Store**: `frontend/src/store/auth.js` (Pinia)
- **Service**: Firebase Authentication & Firestore Users Collection
- **Route Guard**: `frontend/src/router/index.js` (ensures protected routes require a verified session).
