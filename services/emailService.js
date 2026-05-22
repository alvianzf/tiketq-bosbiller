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

const generateHTMLTemplate = (bookingData) => {
  let passengerRows = '';
  const passengersList = bookingData.passengers && bookingData.passengers.length > 0 ? bookingData.passengers : [{ title: '', firstName: bookingData.name, lastName: '' }];
  
  passengersList.forEach((p, i) => {
    passengerRows += `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; color: #334155;">${i + 1}</td>
        <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; color: #334155; font-weight: bold;">
          👤 ${p.title || ''} ${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; text-align: right;">
          <span style="background: #f1f5f9; color: #94a3b8; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: bold;">Default</span>
        </td>
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
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    
    table { border-collapse: collapse; }
    
    .wrapper { width: 100%; max-width: 800px; margin: 0 auto; background-color: #f8fafc; padding: 20px; box-sizing: border-box; }
    .page-title { color: #f97316; font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .title-bar { width: 60px; height: 5px; background-color: #f97316; border-radius: 10px; margin-bottom: 30px; }
    
    .card { background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #f1f5f9; width: 100%; }
    .card-body { padding: 40px; }
    
    .status-label { color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
    .status-badge { background-color: #dcfce7; color: #15803d; padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; display: inline-block; }
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
    <div class="page-title">Flight E-Ticket</div>
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
                <div class="status-label">Booking Code & Status</div>
                <div class="booking-code">${bookingData.bookingCode}</div>
                <div class="status-badge">ISSUED</div>
              </td>
            </tr>
          </table>
          
          <!-- Info Boxes -->
          <table class="info-boxes" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="info-cell" width="33%" valign="middle" style="padding-right: 10px;">
                <span class="info-icon">🆔</span>
                <span class="info-text">Perlihatkan E-ticket & identitas saat check-in</span>
              </td>
              <td class="info-cell" width="33%" valign="middle" style="padding-right: 10px;">
                <span class="info-icon">🕒</span>
                <span class="info-text">Check-in paling lambat 90 menit sebelum keberangkatan</span>
              </td>
              <td class="info-cell" width="33%" valign="middle">
                <span class="info-icon">🌍</span>
                <span class="info-text">Waktu tertera merupakan waktu bandara setempat</span>
              </td>
            </tr>
          </table>
          
          <!-- Flight Box -->
          <table class="flight-box" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="flight-cell" width="30%" align="center" valign="middle">
                <p class="airport-code">${bookingData.origin}</p>
                <p class="airport-label">ORIGIN</p>
              </td>
              <td class="flight-cell" width="40%" align="center" valign="middle">
                <div class="line-wrapper"></div>
                <div style="color: #f97316; font-size: 20px; line-height: 1; margin-top: -30px;">✈</div>
                <div class="duration">Departure: ${new Date(bookingData.departureDate).toLocaleDateString()}</div>
              </td>
              <td class="flight-cell" width="30%" align="center" valign="middle">
                <p class="airport-code">${bookingData.destination}</p>
                <p class="airport-label">DESTINATION</p>
              </td>
            </tr>
          </table>
          
          <div class="section-title">Detail Penumpang</div>
          <table class="pass-table" cellpadding="0" cellspacing="0" border="0">
            <thead>
              <tr>
                <th width="10%">NO.</th>
                <th width="60%">NAMA PENUMPANG</th>
                <th width="30%" style="text-align: right;">FASILITAS</th>
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
          <div class="dark-title">💡 Catatan Penting:</div>
          <table class="responsive-table" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="dark-cell" width="50%" valign="top" style="font-size: 13px; line-height: 1.6; padding-right: 20px;">
                • Penumpang wajib memperhatikan persyaratan perjalanan internasional.<br><br>
                • Tiba di terminal 4 jam sebelum keberangkatan.<br><br>
                • Check-in ditutup 60 menit sebelum keberangkatan.
              </td>
              <td class="dark-cell" width="50%" valign="top" style="font-size: 13px; line-height: 1.6;">
                • Nama tiket harus sesuai dengan identitas resmi.<br><br>
                • Masa berlaku paspor minimal 6 bulan.<br><br>
                • Dilarang membawa barang berbahaya (gas, korosif, peledak).
              </td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <div class="dark-title">🔄 Pembatalan & Perubahan:</div>
          <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0;">
            Permintaan perubahan mengacu pada regulasi maskapai. Hubungi Customer Care di 0804 1500 777 untuk bantuan lebih lanjut.
          </p>
        </td>
      </tr>
    </table>
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
    
    // Generate QR Code Buffer
    const qrDataUrl = await QRCode.toDataURL('https://tiketq.com');
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

module.exports = {
  sendBookingEmail
};
