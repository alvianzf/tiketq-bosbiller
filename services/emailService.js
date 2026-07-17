const nodemailer = require("nodemailer");
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.sumopod.com",
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true" || true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const escapeHtml = (value) => String(value == null ? '' : value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const capitalizeWord = (str) => {
  if (!str) return '';
  const s = String(str);
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const formatFlightDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const appEticketUrl = (code) => `https://tiketq.com/eticket?bookingno=${encodeURIComponent(code || '')}`;

const generateHTMLTemplate = (bookingData) => {
  const code = bookingData.bookingCode || '';
  const appUrl = appEticketUrl(code);
  const dateStr = formatFlightDate(bookingData.departureDate);

  const passengersList = bookingData.passengers && bookingData.passengers.length > 0
    ? bookingData.passengers
    : [{ title: '', firstName: bookingData.name || 'Passenger', lastName: '', cabinClass: 'economy' }];

  let passengerRows = '';
  passengersList.forEach((p, i) => {
    const name = [p.title, p.firstName || p.first_name, p.lastName || p.last_name]
      .filter(Boolean).join(' ').toUpperCase().trim();
    const cabin = capitalizeWord(p.cabinClass) || 'Economy';
    passengerRows += `
      <tr>
        <td style="padding: 14px 15px; border-bottom: 1px solid #f1f1f1; color: #555;">${i + 1}</td>
        <td style="padding: 14px 15px; border-bottom: 1px solid #f1f1f1; color: #1a1a1a; font-weight: bold;">${escapeHtml(name) || '-'}</td>
        <td style="padding: 14px 15px; border-bottom: 1px solid #f1f1f1;">
          <span style="background: #fff3ec; color: #ff5a00; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold;">${escapeHtml(cabin)}</span>
        </td>
        <td style="padding: 14px 15px; border-bottom: 1px solid #f1f1f1; text-align: right; color: #555; font-weight: bold;">${escapeHtml(code)}</td>
      </tr>
    `;
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    table { border-collapse: collapse; }

    .wrapper { width: 100%; max-width: 640px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; box-sizing: border-box; }
    .page-title { color: #ff5a00; font-size: 22px; font-weight: 800; margin-bottom: 6px; }
    .page-sub { color: #8a8a8a; font-size: 13px; margin-bottom: 18px; }

    .card { background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 24px -8px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #eee; width: 100%; }
    .card-body { padding: 32px; }

    .status-label { color: #8a8a8a; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .status-badge { background-color: #ff5a00; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; display: inline-block; }

    .ref-box { background: #fff3ec; border: 1px solid #ffd9c2; border-radius: 10px; padding: 20px; margin-bottom: 28px; width: 100%; box-sizing: border-box; }
    .ref-key { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #8a8a8a; margin-bottom: 4px; }
    .ref-val { font-size: 20px; font-weight: 800; color: #ff5a00; }
    .ref-val-dark { font-size: 20px; font-weight: 800; color: #1a1a1a; }

    .route-box { width: 100%; border: 1px solid #eee; border-radius: 10px; padding: 26px; box-sizing: border-box; margin-bottom: 24px; background: #ffffff; }
    .airport-code { font-size: 17px; font-weight: bold; color: #1a1a1a; margin: 0; line-height: 1.4; }
    .airport-label { font-size: 10px; font-weight: bold; color: #b0b0b0; text-transform: uppercase; margin-top: 4px; margin-bottom: 0; }
    .line-wrapper { width: 100%; height: 2px; background: #ff5a00; margin: 14px 0; }
    .route-date { font-size: 12px; font-weight: bold; color: #1a1a1a; text-align: center; margin-top: 6px; }
    .route-note { font-size: 11px; color: #8a8a8a; text-align: center; margin-top: 6px; }

    .cta-wrap { text-align: center; margin: 8px 0 28px; }
    .cta-btn { background: #ff5a00; color: #ffffff !important; text-decoration: none; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 8px; display: inline-block; }
    .cta-note { font-size: 12px; color: #8a8a8a; margin-top: 12px; }

    .section-title { font-size: 16px; font-weight: 800; color: #1a1a1a; margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 12px; }

    .pass-table { width: 100%; margin-bottom: 28px; }
    .pass-table th { background: #fff3ec; color: #ff5a00; font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 12px 15px; text-align: left; border-bottom: 1px solid #ffd9c2; }

    .notes-box { background: #fafafa; border: 1px solid #eee; border-radius: 10px; padding: 22px; box-sizing: border-box; }
    .notes-title { color: #1a1a1a; font-size: 14px; font-weight: bold; margin-bottom: 12px; }
    .notes-list { font-size: 12px; line-height: 1.7; color: #555; margin: 0; padding-left: 18px; }

    .footer { text-align: center; padding: 24px 10px 6px; }
    .footer-brand { color: #ff5a00; font-weight: bold; font-size: 14px; }
    .footer-link { color: #ff5a00; text-decoration: none; font-size: 12px; }
    .footer-muted { color: #8a8a8a; font-size: 12px; }

    @media only screen and (max-width: 600px) {
      .wrapper { padding: 10px; }
      .card-body { padding: 20px; }
      .responsive-table { display: block; width: 100% !important; }
      .responsive-cell { display: block; width: 100% !important; text-align: left !important; padding: 10px 0 !important; }
      .header-logo { text-align: center; padding-bottom: 16px !important; border-bottom: 1px solid #f1f1f1; }
      .header-status { text-align: center !important; padding-top: 16px !important; }
      .ref-cell { display: block; width: 100% !important; padding: 8px 0 !important; }
      .route-cell { display: block; width: 100% !important; text-align: center !important; padding: 10px 0; }
      .pass-table th, .pass-table td { padding: 10px 6px !important; font-size: 12px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="page-title">TiketQ</div>
    <div class="page-sub">E-Ticket / E-tiket</div>

    <table class="card" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="card-body">

          <!-- Header -->
          <table class="responsive-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid #f1f1f1; padding-bottom: 18px; margin-bottom: 24px;">
            <tr>
              <td class="responsive-cell header-logo" width="45%" valign="middle">
                <img src="cid:qrcode@tiketq.com" width="72" alt="TiketQ e-ticket QR code" style="border-radius: 6px; border: 1px solid #eee;">
                <div style="font-size: 10px; color: #8a8a8a; margin-top: 6px;">Scan to open in app</div>
              </td>
              <td class="responsive-cell header-status" width="55%" valign="middle" align="right">
                <div class="status-label">Status</div>
                <div class="status-badge">ISSUED</div>
              </td>
            </tr>
          </table>

          <!-- Booking Reference -->
          <table class="ref-box" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="ref-cell" width="50%" valign="top">
                <div class="ref-key">TiketQ Booking ID / No. Pesanan</div>
                <div class="ref-val">${escapeHtml(code)}</div>
              </td>
              <td class="ref-cell" width="50%" valign="top">
                <div class="ref-key">Airline Booking Code (PNR)</div>
                <div class="ref-val-dark">${escapeHtml(code)}</div>
              </td>
            </tr>
          </table>

          <!-- Route -->
          <table class="route-box" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="route-cell" width="35%" align="center" valign="middle">
                <p class="airport-code">${escapeHtml(bookingData.origin || '-')}</p>
                <p class="airport-label">Origin</p>
              </td>
              <td class="route-cell" width="30%" align="center" valign="middle">
                <div class="line-wrapper"></div>
                <div style="color: #ff5a00; font-size: 18px; line-height: 1;">&#9992;</div>
              </td>
              <td class="route-cell" width="35%" align="center" valign="middle">
                <p class="airport-code">${escapeHtml(bookingData.destination || '-')}</p>
                <p class="airport-label">Destination</p>
              </td>
            </tr>
            <tr>
              <td colspan="3" style="padding-top: 12px; border-top: 1px solid #f1f1f1;">
                <div class="route-date">${dateStr ? 'Departure: ' + escapeHtml(dateStr) : 'Departure date unavailable'}</div>
                <div class="route-note">Live schedule &amp; times: view your e-ticket in the TiketQ app</div>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <div class="cta-wrap">
            <a href="${appUrl}" class="cta-btn" target="_blank">View E-Ticket in TiketQ App</a>
            <div class="cta-note">Your full e-ticket PDF is attached to this email.</div>
          </div>

          <!-- Passengers -->
          <div class="section-title">Passenger Details / Detail Penumpang</div>
          <table class="pass-table" cellpadding="0" cellspacing="0" border="0">
            <thead>
              <tr>
                <th width="8%">NO.</th>
                <th width="47%">PASSENGER NAME</th>
                <th width="20%">CABIN CLASS</th>
                <th width="25%" style="text-align: right;">BOOKING CODE</th>
              </tr>
            </thead>
            <tbody>
              ${passengerRows}
            </tbody>
          </table>

          <!-- Notes -->
          <div class="notes-box">
            <div class="notes-title">Important Information / Informasi Penting</div>
            <ul class="notes-list">
              <li>Show this e-ticket and each passenger's passport / ID at check-in. / Tunjukkan e-tiket dan identitas saat check-in.</li>
              <li>Check-in at least 90 minutes before departure. / Check-in paling lambat 90 menit sebelum keberangkatan.</li>
              <li>All times shown are local airport time. / Waktu tertera adalah waktu bandara setempat.</li>
            </ul>
          </div>

        </td>
      </tr>
    </table>

    <div class="footer">
      <div class="footer-brand">TiketQ</div>
      <div class="footer-muted" style="margin: 6px 0;">Need help? <a href="mailto:support@tiketq.com" class="footer-link">support@tiketq.com</a></div>
      <div><a href="${appUrl}" class="footer-link" target="_blank">${appUrl}</a></div>
    </div>
  </div>
</body>
</html>
  `;
};

async function sendBookingEmail(bookingData, pdfBuffer, invoiceBuffer) {
  try {
    const htmlContent = generateHTMLTemplate(bookingData);

    const attachments = [
      {
        filename: `E-Ticket-${bookingData.bookingCode}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ];

    if (invoiceBuffer) {
      attachments.push({
        filename: `Invoice-${bookingData.bookingCode}.pdf`,
        content: invoiceBuffer,
        contentType: 'application/pdf'
      });
    }
    
    // Generate QR Code Buffer (deep link to the in-app e-ticket)
    const qrDataUrl = await QRCode.toDataURL(appEticketUrl(bookingData.bookingCode));
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    
    attachments.push({
      filename: 'qrcode.png',
      content: qrBuffer,
      cid: 'qrcode@tiketq.com',
      contentDisposition: 'inline'
    });

    const info = await transporter.sendMail({
      from: '"TiketQ No-Reply" <no-reply@tiketq.com>',
      to: bookingData.email,
      subject: `Your TiketQ E-Ticket & Invoice - ${bookingData.bookingCode}`,
      text: `Your flight from ${bookingData.origin} to ${bookingData.destination} is confirmed. Booking Code: ${bookingData.bookingCode}.`,
      html: htmlContent,
      attachments: attachments
    });

    console.log("E-Ticket email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send e-ticket email:", error);
    return false;
  }
}

const generateFerryHTMLTemplate = (bookingData) => {
  let passengerRows = '';
  const passengersList = bookingData.passengers && bookingData.passengers.length > 0 ? bookingData.passengers : [{ title: '', firstName: 'Passenger', lastName: '' }];
  
  passengersList.forEach((p, i) => {
    passengerRows += `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; color: #334155;">${i + 1}</td>
        <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; color: #334155; font-weight: bold;">
          👤 ${p.title || ''} ${(p.firstName || p.first_name || '').toUpperCase()} ${(p.lastName || p.last_name || '').toUpperCase()}
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; color: #334155;">
          Passport: ${p.passportNumber || '-'}
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #f1f5f9;">
          <span style="background: #fff7ed; color: #f97316; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: bold;">${p.nationality || 'Indonesian'}</span>
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; text-align: right;">
          <img src="cid:qrcode-pax-${i}@tiketq.com" width="50" alt="Ticket QR Code" style="border-radius: 4px; vertical-align: middle;">
        </td>
      </tr>
    `;
  });

  const originName = bookingData.origin?.name || bookingData.origin || 'Batam Centre';
  const destName = bookingData.destination?.name || bookingData.destination || 'HarbourFront';
  const depDateStr = new Date(bookingData.departureDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const depTime = bookingData.departureTime || '08:30';
  const bookingNo = bookingData.bookingNo || bookingData.bookingCode || 'SF-987654';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    table { border-collapse: collapse; }
    .wrapper { width: 100%; max-width: 800px; margin: 0 auto; background-color: #f8fafc; padding: 20px; box-sizing: border-box; }
    .page-title { color: #f97316; font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .title-bar { width: 60px; height: 5px; background-color: #f97316; border-radius: 10px; margin-bottom: 30px; }
    .card { background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #f1f5f9; width: 100%; }
    .card-body { padding: 40px; }
    .status-label { color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
    .status-badge { background-color: #ffe6d5; color: #f97316; padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; display: inline-block; }
    .booking-code { font-size: 20px; font-weight: bold; color: #0f172a; margin-right: 15px; display: inline-block; }
    .info-boxes { background: #fff7ed; padding: 20px; border-radius: 8px; border: 1px solid #ffedd5; margin-bottom: 30px; width: 100%; box-sizing: border-box; }
    .info-icon { background: white; width: 30px; height: 30px; display: inline-block; text-align: center; line-height: 30px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); vertical-align: middle; margin-right: 10px;}
    .info-text { font-size: 12px; font-weight: 500; color: #334155; vertical-align: middle; }
    .flight-box { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px; box-sizing: border-box; margin-bottom: 40px; background: #ffffff; }
    .airport-code { font-size: 16px; font-weight: bold; color: #0f172a; margin: 0; line-height: 1.4; }
    .airport-label { font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-top: 5px; margin-bottom: 0; }
    .line-wrapper { width: 100%; height: 2px; background: #f97316; margin: 15px 0; position: relative;}
    .duration { font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; background: #f1f5f9; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-top: 15px; }
    .section-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; }
    .pass-table { width: 100%; margin-bottom: 40px; }
    .pass-table th { background: #fff7ed; color: #f97316; font-size: 12px; font-weight: bold; text-transform: uppercase; padding: 15px; text-align: left; border-bottom: 1px solid #ffedd5; }
    .dark-card { background-color: #0f172a; padding: 40px; color: #cbd5e1; box-sizing: border-box;}
    .dark-title { color: #ffffff; font-size: 16px; font-weight: bold; margin-bottom: 20px; }
    .divider { height: 1px; background: rgba(255,255,255,0.1); margin: 30px 0; }
    
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 10px; }
      .card-body { padding: 20px; }
      .dark-card { padding: 20px; }
      .responsive-table { display: block; width: 100% !important; }
      .responsive-cell { display: block; width: 100% !important; text-align: left !important; padding: 10px 0 !important; }
      .header-logo { text-align: center; padding-bottom: 20px !important; border-bottom: 1px solid #f1f5f9; }
      .header-status { text-align: center !important; padding-top: 20px !important; }
      .info-cell { display: block; width: 100% !important; padding: 10px 0 !important; }
      .flight-cell { display: block; width: 100% !important; text-align: center !important; padding: 10px 0; }
      .airport-code { font-size: 18px; }
      .dark-cell { display: block; width: 100% !important; padding-right: 0 !important; padding-bottom: 20px; }
      .pass-table th, .pass-table td { padding: 10px 5px !important; font-size: 12px; }
      .booking-code { display: block; margin-right: 0; margin-bottom: 10px; text-align: center; }
      .status-badge { display: inline-block; margin-left: 0; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="page-title">Ferry E-Ticket</div>
    <div class="title-bar"></div>
    
    <table class="card" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="card-body">
          <!-- Header -->
          <table class="responsive-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px;">
            <tr>
              <td class="responsive-cell header-logo" width="40%" valign="middle">
                <div style="font-size:24px;font-weight:bold;color:#f97316;letter-spacing:1px;margin-bottom:15px;">TiketQ</div>
                <img src="cid:qrcode@tiketq.com" width="60" alt="TiketQ QR Code" style="border-radius: 4px;">
              </td>
              <td class="responsive-cell header-status" width="60%" valign="middle" align="right">
                <div class="status-label">Ferry Booking Code & Status</div>
                <div class="booking-code">${bookingNo}</div>
                <div class="status-badge">ISSUED</div>
              </td>
            </tr>
          </table>
          
          <!-- Info Boxes -->
          <table class="info-boxes" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="info-cell" width="33%" valign="middle" style="padding-right: 10px;">
                <span class="info-icon">🆔</span>
                <span class="info-text">Perlihatkan E-ticket & paspor saat boarding pass</span>
              </td>
              <td class="info-cell" width="33%" valign="middle" style="padding-right: 10px;">
                <span class="info-icon">🕒</span>
                <span class="info-text">Boarding gate tutup 15 menit sebelum keberangkatan</span>
              </td>
              <td class="info-cell" width="33%" valign="middle">
                <span class="info-icon">🌍</span>
                <span class="info-text">Waktu tertera merupakan waktu pelabuhan setempat</span>
              </td>
            </tr>
          </table>
          
          <!-- Ferry Timeline Box -->
          <table class="flight-box" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="flight-cell" width="30%" align="center" valign="middle">
                <p class="airport-code">${originName}</p>
                <p class="airport-label">DEPARTURE TERMINAL</p>
              </td>
              <td class="flight-cell" width="40%" align="center" valign="middle">
                <div class="line-wrapper"></div>
                <div style="color: #f97316; font-size: 20px; line-height: 1; margin-top: -30px;">🚢</div>
                <div class="duration">Departure: ${depDateStr} at ${depTime}</div>
              </td>
              <td class="flight-cell" width="30%" align="center" valign="middle">
                <p class="airport-code">${destName}</p>
                <p class="airport-label">ARRIVAL TERMINAL</p>
              </td>
            </tr>
          </table>
          
          <div class="section-title">Detail Penumpang</div>
          <table class="pass-table" cellpadding="0" cellspacing="0" border="0">
            <thead>
              <tr>
                <th width="10%">NO.</th>
                <th width="35%">NAMA PENUMPANG</th>
                <th width="20%">PASPOR NO.</th>
                <th width="20%">KEWARGANEGARAAN</th>
                <th width="15%" style="text-align: right;">QR CODE</th>
              </tr>
            </thead>
            <tbody>
              ${passengerRows}
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td class="dark-card">
          <div class="dark-title">💡 Catatan Penting / Important Notes:</div>
          <table class="responsive-table" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="dark-cell" width="50%" valign="top" style="font-size: 13px; line-height: 1.6; padding-right: 20px;">
                • Masa berlaku Paspor minimal 6 bulan pada tanggal keberangkatan.<br><br>
                • Penumpang wajib check-in di konter pelabuhan 90 menit sebelum keberangkatan untuk mendapatkan boarding pass.
              </td>
              <td class="dark-cell" width="50%" valign="top" style="font-size: 13px; line-height: 1.6;">
                • Tiket ini bersifat non-refundable dan tidak dapat diuangkan kembali.<br><br>
                • Dilarang keras membawa barang-barang ilegal dan berbahaya sesuai regulasi keamanan pelayaran.
              </td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <div class="dark-title">🔄 Customer Service:</div>
          <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0;">
            Butuh bantuan? Hubungi Support TiketQ di support@tiketq.com atau layanan pelanggan kami.
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
};

async function sendFerryBookingEmail(bookingData, pdfBuffer, invoiceBuffer) {
  try {
    const htmlContent = generateFerryHTMLTemplate(bookingData);
    const bookingNo = bookingData.bookingNo || bookingData.bookingCode || 'SF-987654';

    const attachments = [
      {
        filename: `E-Ticket-${bookingNo}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ];

    if (invoiceBuffer) {
      attachments.push({
        filename: `Invoice-${bookingNo}.pdf`,
        content: invoiceBuffer,
        contentType: 'application/pdf'
      });
    }
    
    // Update the main email header QR code to encode the first passenger's ticket voucher ID
    const firstVoucherId = (bookingData.passengers && bookingData.passengers[0]?.voucherCodeId) || bookingNo;
    const qrDataUrl = await QRCode.toDataURL(firstVoucherId);
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    
    attachments.push({
      filename: 'qrcode.png',
      content: qrBuffer,
      cid: 'qrcode@tiketq.com',
      contentDisposition: 'inline'
    });

    // Generate individual passenger QR Code attachments
    const passengersList = bookingData.passengers && bookingData.passengers.length > 0 ? bookingData.passengers : [{ title: '', firstName: 'Passenger', lastName: '' }];
    for (let i = 0; i < passengersList.length; i++) {
      const p = passengersList[i];
      const paxVoucherId = p.voucherCodeId || bookingNo;
      const paxQrDataUrl = await QRCode.toDataURL(paxVoucherId);
      const paxQrBuffer = Buffer.from(paxQrDataUrl.split(',')[1], 'base64');
      attachments.push({
        filename: `qrcode-pax-${i}.png`,
        content: paxQrBuffer,
        cid: `qrcode-pax-${i}@tiketq.com`,
        contentDisposition: 'inline'
      });
    }

    const originName = bookingData.origin?.name || bookingData.origin || 'Batam Centre';
    const destName = bookingData.destination?.name || bookingData.destination || 'HarbourFront';

    const info = await transporter.sendMail({
      from: '"TiketQ No-Reply" <no-reply@tiketq.com>',
      to: bookingData.email,
      subject: `Your TiketQ Ferry E-Ticket & Invoice - ${bookingNo}`,
      text: `Your Sindo Ferry voyage from ${originName} to ${destName} is confirmed. Booking Code: ${bookingNo}.`,
      html: htmlContent,
      attachments: attachments
    });

    console.log("Ferry E-Ticket email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send ferry e-ticket email:", error);
    return false;
  }
}

module.exports = {
  sendBookingEmail,
  sendFerryBookingEmail
};
