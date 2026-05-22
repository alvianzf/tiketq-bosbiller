const express = require('express');
const router = express.Router();
const FlightBookingDAO = require("../../db/dao/FlightBookingDAO");
const FerryBookingDAO = require("../../db/dao/FerryBookingDAO");
const apiService = require("../../services/apiService");

router.post('/midtrans', async (req, res, next) => {
  try {
    const notification = req.body;
    console.log("Midtrans webhook received:", notification.order_id, notification.transaction_status);

    const orderId = notification.order_id || "";

    // Intercept Ferry Transactions
    if (orderId.startsWith("ferry-")) {
      const parts = orderId.split("-");
      const bookingNo = parts.slice(1, -1).join("-");
      const nominal = notification.gross_amount;

      if (
        notification.transaction_status === 'capture' ||
        notification.transaction_status === 'settlement'
      ) {
        if (bookingNo) {
          const booking = await FerryBookingDAO.findBookingByNo(bookingNo);

          if (booking && booking.status !== 'PAID') {
            // Update FerryBooking & related Transaction statuses to PAID
            const updatedBooking = await FerryBookingDAO.updatePaymentStatusByNo(bookingNo, true);
            console.log(`Successfully settled ferry booking ${bookingNo}`);

            // Fetch real voucher codes from Sindo Ferry API
            try {
              const { makeRequest } = require("../api/ferry/utils");
              const orderRes = await makeRequest("get", `/agent/Order/Orders/${bookingNo}/WithVoucherIssuance`);
              const orderData = orderRes.data?.data || orderRes.data || {};
              const vouchersList = orderData.vouchers || [];
              
              if (vouchersList.length > 0 && updatedBooking.passengers && updatedBooking.passengers.length > 0) {
                for (let i = 0; i < updatedBooking.passengers.length; i++) {
                  const passenger = updatedBooking.passengers[i];
                  const pVoucher = vouchersList[i];
                  if (pVoucher && pVoucher.voucherCodes && pVoucher.voucherCodes.length > 0) {
                    const voucherCodeId = pVoucher.voucherCodes[0].id;
                    await FerryBookingDAO.updatePassengerVoucher(passenger.id, voucherCodeId);
                    // Update the in-memory passenger object so it's reflected immediately in PDF generation
                    passenger.voucherCodeId = voucherCodeId;
                  }
                }
                console.log(`Successfully retrieved and stored Sindo Ferry voucher IDs for booking ${bookingNo}`);
              }
            } catch (voucherErr) {
              console.error(`Failed to fetch Sindo Ferry voucher IDs for booking ${bookingNo}:`, voucherErr.message);
            }

            // Send Ferry E-Ticket and Invoice Email asynchronously
            try {
              const { generateFerryTicketPDF } = require('../../services/ferryPdfService');
              const { generateInvoicePDF } = require('../../services/invoiceService');
              const { sendFerryBookingEmail } = require('../../services/emailService');

              const pdfBuffer = await generateFerryTicketPDF(updatedBooking);
              const invoiceBuffer = await generateInvoicePDF(updatedBooking);

              await sendFerryBookingEmail(updatedBooking, pdfBuffer, invoiceBuffer);
            } catch (emailErr) {
              console.error("Failed to generate/send ferry e-ticket from webhook:", emailErr);
            }
          }
        }
      }
      return res.status(200).json({ status: "OK" });
    }

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

