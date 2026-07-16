const FlightBookingDAO = require("../db/dao/FlightBookingDAO");
const FerryBookingDAO = require("../db/dao/FerryBookingDAO");
const apiService = require("./apiService");

/**
 * Post-payment fulfillment for any settled gateway (DANA), through one code path.
 *
 * Idempotency is enforced by an atomic claim (DAO updateMany guarded on
 * payment_status:false): only the first concurrent webhook delivery wins the
 * claim and runs issuance/email; duplicates get null and no-op. This is
 * race-safe, unlike a check-then-act read.
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
  const updatedBooking = await FerryBookingDAO.claimForPayment(bookingNo);
  if (!updatedBooking) {
    return { settled: false }; // already paid or not found
  }
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
  // Atomically claim the payment first so only one webhook delivery issues the
  // ticket. The money is already captured by the gateway, so payment_status is
  // set here; ticketIssued is only set after the provider confirms issuance.
  const booking = await FlightBookingDAO.claimForPayment(bookingCode);
  if (!booking) {
    return { settled: false }; // already paid or not found
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
    // Payment is captured but the ticket could not be issued: flag for ops
    // reconciliation. payment_status stays true (the customer did pay).
    console.error(`CRITICAL: Payment settled for booking ${bookingCode}, but provider ticket issuance failed.`);
    await FlightBookingDAO.markTicketFailed(bookingCode);
    return { settled: false, ticketFailed: true };
  }

  await FlightBookingDAO.markTicketIssued(bookingCode);
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
