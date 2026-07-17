const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// Brand palette
const BRAND = '#FF5A00';       // TiketQ orange (primary)
const BRAND_SOFT = '#FFF3EC';  // soft orange tint for cards
const BRAND_BORDER = '#FFD9C2';
const DARK = '#1A1A1A';
const TEXT = '#555555';
const MUTED = '#8A8A8A';
const LINE = '#E6E6E6';
const TABLE_HEAD = '#F7F7F7';

const APP_URL = (code) => `https://tiketq.com/eticket?bookingno=${encodeURIComponent(code || '')}`;

function formatDepartureDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fullName(p) {
  return [p.title, p.firstName || p.first_name, p.lastName || p.last_name]
    .filter(Boolean)
    .join(' ')
    .toUpperCase()
    .trim();
}

function capitalize(str) {
  if (!str) return '';
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

async function generateTicketPDF(bookingData) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const pageLeft = doc.page.margins.left;                       // 40
      const pageRight = doc.page.width - doc.page.margins.right;     // ~555
      const contentWidth = pageRight - pageLeft;
      const code = bookingData.bookingCode || '';

      const logoPngPath = path.join(__dirname, '../assets/brand.png');
      const hasLogo = fs.existsSync(logoPngPath);

      // ---- 1. HEADER -------------------------------------------------------
      let y = 40;
      if (hasLogo) {
        doc.image(logoPngPath, pageLeft, y, { fit: [130, 40] });
      } else {
        doc.font('Helvetica-Bold').fontSize(26).fillColor(BRAND).text('TiketQ', pageLeft, y);
      }
      doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK)
        .text('E-Ticket ', pageLeft, y + 34, { continued: true })
        .font('Helvetica').fillColor(MUTED).text('/ E-tiket');

      // ISSUED badge (top right)
      const badgeText = 'ISSUED';
      const badgeW = 74;
      const badgeH = 22;
      const badgeX = pageRight - badgeW;
      doc.roundedRect(badgeX, y + 2, badgeW, badgeH, 11).fill(BRAND);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#FFFFFF')
        .text(badgeText, badgeX, y + 8, { width: badgeW, align: 'center' });

      y += 60;
      doc.moveTo(pageLeft, y).lineTo(pageRight, y).lineWidth(1).strokeColor(LINE).stroke();

      // ---- 2. BOOKING REFERENCE BLOCK (with QR) ----------------------------
      y += 20;
      const blockH = 96;
      doc.roundedRect(pageLeft, y, contentWidth, blockH, 8).fill(BRAND_SOFT);
      doc.roundedRect(pageLeft, y, contentWidth, blockH, 8).lineWidth(1).strokeColor(BRAND_BORDER).stroke();

      const refPadX = 22;
      const col1X = pageLeft + refPadX;
      const col2X = pageLeft + 210;

      // QR (right side of block)
      const qrSize = 70;
      const qrX = pageRight - refPadX - qrSize;
      const qrY = y + (blockH - qrSize) / 2;
      try {
        const qrBuffer = await QRCode.toBuffer(APP_URL(code), { margin: 0 });
        doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
      } catch (err) {
        console.error('QR Code generation failed for PDF', err);
      }
      doc.font('Helvetica').fontSize(7).fillColor(MUTED)
        .text('Scan to open in app', qrX - 8, qrY + qrSize + 4, { width: qrSize + 16, align: 'center' });

      // Left: TiketQ Booking ID
      let refY = y + 18;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text('TiketQ Booking ID', col1X, refY);
      doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text('No. Pesanan', col1X, refY + 12);
      doc.font('Helvetica-Bold').fontSize(16).fillColor(BRAND).text(code, col1X, refY + 26);

      // Middle: PNR
      doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text('Airline Booking Code (PNR)', col2X, refY);
      doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text('Kode Booking Maskapai', col2X, refY + 12);
      doc.font('Helvetica-Bold').fontSize(16).fillColor(DARK).text(code, col2X, refY + 26);

      y += blockH + 26;

      // ---- 3. ROUTE SECTION ------------------------------------------------
      doc.font('Helvetica-Bold').fontSize(12).fillColor(DARK).text('Flight ', pageLeft, y, { continued: true })
        .font('Helvetica').fillColor(MUTED).text('/ Penerbangan');
      y += 24;

      const routeColW = 200;
      // Origin (left)
      doc.font('Helvetica-Bold').fontSize(15).fillColor(DARK)
        .text(bookingData.origin || '-', pageLeft, y, { width: routeColW });
      doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('ORIGIN', pageLeft, y + 22);

      // Destination (right, right-aligned)
      doc.font('Helvetica-Bold').fontSize(15).fillColor(DARK)
        .text(bookingData.destination || '-', pageRight - routeColW, y, { width: routeColW, align: 'right' });
      doc.font('Helvetica').fontSize(8).fillColor(MUTED)
        .text('DESTINATION', pageRight - routeColW, y + 22, { width: routeColW, align: 'right' });

      // Connector line + arrow in the middle
      const midY = y + 9;
      const lineStart = pageLeft + routeColW + 12;
      const lineEnd = pageRight - routeColW - 12;
      if (lineEnd > lineStart) {
        doc.moveTo(lineStart, midY).lineTo(lineEnd, midY).lineWidth(1.5).strokeColor(BRAND).stroke();
        doc.circle(lineStart, midY, 2.5).fill(BRAND);
        doc.circle(lineEnd, midY, 2.5).fill(BRAND);
      }

      y += 40;
      // Departure date (centered)
      const dateStr = formatDepartureDate(bookingData.departureDate);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK)
        .text(dateStr ? `Departure: ${dateStr}` : 'Departure date unavailable', pageLeft, y, {
          width: contentWidth, align: 'center',
        });
      y += 16;
      doc.font('Helvetica').fontSize(8).fillColor(MUTED)
        .text('Live schedule & times: view your e-ticket in the TiketQ app', pageLeft, y, {
          width: contentWidth, align: 'center',
        });

      y += 26;
      doc.moveTo(pageLeft, y).lineTo(pageRight, y).lineWidth(1).strokeColor(LINE).stroke();

      // ---- 4. PASSENGER TABLE ---------------------------------------------
      y += 22;
      doc.font('Helvetica-Bold').fontSize(12).fillColor(DARK).text('Passenger Details ', pageLeft, y, { continued: true })
        .font('Helvetica').fillColor(MUTED).text('/ Detail Penumpang');
      y += 22;

      // Column layout
      const cNo = pageLeft + 10;
      const cName = pageLeft + 45;
      const cClass = pageLeft + 300;
      const cBooking = pageLeft + 400;
      const headH = 26;

      doc.rect(pageLeft, y, contentWidth, headH).fill(TABLE_HEAD);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(DARK);
      doc.text('NO.', cNo, y + 9);
      doc.text('PASSENGER NAME', cName, y + 9);
      doc.text('CABIN CLASS', cClass, y + 9);
      doc.text('BOOKING CODE', cBooking, y + 9);
      y += headH;

      const passengers = (bookingData.passengers && bookingData.passengers.length > 0)
        ? bookingData.passengers
        : [{ firstName: bookingData.name || 'Passenger', lastName: '', cabinClass: 'economy' }];

      const rowH = 28;
      passengers.forEach((p, i) => {
        const rowY = y + 9;
        doc.font('Helvetica').fontSize(9).fillColor(TEXT).text(`${i + 1}.`, cNo, rowY);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK)
          .text(fullName(p) || '-', cName, rowY, { width: cClass - cName - 10 });
        doc.font('Helvetica').fontSize(9).fillColor(TEXT)
          .text(capitalize(p.cabinClass) || 'Economy', cClass, rowY, { width: cBooking - cClass - 10 });
        doc.font('Helvetica').fontSize(9).fillColor(TEXT).text(code, cBooking, rowY);
        y += rowH;
        doc.moveTo(pageLeft, y).lineTo(pageRight, y).lineWidth(0.5).strokeColor(LINE).stroke();
      });

      // ---- 5. IMPORTANT INFO ----------------------------------------------
      y += 22;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK).text('Important Information ', pageLeft, y, { continued: true })
        .font('Helvetica').fillColor(MUTED).text('/ Informasi Penting');
      y += 20;

      const notes = [
        'Show this e-ticket and each passenger’s passport / ID at check-in.',
        'Check-in at least 90 minutes before departure. / Check-in paling lambat 90 menit sebelum keberangkatan.',
        'All times shown are local airport time. / Waktu tertera adalah waktu bandara setempat.',
      ];
      doc.font('Helvetica').fontSize(9).fillColor(TEXT);
      notes.forEach((n) => {
        doc.circle(pageLeft + 3, y + 5, 2).fill(BRAND);
        doc.fillColor(TEXT).text(n, pageLeft + 14, y, { width: contentWidth - 14 });
        y = doc.y + 8;
      });

      // ---- 6. FOOTER -------------------------------------------------------
      const footerY = doc.page.height - doc.page.margins.bottom - 46;
      doc.moveTo(pageLeft, footerY).lineTo(pageRight, footerY).lineWidth(1).strokeColor(LINE).stroke();
      doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND).text('TiketQ', pageLeft, footerY + 12);
      doc.font('Helvetica').fontSize(8).fillColor(MUTED)
        .text('Need help? support@tiketq.com', pageLeft, footerY + 24);
      doc.font('Helvetica').fontSize(8).fillColor(BRAND)
        .text(APP_URL(code), pageLeft, footerY + 12, {
          width: contentWidth, align: 'right', link: APP_URL(code),
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateTicketPDF,
};
