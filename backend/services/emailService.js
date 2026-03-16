const nodemailer = require('nodemailer');

/**
 * EMAIL SERVICE
 * Handles system notifications and certificate delivery.
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Defaulting to Gmail for ease of use in demo, can be generic SMTP
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // If credentials are missing, we use a mock transporter or log it.
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('[EMAIL SERVICE] Missing credentials in .env. Emails will be logged to console only.');
      this.isMock = true;
    }
  }

  /**
   * Sends the Certificate of Authenticity to the buyer
   * @param {string} to - Buyer's email
   * @param {string} auctionTitle - Title of the item
   * @param {Buffer} pdfBuffer - The COA PDF
   */
  async sendCertificate(to, auctionTitle, pdfBuffer) {
    const mailOptions = {
      from: '"BidWars Arbitration Unit" <no-reply@bidwars.platform>',
      to: to,
      subject: `📜 Certificate of Authenticity: ${auctionTitle}`,
      text: `Congratulations! Your payment for "${auctionTitle}" has been verified and ownership has been transferred to you. Attached is your official Certificate of Authenticity.`,
      attachments: [
        {
          filename: `Certificate_${auctionTitle.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer
        }
      ]
    };

    if (this.isMock) {
      console.log(`[MOCK EMAIL] To: ${to} | Subject: ${mailOptions.subject}`);
      return true;
    }

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Certificate sent to ${to}`);
      return true;
    } catch (err) {
      console.error('[EMAIL ERROR]', err);
      return false;
    }
  }
}

module.exports = new EmailService();
