// FILE: frontend/src/pages/Terms.vue
<template>
  <div class="static-page">
    <div class="page-wrap static-content fade-up">
      <h1 class="t-display t-title mb-6">Terms of Service</h1>
      <div class="card pa-8 content-body">
        <p>Welcome to BidWars. By using our platform, you agree to these terms.</p>
        <h2>1. Participation</h2>
        <p>Users must be 18+ and have a verified account to participate in certain high-value auctions. Deposits may be required to join bidding floors.</p>
        <h2>2. Bidding Rules</h2>
        <p>All bids are binding. Once a bid is placed, it cannot be retracted. Proxy bidding allows the system to bid on your behalf up to your specified maximum.</p>
        <h2>3. Payments & Escrow</h2>
        <p>Winning bidders must settle the balance within 48 hours. Funds are held in escrow until dispatch/receipt confirmation to protect both parties.</p>
        <h2>4. Disputes</h2>
        <p>Disputes must be raised through the transaction details page. BidWars reserve the right to adjudicate all contested transactions based on evidence provided.</p>
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
