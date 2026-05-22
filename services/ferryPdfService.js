const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

async function generateFerryTicketPDF(bookingData) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const primaryColor = '#f97316'; // TiketQ Orange branding!
      const darkColor = '#1e293b';
      const textColor = '#334155';
      const mutedColor = '#64748b';
      const lineGray = '#e2e8f0';

      const logoPngPath = path.join(__dirname, '../assets/brand.png');
      let hasLogo = fs.existsSync(logoPngPath);

      // 1. TOP HEADER
      doc.font('Helvetica-Bold').fontSize(16).fillColor(darkColor).text('E-ticket ', 40, 40, { continued: true })
         .font('Helvetica').fillColor(mutedColor).text('/ E-tiket');
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor).text('Departure Ferry ', 40, 60, { continued: true })
         .font('Helvetica').fillColor(mutedColor).text('/ Perjalanan Feri Pergi');
      
      // Top Right Logo (flex-end)
      if (hasLogo) {
         doc.image(logoPngPath, doc.page.width - 180, 20, { fit: [140, 50], align: 'right' });
      } else {
         doc.font('Helvetica-Bold').fontSize(28).fillColor(primaryColor).text('TiketQ', doc.page.width - 150, 25);
      }
      
      doc.moveTo(40, 90).lineTo(doc.page.width - 40, 90).strokeColor(lineGray).stroke();

      // 2. MIDDLE SECTION (Carrier, Voyage, Timeline, Booking Info)
      let currentY = 110;

      // Left Column: Carrier Details
      doc.font('Helvetica-Bold').fontSize(20).fillColor(primaryColor).text('Sindo Ferry', 40, currentY);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor).text('Sindo Ferry Pte Ltd', 40, currentY + 30);
      doc.font('Helvetica').fontSize(9).fillColor(textColor).text('Vessel: Sindo Express', 40, currentY + 42);
      doc.text('Economy Class', 40, currentY + 54);

      // Middle Column: Timeline
      const timeX = 180;
      const timelineX = 230;
      const textX = 250;

      const departureDate = new Date(bookingData.departureDate);
      const dateStr = departureDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor).text(dateStr, timeX, currentY);
      
      let timelineY = currentY + 20;
      
      // Departure Point
      const depTime = bookingData.departureTime || '08:30';
      doc.font('Helvetica-Bold').fontSize(12).fillColor(darkColor).text(depTime, timeX, timelineY);
      doc.circle(timelineX, timelineY + 6, 4).fill(primaryColor);
      
      const originName = bookingData.origin?.name || bookingData.origin || 'Batam Centre';
      doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor).text(originName, textX, timelineY, { width: 140 });
      const originHeight = doc.heightOfString(originName, { width: 140 });
      
      // Gate Details (dynamically computed)
      const gateOpen = bookingData.gateOpen || '07:30';
      const gateClose = bookingData.gateClose || '08:15';
      doc.font('Helvetica').fontSize(8).fillColor(textColor).text(`Gate Open: ${gateOpen} | Close: ${gateClose}`, textX, timelineY + originHeight + 2, { width: 140 });

      const departureCircleY = timelineY + 6;

      // Pushing timelineY down dynamically to prevent overlaps
      const timelineGap = Math.max(65, originHeight + 35);
      timelineY += timelineGap;
      
      // Arrival Point
      const arrTime = bookingData.arrivalTime || '09:30';
      doc.font('Helvetica-Bold').fontSize(12).fillColor(darkColor).text(arrTime, timeX, timelineY);
      doc.circle(timelineX, timelineY + 6, 4).lineWidth(2).strokeColor(primaryColor).stroke(); // Hollow circle
      
      const destName = bookingData.destination?.name || bookingData.destination || 'HarbourFront';
      doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor).text(destName, textX, timelineY, { width: 140 });
      const destHeight = doc.heightOfString(destName, { width: 140 });
      doc.font('Helvetica').fontSize(8).fillColor(textColor).text('Arrival Terminal / Terminal Kedatangan', textX, timelineY + destHeight + 2, { width: 140 });

      const arrivalCircleY = timelineY + 6;

      // Draw vertical line for timeline perfectly connecting departure and arrival circles
      doc.moveTo(timelineX, departureCircleY + 4).lineTo(timelineX, arrivalCircleY - 2).strokeColor(lineGray).stroke();

      // Right Column: Booking Info
      let rightY = 110;
      const rightX = doc.page.width - 180;
      const bookingNo = bookingData.bookingNo || bookingData.bookingCode || 'SF-987654';

      doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor).text('TiketQ Booking ID', rightX, rightY, { width: 140 });
      doc.font('Helvetica').fontSize(8).fillColor(mutedColor).text('No. Pesanan', rightX, rightY + 11, { width: 140 });
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor).text(bookingNo, rightX, rightY + 22, { width: 140 });
      const idHeight = doc.heightOfString(bookingNo, { width: 140 });

      rightY += Math.max(45, 25 + idHeight);
      
      doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor).text('Ferry Booking Code', rightX, rightY, { width: 140 });
      doc.font('Helvetica').fontSize(8).fillColor(mutedColor).text('Kode Booking Feri (PNR)', rightX, rightY + 11, { width: 140 });
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor).text(bookingNo, rightX, rightY + 22, { width: 140 });
      const codeHeight = doc.heightOfString(bookingNo, { width: 140 });

      rightY += Math.max(45, 25 + codeHeight);
      
      // Add QR Code at the bottom of the right column (encodes first passenger's voucher id or bookingNo)
      try {
        const firstVoucherId = (bookingData.passengers && bookingData.passengers[0]?.voucherCodeId) || bookingNo;
        const qrBuffer = await QRCode.toBuffer(firstVoucherId);
        doc.image(qrBuffer, rightX, rightY, { width: 60 });
      } catch (err) {
        console.error("QR Code generation failed for Ferry PDF", err);
      }

      // Prevent Overlap: We calculate the maximum Y attained by all 3 columns
      currentY = Math.max(timelineY + destHeight + 35, rightY + 70);
      
      doc.moveTo(40, currentY).lineTo(doc.page.width - 40, currentY).strokeColor(lineGray).stroke();

      // 3. INFO HIGHLIGHTS
      currentY += 15;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor);
      
      // Icon 1
      doc.rect(40, currentY, 15, 15).strokeColor(primaryColor).stroke();
      doc.text('Tunjukkan e-tiket dan', 65, currentY);
      doc.text('paspor para penumpang', 65, currentY + 12);
      doc.text('saat boarding pass', 65, currentY + 24);

      // Icon 2
      doc.circle(230, currentY + 7, 8).strokeColor(primaryColor).stroke();
      doc.text('Check-in paling lambat', 250, currentY);
      doc.text('90 menit sebelum', 250, currentY + 12);
      doc.text('keberangkatan', 250, currentY + 24);

      // Icon 3
      doc.circle(410, currentY + 7, 8).strokeColor(primaryColor).stroke();
      doc.text('Waktu tertera adalah', 430, currentY + 6);
      doc.text('waktu pelabuhan setempat', 430, currentY + 18);

      currentY += 50;
      doc.moveTo(40, currentY).lineTo(doc.page.width - 40, currentY).strokeColor(lineGray).stroke();

      // 4. PASSENGER DETAILS
      currentY += 20;
      doc.font('Helvetica-Bold').fontSize(14).fillColor(darkColor).text('Passenger Details', 40, currentY);
      doc.font('Helvetica').fontSize(10).fillColor(mutedColor).text('Detail Penumpang', 40, currentY + 16);

      currentY += 35;
      
      // Table Header (Gray Background)
      doc.rect(40, currentY, doc.page.width - 80, 30).fill('#f8f9fa');
      
      doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor);
      const th1 = 50;  // No
      const th2 = 80;  // Passenger
      const th3 = 210; // Route
      const th4 = 285; // Passport No
      const th5 = 365; // Nationality
      const th6 = 460; // QR Code

      doc.text('No.', th1, currentY + 10);
      doc.text('Passenger(s) Name', th2, currentY + 10);
      doc.text('Route', th3, currentY + 10);
      doc.text('Passport No.', th4, currentY + 10);
      doc.text('Nationality', th5, currentY + 10);
      doc.text('QR Code', th6, currentY + 10);

      currentY += 35;

      // Passengers List
      const passengersList = bookingData.passengers && bookingData.passengers.length > 0 
        ? bookingData.passengers 
        : [{ title: '', firstName: bookingData.email || 'Passenger', lastName: '' }];
      
      const originCode = (bookingData.origin?.code || bookingData.originCode || '').toUpperCase() || 'BTC';
      const destCode = (bookingData.destination?.code || bookingData.destinationCode || '').toUpperCase() || 'HBF';
      const routeText = `${originCode} - ${destCode}`;

      for (let i = 0; i < passengersList.length; i++) {
        const p = passengersList[i];
        doc.font('Helvetica').fontSize(9).fillColor(textColor);
        // No
        doc.text(`${i + 1}.`, th1, currentY);
        
        // Name
        const fullName = `${(p.title || '').toUpperCase()} ${(p.firstName || p.first_name || '').toUpperCase()} ${(p.lastName || p.last_name || '').toUpperCase()}`;
        doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor).text(fullName, th2, currentY, { width: 120 });
        const nameHeight = doc.heightOfString(fullName, { width: 120 });
        doc.font('Helvetica').fontSize(8).fillColor(mutedColor).text('(Adult / Dewasa)', th2, currentY + nameHeight + 1);
        
        // Route (Pill shape)
        doc.roundedRect(th3 - 5, currentY - 2, 55, 14, 7).strokeColor(lineGray).stroke();
        doc.font('Helvetica-Bold').fontSize(8).fillColor(primaryColor).text(routeText, th3 - 5, currentY + 1, { width: 55, align: 'center' });
        
        // Passport No
        const passportNum = p.passportNumber || '-';
        doc.font('Helvetica').fontSize(9).fillColor(textColor).text(passportNum, th4, currentY);
        
        // Nationality
        const nationalityStr = p.nationality || 'Indonesian';
        doc.text(nationalityStr, th5, currentY);

        // QR Code
        const qrCodeVal = p.voucherCodeId || bookingNo;
        try {
          const qrBuffer = await QRCode.toBuffer(qrCodeVal);
          doc.image(qrBuffer, th6, currentY - 5, { width: 35 });
        } catch (err) {
          console.error("Failed to generate individual passenger QR in PDF:", err);
        }

        // Dynamically increment row height based on text wrapping
        const rowHeight = Math.max(40, nameHeight + 18);
        currentY += rowHeight;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateFerryTicketPDF
};
