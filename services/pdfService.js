const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

async function generateTicketPDF(bookingData) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const primaryColor = '#2563eb'; // TiketQ Blue
      const darkColor = '#333333';
      const textColor = '#555555';
      const mutedColor = '#888888';
      const lineGray = '#e5e7eb';

      const logoPngPath = path.join(__dirname, '../assets/brand.png');
      let hasLogo = fs.existsSync(logoPngPath);

      // 1. TOP HEADER
      doc.font('Helvetica-Bold').fontSize(16).fillColor(darkColor).text('E-ticket ', 40, 40, { continued: true })
         .font('Helvetica').fillColor(mutedColor).text('/ E-tiket');
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor).text('Departure Flight ', 40, 60, { continued: true })
         .font('Helvetica').fillColor(mutedColor).text('/ Penerbangan Pergi');
      
      // Top Right Logo (flex-end)
      if (hasLogo) {
         doc.image(logoPngPath, doc.page.width - 180, 20, { fit: [140, 50], align: 'right' });
      } else {
         doc.font('Helvetica-Bold').fontSize(32).fillColor(primaryColor).text('TiketQ', doc.page.width - 150, 25);
      }
      
      doc.moveTo(40, 90).lineTo(doc.page.width - 40, 90).strokeColor(lineGray).stroke();

      // 2. MIDDLE SECTION (Airline, Flight Timeline, Booking Info)
      let currentY = 110;

      // Left Column: Airline Logo text
      doc.font('Helvetica-Bold').fontSize(24).fillColor(primaryColor).text('TiketQ Air', 40, currentY);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor).text('TiketQ Airlines (Indonesia)', 40, currentY + 30);
      doc.font('Helvetica').text('TK-391', 40, currentY + 42);
      doc.text('Economy', 40, currentY + 54);

      // Middle Column: Flight Timeline
      const timeX = 180;
      const timelineX = 230;
      const textX = 250;

      const departureDate = new Date(bookingData.departureDate);
      const dateStr = departureDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor).text(dateStr, timeX, currentY);
      
      let flightY = currentY + 20;
      // Departure Point
      doc.font('Helvetica-Bold').fontSize(12).fillColor(darkColor).text('10:30', timeX, flightY);
      doc.circle(timelineX, flightY + 6, 4).fill(primaryColor);
      
      // Add `{ width: 140 }` constraint to prevent it from bleeding into the Booking column
      doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor).text(bookingData.origin, textX, flightY, { width: 140 });
      doc.font('Helvetica').fontSize(9).fillColor(textColor).text('Origin Airport - Terminal Departure', textX, flightY + 14, { width: 140 });

      // Draw vertical line for timeline
      doc.moveTo(timelineX, flightY + 12).lineTo(timelineX, flightY + 60).strokeColor(lineGray).stroke();

      flightY += 65;
      // Arrival Point
      doc.font('Helvetica-Bold').fontSize(12).fillColor(darkColor).text('12:00', timeX, flightY);
      doc.circle(timelineX, flightY + 6, 4).lineWidth(2).strokeColor(primaryColor).stroke(); // Hollow circle
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor).text(bookingData.destination, textX, flightY, { width: 140 });
      doc.font('Helvetica').fontSize(9).fillColor(textColor).text('Destination Airport - Terminal Arrival', textX, flightY + 14, { width: 140 });

      // Right Column: Booking Info
      let rightY = 110;
      const rightX = doc.page.width - 180;

      doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor).text('TiketQ Booking ID', rightX, rightY);
      doc.font('Helvetica').fontSize(8).fillColor(mutedColor).text('No. Pesanan', rightX, rightY + 12);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(darkColor).text(bookingData.bookingCode, rightX, rightY + 24);

      rightY += 45;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor).text('Airline Booking Code (PNR)', rightX, rightY);
      doc.font('Helvetica').fontSize(8).fillColor(mutedColor).text('Kode Booking Maskapai (PNR)', rightX, rightY + 12);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(darkColor).text(bookingData.bookingCode, rightX, rightY + 24);

      rightY += 45;
      doc.font('Helvetica').fontSize(8).fillColor(textColor).text('Ada batas waktu untuk refund (pelajari lewat E-tiket di App).', rightX, rightY, { width: 150 });
      
      rightY += 30;
      // Add QR Code at the bottom of the right column
      try {
        const qrBuffer = await QRCode.toBuffer('https://tiketq.com');
        doc.image(qrBuffer, rightX, rightY, { width: 50 });
      } catch (err) {
        console.error("QR Code generation failed for PDF", err);
      }

      // Fix Overlap: We calculate the maximum Y attained by all 3 columns
      currentY = Math.max(flightY + 40, rightY + 70);
      
      doc.moveTo(40, currentY).lineTo(doc.page.width - 40, currentY).strokeColor(lineGray).stroke();

      // 3. INFO HIGHLIGHTS
      currentY += 15;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor);
      
      // Icon 1
      doc.rect(40, currentY, 15, 15).strokeColor(primaryColor).stroke();
      doc.text('Tunjukkan e-tiket dan', 65, currentY);
      doc.text('paspor para penumpang', 65, currentY + 12);
      doc.text('saat check-in', 65, currentY + 24);

      // Icon 2
      doc.circle(230, currentY + 7, 8).strokeColor(primaryColor).stroke();
      doc.text('Check-in paling lambat', 250, currentY);
      doc.text('90 menit sebelum', 250, currentY + 12);
      doc.text('keberangkatan', 250, currentY + 24);

      // Icon 3
      doc.circle(410, currentY + 7, 8).strokeColor(primaryColor).stroke();
      doc.text('Waktu tertera adalah', 430, currentY + 6);
      doc.text('waktu bandara setempat', 430, currentY + 18);

      currentY += 50;
      doc.moveTo(40, currentY).lineTo(doc.page.width - 40, currentY).strokeColor(lineGray).stroke();

      // 4. PASSENGER DETAILS
      currentY += 30;
      doc.font('Helvetica-Bold').fontSize(14).fillColor(darkColor).text('Passenger Details', 40, currentY);
      doc.font('Helvetica').fontSize(10).fillColor(mutedColor).text('Detail Penumpang', 40, currentY + 16);

      currentY += 35;
      
      // Table Header (Gray Background)
      doc.rect(40, currentY, doc.page.width - 80, 40).fill('#f8f9fa');
      
      doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor);
      doc.text('No.', 50, currentY + 8);
      doc.text('Passenger(s)', 80, currentY + 8);
      doc.text('Route', 260, currentY + 8);
      doc.text('Flight Facilities', 330, currentY + 8);
      doc.text('Ticket Number', doc.page.width - 150, currentY + 8);

      doc.font('Helvetica').fontSize(8).fillColor(mutedColor);
      doc.text('No.', 50, currentY + 22);
      doc.text('Nama Penumpang', 80, currentY + 22);
      doc.text('Rute', 260, currentY + 22);
      doc.text('Fasilitas Penerbangan', 330, currentY + 22);
      doc.text('Nomor Tiket', doc.page.width - 150, currentY + 22);

      currentY += 45;

      // Passengers List
      const passengersList = bookingData.passengers && bookingData.passengers.length > 0 ? bookingData.passengers : [{ title: '', firstName: bookingData.name, lastName: '' }];
      
      doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor);
      
      // We will parse out 3 letter codes for route if possible, else just use first 3 letters
      const originCode = bookingData.origin.match(/\(([A-Z]{3})\)/) ? bookingData.origin.match(/\(([A-Z]{3})\)/)[1] : bookingData.origin.substring(0, 3).toUpperCase();
      const destCode = bookingData.destination.match(/\(([A-Z]{3})\)/) ? bookingData.destination.match(/\(([A-Z]{3})\)/)[1] : bookingData.destination.substring(0, 3).toUpperCase();
      const routeText = `${originCode} - ${destCode}`;

      passengersList.forEach((p, i) => {
        // No
        doc.font('Helvetica').text(`${i + 1}.`, 50, currentY);
        
        // Name
        const fullName = `${(p.title || '').toUpperCase()} ${(p.firstName || p.first_name || '').toUpperCase()} ${(p.lastName || p.last_name || '').toUpperCase()}`;
        doc.font('Helvetica-Bold').text(fullName, 80, currentY, { width: 170 });
        doc.font('Helvetica').fontSize(8).text('(Dewasa)', 80, currentY + 12);
        
        // Route (Pill shape)
        doc.roundedRect(260, currentY - 2, 55, 14, 7).strokeColor(lineGray).stroke();
        doc.font('Helvetica-Bold').fontSize(7).text(routeText, 260, currentY + 1.5, { width: 55, align: 'center' });
        
        // Facilities - FIXED X COORDINATE to MATCH HEADER (330 instead of 350)
        doc.font('Helvetica-Bold').fontSize(9).text('7 KG Bagasi Kabin', 330, currentY);
        doc.font('Helvetica').fontSize(8).text('*Dimensi bagasi mengikuti kebijakan maskapai', 330, currentY + 12, { width: 120 });
        doc.font('Helvetica-Bold').fontSize(9).text('0 KG Bagasi', 330, currentY + 35);
        
        // Ticket Number
        doc.font('Helvetica-Bold').fontSize(9).text(bookingData.bookingCode, doc.page.width - 150, currentY);

        currentY += 60;
      });


      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateTicketPDF
};
