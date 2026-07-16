const FlightBookingDAO = require("../db/dao/FlightBookingDAO");
const FerryBookingDAO = require("../db/dao/FerryBookingDAO");
const apiService = require("./apiService");

/**
 * Post-payment fulfillment, extracted from the Midtrans webhook so any settled
 * gateway (DANA, and previously Midtrans) issues tickets through one code path.
 *
 * Each function is a no-op if the booking is already PAID, so duplicate webhook
 * deliveries do not double-issue tickets or re-send emails.
 */

function emitBookingUpdate(bookingNo) {
  try {
    require('../socket').getIo().emit("booking:update", { bookingNo });
  } catch (socketErr) {
    console.error("Failed to emit socket event:", socketErr.message);
  }
}

/**
 * Settle a ferry booking: mark PAID, fetch Sindo voucher codes, email the
 * e-ticket + invoice. Returns { settled: boolean } — settled=false means it was
 * already paid (or not found) and nothing was done.
 */
async function fulfillFerryBooking(bookingNo) {
  const booking = await FerryBookingDAO.findBookingByNo(bookingNo);
  if (!booking || booking.status === 'PAID') {
    return { settled: false };
  }

  const updatedBooking = await FerryBookingDAO.updatePaymentStatusByNo(bookingNo, true);
  console.log(`Successfully settled ferry booking ${bookingNo}`);
  emitBookingUpdate(bookingNo);

  // Fetch real voucher codes from Sindo Ferry API
  try {
    const { makeRequest } = require("../routes/api/ferry/utils");
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
          passenger.voucherCodeId = voucherCodeId;
        }
      }
      console.log(`Successfully retrieved and stored Sindo Ferry voucher IDs for booking ${bookingNo}`);
    }
  } catch (voucherErr) {
    console.error(`Failed to fetch Sindo Ferry voucher IDs for booking ${bookingNo}:`, voucherErr.message);
  }

  // Send Ferry E-Ticket and Invoice Email
  try {
    const { generateFerryTicketPDF } = require('./ferryPdfService');
    const { generateInvoicePDF } = require('./invoiceService');
    const { sendFerryBookingEmail } = require('./emailService');

    const pdfBuffer = await generateFerryTicketPDF(updatedBooking);
    const invoiceBuffer = await generateInvoicePDF(updatedBooking);
    await sendFerryBookingEmail(updatedBooking, pdfBuffer, invoiceBuffer);
  } catch (emailErr) {
    console.error("Failed to generate/send ferry e-ticket:", emailErr);
  }

  return { settled: true };
}

/**
 * Settle a flight booking: issue the ticket with the provider first, and only
 * mark PAID + email if issuance succeeds; otherwise flag TICKET_FAILED. Returns
 * { settled, ticketFailed }.
 */
async function fulfillFlightBooking(bookingCode) {
  const bookings = await FlightBookingDAO.findBookingsByBookNo(bookingCode);
  const booking = bookings && bookings.length > 0 ? bookings[0] : null;
  if (!booking || booking.payment_status) {
    return { settled: false };
  }

  // nominal echoes the booking total the provider expects for the issue call.
  const requestData = { f: "payment", bookingCode, nominal: booking.nominal };

  let issueSuccess = false;
  try {
    const providerResult = await apiService.fetchData(requestData);
    if (providerResult && providerResult.data && providerResult.data.rc === "00") {
      issueSuccess = true;
    } else {
      console.error(`Failed to issue flight ticket on provider side (non-zero rc): ${providerResult?.data?.msg || providerResult?.message}`);
    }
  } catch (e) {
    console.error("Failed to issue ticket on provider side (exception):", e.message);
  }

  if (!issueSuccess) {
    console.error(`CRITICAL: Payment settled for booking ${bookingCode}, but provider ticket issuance failed.`);
    try {
      const { prisma } = require("../db/index");
      await prisma.transaction.updateMany({ where: { bookingCode }, data: { status: "TICKET_FAILED" } });
    } catch (dbErr) {
      console.error("Failed to update transaction status to TICKET_FAILED:", dbErr.message);
    }
    return { settled: false, ticketFailed: true };
  }

  await FlightBookingDAO.findBookingByCodeAndUpdatePaymentStatus(bookingCode);
  console.log(`Successfully settled booking ${bookingCode}`);
  emitBookingUpdate(bookingCode);

  try {
    const { generateTicketPDF } = require('./pdfService');
    const { generateInvoicePDF } = require('./invoiceService');
    const { sendBookingEmail } = require('./emailService');

    const fullBooking = await FlightBookingDAO.findBookingById(booking.id);
    const pdfBuffer = await generateTicketPDF(fullBooking);
    const invoiceBuffer = await generateInvoicePDF(fullBooking);
    await sendBookingEmail(fullBooking, pdfBuffer, invoiceBuffer);
  } catch (emailErr) {
    console.error("Failed to generate/send e-ticket:", emailErr);
  }

  return { settled: true };
}

module.exports = { fulfillFerryBooking, fulfillFlightBooking };
