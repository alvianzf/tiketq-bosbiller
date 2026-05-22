const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function formatCurrency(amount) {
  // Format to standard Indonesian numbering (e.g., 988.800)
  return parseInt(amount).toLocaleString('id-ID').replace(/,/g, '.');
}

async function generateInvoicePDF(bookingData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const primaryColor = '#f97316'; // TiketQ Orange
      const darkColor = '#000000';
      const textColor = '#000000';
      const mutedColor = '#666666';
      const bgGray = '#f1f5f9';
      const tableBorder = '#d1d5db';

      // ==========================================
      // TOP BANNER (TiketQ Logo)
      // ==========================================
      // Draw an orange polygon at the top right similar to the reference
      doc.polygon(
        [doc.page.width - 250, 0],
        [doc.page.width, 0],
        [doc.page.width, 60],
        [doc.page.width - 230, 60]
      );
      doc.fill(primaryColor);
      
      doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
         .text('TiketQ', doc.page.width - 150, 20);

      // ==========================================
      // HEADER: RECEIPT
      // ==========================================
      const headerY = 40;
      doc.rect(40, headerY, 4, 35).fill(primaryColor);
      doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold').text('RECEIPT', 55, headerY);
      const bookingNo = bookingData.bookingNo || bookingData.bookingCode || 'SF-987654';

      doc.fillColor(darkColor).fontSize(9).font('Helvetica')
         .text(`Number : #${bookingData.id}`, 55, headerY + 15)
         .text(`Date : ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 55, headerY + 25);


      // ==========================================
      // HELPER FUNCTION FOR GRAY BARS
      // ==========================================
      function drawSectionHeader(title, y, isHalf = false, x = 40) {
        const width = isHalf ? (doc.page.width - 90) / 2 : doc.page.width - 80;
        doc.rect(x, y, width, 20).fill(bgGray);
        doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold').text(title, x + 10, y + 6);
      }

      // ==========================================
      // PAYMENT DETAILS
      // ==========================================
      let currentY = 110;
      drawSectionHeader('PAYMENT DETAILS', currentY);
      
      currentY += 30;
      doc.fillColor(darkColor).fontSize(9).font('Helvetica');
      doc.text(`P.O. NUMBER: ${bookingNo}`, 50, currentY);
      doc.text(`METHOD: Online Payment`, 250, currentY);
      doc.text(`STATUS: Paid`, 450, currentY);

      // ==========================================
      // CUSTOMER DETAILS
      // ==========================================
      currentY += 30;
      drawSectionHeader('CUSTOMER DETAILS', currentY);

      currentY += 30;
      const col1X = 50;
      const col1LabelW = 80;
      const col1ValueX = col1X + col1LabelW;

      // Extract details
      const passengersList = bookingData.passengers && bookingData.passengers.length > 0 
        ? bookingData.passengers 
        : [{ title: '', firstName: 'VALUED', lastName: 'CUSTOMER' }];

      const customerName = bookingData.name || `${passengersList[0].firstName || ''} ${passengersList[0].lastName || ''}`.trim() || 'Valued Customer';

      doc.font('Helvetica');
      // Customer
      doc.text('Name', col1X, currentY).text(`: ${customerName}`, col1ValueX, currentY);
      doc.text('Email', col1X, currentY + 12).text(`: ${bookingData.email || 'customer@tiketq.com'}`, col1ValueX, currentY + 12);

      // ==========================================
      // PASSENGER DETAILS
      // ==========================================
      currentY += 70;
      drawSectionHeader('PASSENGER DETAILS', currentY);
      
      currentY += 30;
      doc.font('Helvetica-Bold').fontSize(9);
      
      const passengerNames = passengersList.map(p => `${(p.title || '').toUpperCase()} ${(p.firstName || p.first_name || '').toUpperCase()} ${(p.lastName || p.last_name || '').toUpperCase()} (Adult)`).join(' | ');
      
      doc.text(passengerNames, 50, currentY, { width: doc.page.width - 100 });

      // ==========================================
      // PURCHASE DETAILS
      // ==========================================
      currentY += 40;
      drawSectionHeader('PURCHASE DETAILS', currentY);
      
      currentY += 20;
      
      // Table Structure
      const tableW = doc.page.width - 80;
      
      const c1 = 40;   // No
      const c2 = 70;   // Type
      const c3 = 180;  // Desc
      const c4 = 380;  // Qty
      const c5 = 410;  // Price
      const c6 = 480;  // Total
      
      function drawTableRow(y, h, isHeader = false) {
        doc.rect(40, y, tableW, h).stroke(tableBorder);
        // Vertical lines
        doc.moveTo(c2, y).lineTo(c2, y + h).stroke(tableBorder);
        doc.moveTo(c3, y).lineTo(c3, y + h).stroke(tableBorder);
        doc.moveTo(c4, y).lineTo(c4, y + h).stroke(tableBorder);
        doc.moveTo(c5, y).lineTo(c5, y + h).stroke(tableBorder);
        doc.moveTo(c6, y).lineTo(c6, y + h).stroke(tableBorder);
      }

      // Header Row
      drawTableRow(currentY, 30, true);
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('No', c1 + 5, currentY + 10);
      doc.text('Type of Item', c2 + 5, currentY + 10);
      doc.text('Item Description', c3 + 5, currentY + 10);
      doc.text('Qty', c4 + 5, currentY + 10);
      doc.text('Price per unit Rp', c5 + 5, currentY + 10);
      doc.text('Total Rp', c6 + 5, currentY + 10);

      currentY += 30;

      // Calculate Math
      const totalAmount = parseInt(bookingData.nominal);
      const passCount = passengersList.length;
      const baseFare = Math.round(totalAmount / 1.11);
      const taxAmount = totalAmount - baseFare;
      const unitPrice = Math.round(baseFare / passCount);

      // Determine flight vs ferry
      const isFerry = bookingData.bookingNo || bookingData.serviceType === "FERRY" || (bookingData.origin && typeof bookingData.origin === 'object');
      const itemType = isFerry ? 'Ferry Ticket' : 'Flight Ticket';
      
      let originStr = "";
      if (bookingData.origin) {
        originStr = typeof bookingData.origin === 'object' ? (bookingData.origin.name || bookingData.origin.code) : bookingData.origin;
      }
      let destStr = "";
      if (bookingData.destination) {
        destStr = typeof bookingData.destination === 'object' ? (bookingData.destination.name || bookingData.destination.code) : bookingData.destination;
      }
      
      const itemDesc = isFerry 
        ? `Ferry (Adult) ${originStr} - ${destStr} | ${new Date(bookingData.departureDate).toLocaleDateString('en-GB')}`
        : `Flight (Adult) ${bookingData.origin} - ${bookingData.destination} | ${new Date(bookingData.departureDate).toLocaleDateString('en-GB')}`;

      // Row 1: Ticket
      drawTableRow(currentY, 40);
      doc.font('Helvetica').fontSize(9);
      doc.text('1', c1 + 5, currentY + 10);
      doc.font('Helvetica-Bold').text(itemType, c2 + 5, currentY + 10);
      
      doc.font('Helvetica');
      doc.text(itemDesc, c3 + 5, currentY + 10, { width: 190 });
      
      doc.text(passCount.toString(), c4 + 5, currentY + 10, { width: 20, align: 'right' });
      doc.text(formatCurrency(unitPrice), c5 + 5, currentY + 10, { width: 60, align: 'right' });
      doc.text(formatCurrency(baseFare), c6 + 5, currentY + 10, { width: doc.page.width - c6 - 45 - 5, align: 'right' });
      
      currentY += 40;

      // Summary Table at bottom right
      const summaryW = doc.page.width - c5 - 40;
      const rowH = 20;
      
      function drawSummaryRow(label, value, y, bold = false) {
        doc.rect(c5, y, c6 - c5, rowH).stroke(tableBorder);
        doc.rect(c6, y, doc.page.width - c6 - 40, rowH).stroke(tableBorder);
        
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
        doc.text(label, c5 + 5, y + 6);
        doc.text(value, c6 + 5, y + 6, { width: doc.page.width - c6 - 45 - 5, align: 'right' });
      }

      drawSummaryRow('TOTAL', formatCurrency(baseFare), currentY);
      currentY += rowH;
      drawSummaryRow('SERVICE FEE *', formatCurrency(taxAmount), currentY);
      currentY += rowH;
      drawSummaryRow('Paid with Online', formatCurrency(totalAmount), currentY);
      currentY += rowH;
      drawSummaryRow('PAYMENT AMOUNT', formatCurrency(totalAmount), currentY, true);

      // Footer Note
      doc.font('Helvetica').fontSize(9).fillColor(darkColor)
         .text('*Includes PPN', 40, doc.page.height - 50);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateInvoicePDF
};
