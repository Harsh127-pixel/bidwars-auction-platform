const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');

/**
 * Generates a Certificate of Authenticity for an auction winner
 * @param {Object} auctionData - The auction details
 * @param {Object} userData - The winner's user details
 * @returns {Promise<Buffer>} - The PDF buffer
 */
exports.generateCertificate = (auctionData, userData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, left: 50, right: 50, bottom: 50 }
      });

      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Background / Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(2)
         .strokeColor('#1a237e')
         .stroke();

      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
         .lineWidth(0.5)
         .strokeColor('#1a237e')
         .stroke();

      // Header
      doc.fillColor('#1a237e')
         .font('Helvetica-Bold')
         .fontSize(40)
         .text('CERTIFICATE OF AUTHENTICITY', 0, 80, { align: 'center' });

      doc.fillColor('#444444')
         .font('Helvetica')
         .fontSize(14)
         .text('This document serves as proof of valid transaction and transfer of ownership for the following asset.', 0, 140, { align: 'center' });

      // Asset Details Section
      doc.moveTo(100, 180).lineTo(doc.page.width - 100, 180).stroke('#eeeeee');

      doc.fontSize(12).fillColor('#888888').text('ASSET DESCRIPTION', 100, 210);
      doc.fontSize(22).fillColor('#1a237e').font('Helvetica-Bold').text(auctionData.title.toUpperCase(), 100, 230);
      
      doc.fontSize(12).fillColor('#888888').text('WINNING BIDDER', 100, 280);
      doc.fontSize(18).fillColor('#333333').font('Helvetica').text(userData.username || userData.email, 100, 300);

      doc.fontSize(12).fillColor('#888888').text('FINAL SETTLEMENT', doc.page.width / 2 + 50, 280);
      doc.fontSize(18).fillColor('#2e7d32').font('Helvetica-Bold').text(`₹ ${auctionData.highestBid.toLocaleString()}`, doc.page.width / 2 + 50, 300);

      // Footer Meta
      doc.moveTo(100, 360).lineTo(doc.page.width - 100, 360).stroke('#eeeeee');

      const certId = `CERT-${auctionData.id.slice(0,8).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
      
      doc.fontSize(10).fillColor('#888888').text('LEDGER VERIFICATION ID', 100, 380);
      doc.fontSize(10).fillColor('#333333').text(certId, 100, 395);

      doc.fontSize(10).fillColor('#888888').text('TIMESTAMP', doc.page.width / 2 - 50, 380);
      doc.fontSize(10).fillColor('#333333').text(new Date(auctionData.endTime).toUTCString(), doc.page.width / 2 - 50, 395);

      doc.fontSize(10).fillColor('#888888').text('ISSUED BY', doc.page.width - 250, 380);
      doc.fontSize(10).fillColor('#1a237e').font('Helvetica-Bold').text('BIDWARS GLOBAL ARBITRATION UNIT', doc.page.width - 250, 395);

      // Watermark Text
      doc.fillColor('#eeeeee')
         .fontSize(60)
         .opacity(0.1)
         .save()
         .rotate(45, { origin: [doc.page.width / 2, doc.page.height / 2] })
         .text('SECURE BIDWARS LEDGER', 0, doc.page.height / 2, { align: 'center' })
         .restore();

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates an Invoice for a transaction (Wallet Topup or Auction Win)
 */
exports.generateInvoice = (data, userData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 50, left: 50, right: 50, bottom: 50 } });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fillColor('#1a237e').font('Helvetica-Bold').fontSize(24).text('TAX INVOICE', { align: 'right' });
      doc.moveDown();

      // Company Info
      doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold').text('BIDWARS AUCTION PLATFORM');
      doc.font('Helvetica').text('123 Arbitration Square, Digital City');
      doc.text('GSTIN: 22AAAAA0000A1Z5');
      doc.moveDown();

      // Horizontal Line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#eeeeee');
      doc.moveDown();

      // Bill To
      const startY = doc.y;
      doc.fillColor('#888888').fontSize(9).text('BILL TO:');
      doc.fillColor('#333333').fontSize(11).font('Helvetica-Bold').text(userData.username || 'User');
      doc.font('Helvetica').fontSize(10).text(userData.email);
      doc.text(userData.phone || 'No phone provided');
      if (userData.address) doc.text(userData.address);

      // Invoice Details
      doc.y = startY;
      doc.fillColor('#888888').fontSize(9).text('INVOICE NO:', { align: 'right' });
      doc.fillColor('#333333').fontSize(10).text(data.invoiceId || uuidv4().slice(0, 8).toUpperCase(), { align: 'right' });
      doc.fillColor('#888888').fontSize(9).text('DATE:', { align: 'right' });
      doc.fillColor('#333333').fontSize(10).text(new Date().toLocaleDateString(), { align: 'right' });
      doc.moveDown(2);

      // Table Header
      const tableY = doc.y;
      doc.rect(50, tableY, 500, 20).fill('#f9f9f9');
      doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 60, tableY + 6);
      doc.text('Amount', 450, tableY + 6, { align: 'right', width: 90 });

      // Table Row
      doc.font('Helvetica').fontSize(10);
      doc.text(data.description || 'Auction Winning Settlement', 60, tableY + 30);
      doc.text(`₹ ${Number(data.amount).toLocaleString()}`, 450, tableY + 30, { align: 'right', width: 90 });

      // totals
      doc.moveDown(4);
      doc.moveTo(350, doc.y).lineTo(550, doc.y).stroke('#eeeeee');
      doc.moveDown(0.5);
      
      doc.font('Helvetica-Bold').text('TOTAL AMOUNT:', 350, doc.y);
      doc.text(`₹ ${Number(data.amount).toLocaleString()}`, 450, doc.y, { align: 'right', width: 90 });

      // Footer
      doc.fontSize(8).fillColor('#888888').text('This is a computer generated invoice and does not require a signature.', 50, 750, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
