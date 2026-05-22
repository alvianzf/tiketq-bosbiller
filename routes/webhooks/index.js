const express = require('express');
const router = express.Router();
const FlightBookingDAO = require("../../db/dao/FlightBookingDAO");
const apiService = require("../../services/apiService");

router.post('/midtrans', async (req, res, next) => {
  try {
    const notification = req.body;
    console.log("Midtrans webhook received:", notification.order_id, notification.transaction_status);

    const orderId = notification.order_id || "";
    // format is ORDER-{bookingCode}-{timestamp}
    const parts = orderId.split("-");
    const bookingCode = parts.length > 2 ? parts.slice(1, -1).join("-") : null;
    const nominal = notification.gross_amount;

    if (
      notification.transaction_status === 'capture' ||
      notification.transaction_status === 'settlement'
    ) {
      if (bookingCode) {
        // Find if booking already paid
        const bookings = await FlightBookingDAO.findBookingsByBookNo(bookingCode);
        const booking = bookings && bookings.length > 0 ? bookings[0] : null;

        if (booking && !booking.payment_status) {
          // Trigger actual issue ticket to provider
          const requestData = {
            f: "payment",
            bookingCode,
            nominal,
          };
          
          await apiService.fetchData(requestData).catch(e => {
            console.error("Failed to issue ticket on provider side via webhook", e);
          });
          
          // Update DB
          await FlightBookingDAO.findBookingByCodeAndUpdatePaymentStatus(bookingCode);
          console.log(`Successfully settled booking ${bookingCode}`);
          
          // Send E-Ticket Email asynchronously
          try {
            const { generateTicketPDF } = require('../../services/pdfService');
            const { generateInvoicePDF } = require('../../services/invoiceService');
            const { sendBookingEmail } = require('../../services/emailService');
            
            // Get full booking with passengers to pass to PDF generator
            const fullBooking = await FlightBookingDAO.findBookingById(booking.id);
            const pdfBuffer = await generateTicketPDF(fullBooking);
            const invoiceBuffer = await generateInvoicePDF(fullBooking);
            await sendBookingEmail(fullBooking, pdfBuffer, invoiceBuffer);
          } catch (emailErr) {
            console.error("Failed to generate/send e-ticket from webhook:", emailErr);
          }
        }
      }
    }

    res.status(200).json({ status: "OK" });
  } catch (error) {
    console.error("Webhook error:", error);
    next(error);
  }
});

module.exports = router;

