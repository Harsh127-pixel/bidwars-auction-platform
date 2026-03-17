// FILE: frontend/src/pages/Privacy.vue
<template>
  <div class="static-page">
    <div class="page-wrap static-content fade-up">
      <h1 class="t-display t-title mb-6">Privacy Policy</h1>
      <div class="card pa-8 content-body">
        <p>Your privacy is paramount at BidWars.</p>
        <h2>1. Data Collection</h2>
        <p>We collect your name, email, and phone number for account management. KYC documents are stored securely and encrypted for verified auctions.</p>
        <h2>2. Use of Information</h2>
        <p>Your information is used to facilitate bidding, prevent fraud, and handle shipping logistics for won items.</p>
        <h2>3. Third Parties</h2>
        <p>We do not sell your data. We share only necessary details with payment processors (Razorpay/Cloudinary) and shipping partners to complete your orders.</p>
        <h2>4. Security</h2>
        <p>All data is transmitted via HTTPS and stored using modern encryption standards provided by Firebase Google Cloud.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.static-page { min-height: 100vh; background: var(--bg); padding: 80px 0; }
.static-content { max-width: 800px; }
.content-body h2 { margin-top: 32px; margin-bottom: 12px; font-family: var(--font-display); }
.content-body p { margin-bottom: 16px; color: var(--text-2); line-height: 1.8; }
.mb-6 { margin-bottom: 24px; }
.pa-8 { padding: 32px; }
</style>
