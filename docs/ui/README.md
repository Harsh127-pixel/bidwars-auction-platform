# 💎 Elite Indigo Design System (UI/UX)

The **BidWars** platform is built on the **Elite Indigo** visual strategy, prioritizing institutional-grade symmetry and Material Design 3 (MD3) protocols.

---

## 🎨 Visual Strategy (MD3)
A premium aesthetic designed for high-value asset environments.

### How it Works:
1.  **Elite Indigo Palette**:
    - **Primary**: Deep Indigos (`#3F51B5`) for command actions and headers.
    - **Surface**: Dark/Glassmorphism-ready colors for cards and background overlays.
    - **Gradients**: Subtle radial gradients used in **HUD-overlays** for depth.
2.  **Typography Policy**:
    - **Institutional Bold**: Uses `font-weight-black` and `italic` headers to define importance.
    - **Symmetric Labels**: Professional-grade labels like "DIGITAL MAIL IDENTITY" for clarity.
3.  **Environmental HUD**:
    - Every page features a `hud-overlay` with low-opacity radial gradients.
    - This provides a "layer of glass" feel, separating the content from the background.
4.  **Premium Shadows**:
    - **Shadow-Premium**: Custom box-shadow logic (`0 40px 80px -12px rgba(0,0,0,0.4)`) to create extreme elevation.

---

## ⚡ Global Motion Protocols
Symmetric transitions to ensure the platform feels "alive" but professional.

### How it Works:
1.  **Animate-Zoom**: Used on entry points (Login, Register, Dashboard) to create a subtle "coming forward" effect.
    - **Mechanic**: `transform: scale(0.98)` to `scale(1)` with an opacity fade.
2.  **Page Transitions**:
    - Uses Vue's `<transition>` component with `out-in` mode.
    - **Direction**: Vertical translateY (16px) for a "rising" content effect.
3.  **Toast-Slide**: Notifications use a horizontal slide (`300ms`) with an anchor point on the bottom-right.
4.  **Scanner Animations**: Used in `AuctionDetail.vue` to indicate real-time bid verification.

---

## ⚙️ Technical Blueprint
- **Main CSS**: `frontend/src/assets/main.css` (Tailwind 4)
- **Framework**: Vuetify 4 (Alpha/Experimental Features)
- **Theme Sync**: `frontend/src/App.vue` (manages dark/light mode toggle).
- **Icons**: Material Design Icons (MDI)
