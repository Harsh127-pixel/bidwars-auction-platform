const nodemailer = require('nodemailer');

/**
 * EMAIL SERVICE
 * Handles system notifications, invoices, order confirmations, shipping, and delivery emails.
 * Uses Gmail SMTP with App Passwords for reliable delivery.
 * 
 * Required .env variables:
 *   EMAIL_USER=your-email@gmail.com
 *   EMAIL_PASS=your-16-char-app-password
 *   EMAIL_FROM_NAME=BidWars (optional, defaults to 'BidWars')
 */
class EmailService {
  constructor() {
    // Use Gmail SMTP with App Password (enable 2FA + generate app password in Google)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // App Password (not regular password)
      }
    });

    this.fromName = process.env.EMAIL_FROM_NAME || 'BidWars';
    this.fromEmail = process.env.EMAIL_USER || 'no-reply@bidwars.platform';

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('[EMAIL SERVICE] Missing EMAIL_USER / EMAIL_PASS in .env. Emails will be logged to console only.');
      this.isMock = true;
    } else {
      // Verify connection on startup
      this.transporter.verify()
        .then(() => console.log('[EMAIL SERVICE] ✓ SMTP connection verified'))
        .catch(err => {
          console.error('[EMAIL SERVICE] ✗ SMTP connection failed:', err.message);
          console.warn('[EMAIL SERVICE] Falling back to mock mode. Check EMAIL_USER and EMAIL_PASS.');
          this.isMock = true;
        });
    }
  }

  /** Base HTML wrapper for all emails */
  _htmlWrapper(title, bodyContent) {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#f4f4f4; font-family:'Segoe UI',Roboto,Arial,sans-serif; }
  .container { max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; }
  .header { background:#0d0d0d; padding:32px 40px; text-align:center; }
  .header h1 { color:#FBBF24; font-size:28px; margin:0; font-weight:700; letter-spacing:1px; }
  .header p { color:#888; font-size:13px; margin-top:6px; }
  .body { padding:40px; }
  .body h2 { color:#1a1a1a; font-size:22px; font-weight:700; margin:0 0 8px; }
  .body p { color:#444; font-size:15px; line-height:1.6; margin:8px 0; }
  .detail-box { background:#f9f9f9; border:1px solid #e5e5e5; border-radius:8px; padding:20px; margin:20px 0; }
  .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee; font-size:14px; }
  .detail-row:last-child { border-bottom:none; }
  .detail-label { color:#888; }
  .detail-value { color:#1a1a1a; font-weight:600; }
  .btn { display:inline-block; padding:14px 32px; background:#FBBF24; color:#000; text-decoration:none; border-radius:8px; font-weight:700; font-size:15px; margin:16px 0; }
  .footer { background:#f4f4f4; padding:24px 40px; text-align:center; font-size:12px; color:#999; }
  .amount { font-size:28px; font-weight:800; color:#FBBF24; }
</style></head><body>
<div class="container">
  <div class="header">
    <h1>⚑ BidWars</h1>
    <p>${title}</p>
  </div>
  <div class="body">${bodyContent}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} BidWars Auction Platform. All rights reserved.</p>
    <p>This is an automated email. Please do not reply.</p>
  </div>
</div></body></html>`;
  }

  /** Send any email (internal helper) */
  async _send(to, subject, html, attachments = []) {
    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to,
      subject,
      html,
      attachments
    };

    if (this.isMock) {
      console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return true;
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Sent to ${to} | MessageId: ${info.messageId}`);
      return true;
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send to ${to}:`, err.message);
      return false;
    }
  }

  // ─── CERTIFICATE OF AUTHENTICITY ───────────────────────────────────────────
  async sendCertificate(to, auctionTitle, pdfBuffer) {
    const html = this._htmlWrapper('Certificate of Authenticity', `
      <h2>🎉 Congratulations!</h2>
      <p>Your payment for <strong>"${auctionTitle}"</strong> has been verified and ownership has been transferred to you.</p>
      <p>Attached is your official <strong>Certificate of Authenticity</strong> — keep it safe for your records.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Item</span><span class="detail-value">${auctionTitle}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value" style="color:#22C55E">✓ Ownership Transferred</span></div>
        <div class="detail-row"><span class="detail-label">Certificate</span><span class="detail-value">See attachment</span></div>
      </div>
    `);

    return this._send(to, `📜 Certificate of Authenticity: ${auctionTitle}`, html, [{
      filename: `Certificate_${auctionTitle.replace(/\s+/g, '_')}.pdf`,
      content: pdfBuffer
    }]);
  }

  // ─── TAX INVOICE ───────────────────────────────────────────────────────────
  async sendInvoice(to, description, amount, pdfBuffer) {
    const html = this._htmlWrapper('Tax Invoice', `
      <h2>Tax Invoice</h2>
      <p>Your transaction has been processed successfully.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Description</span><span class="detail-value">${description}</span></div>
        <div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value amount">₹${Number(amount).toLocaleString('en-IN')}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span></div>
        <div class="detail-row"><span class="detail-label">Invoice</span><span class="detail-value">See attachment</span></div>
      </div>
      <p style="font-size:13px;color:#888">Please find the attached tax invoice for your records.</p>
    `);

    return this._send(to, `🧾 Tax Invoice: ${description}`, html, [{
      filename: `Invoice_${description.replace(/\s+/g, '_')}.pdf`,
      content: pdfBuffer
    }]);
  }

  // ─── ORDER CONFIRMATION ────────────────────────────────────────────────────
  async sendOrderConfirmation(to, { orderId, auctionTitle, amount, username }) {
    const html = this._htmlWrapper('Order Confirmation', `
      <h2>Order Confirmed! 🎯</h2>
      <p>Hi <strong>${username || 'Bidder'}</strong>,</p>
      <p>Your winning bid has been confirmed. Here are your order details:</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Order ID</span><span class="detail-value">${orderId}</span></div>
        <div class="detail-row"><span class="detail-label">Item</span><span class="detail-value">${auctionTitle}</span></div>
        <div class="detail-row"><span class="detail-label">Amount Paid</span><span class="detail-value amount">₹${Number(amount).toLocaleString('en-IN')}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value" style="color:#3B82F6">Processing</span></div>
      </div>
      <p>Our team is now preparing your item for shipment. You'll receive tracking details once it ships.</p>
    `);

    return this._send(to, `✅ Order Confirmed: ${auctionTitle} [${orderId}]`, html);
  }

  // ─── ORDER SHIPPED ─────────────────────────────────────────────────────────
  async sendShippedNotification(to, { orderId, auctionTitle, courierService, trackingUrl, username }) {
    const trackingLink = trackingUrl
      ? `<a href="${trackingUrl}" class="btn" style="margin-top:16px">Track Your Shipment →</a>`
      : '<p style="color:#888;font-size:13px">Tracking link will be updated shortly.</p>';

    const html = this._htmlWrapper('Item Shipped', `
      <h2>Your item is on its way! 🚚</h2>
      <p>Hi <strong>${username || 'Bidder'}</strong>,</p>
      <p>Great news — your order has been shipped!</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Order ID</span><span class="detail-value">${orderId}</span></div>
        <div class="detail-row"><span class="detail-label">Item</span><span class="detail-value">${auctionTitle}</span></div>
        <div class="detail-row"><span class="detail-label">Courier</span><span class="detail-value">${courierService || 'Standard Shipping'}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value" style="color:#F59E0B">In Transit</span></div>
      </div>
      ${trackingLink}
      <p style="margin-top:16px;font-size:13px;color:#888">Once you receive the item, please confirm delivery on your dashboard to release the escrow.</p>
    `);

    return this._send(to, `📦 Shipped: ${auctionTitle} [${orderId}]`, html);
  }

  // ─── ORDER DELIVERED ───────────────────────────────────────────────────────
  async sendDeliveredConfirmation(to, { orderId, auctionTitle, amount, username }) {
    const html = this._htmlWrapper('Delivery Confirmed', `
      <h2>Delivery Confirmed! ✅</h2>
      <p>Hi <strong>${username || 'Bidder'}</strong>,</p>
      <p>Your item has been marked as delivered. The escrow for this transaction has been released.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Order ID</span><span class="detail-value">${orderId}</span></div>
        <div class="detail-row"><span class="detail-label">Item</span><span class="detail-value">${auctionTitle}</span></div>
        <div class="detail-row"><span class="detail-label">Settlement</span><span class="detail-value amount">₹${Number(amount).toLocaleString('en-IN')}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value" style="color:#22C55E">✓ Completed</span></div>
      </div>
      <p>Thank you for choosing BidWars. Your Certificate of Authenticity is available on your dashboard.</p>
    `);

    return this._send(to, `🎉 Delivered: ${auctionTitle} [${orderId}]`, html);
  }

  // ─── GENERIC EMAIL ─────────────────────────────────────────────────────────
  async sendMail(options) {
    if (options.html) {
      return this._send(options.to, options.subject, options.html, options.attachments);
    }
    // Plain text fallback
    const html = this._htmlWrapper(options.subject, `<p>${options.text || options.subject}</p>`);
    return this._send(options.to, options.subject, html, options.attachments);
  }
}

module.exports = new EmailService();
