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

  // Voucher retrieval + e-ticket email are non-critical for the webhook ack:
  // run them after returning so the gateway gets its response immediately.
  // The payment claim above already guarantees idempotency, and every failure
  // below is caught and logged exactly as before.
  (async () => {
    // Fetch real voucher codes from Sindo Ferry API
    try {
      const { makeRequest } = require("../routes/api/ferry/utils");
      const orderRes = await makeRequest("get", `/agent/Order/Orders/${bookingNo}/WithVoucherIssuance`);
      const orderData = orderRes.data?.data || orderRes.data || {};
      const vouchersList = orderData.vouchers || [];

      if (vouchersList.length > 0 && updatedBooking.passengers && updatedBooking.passengers.length > 0) {
        await Promise.all(updatedBooking.passengers.map((passenger, i) => {
          const pVoucher = vouchersList[i];
          if (pVoucher && pVoucher.voucherCodes && pVoucher.voucherCodes.length > 0) {
            const voucherCodeId = pVoucher.voucherCodes[0].id;
            passenger.voucherCodeId = voucherCodeId;
            return FerryBookingDAO.updatePassengerVoucher(passenger.id, voucherCodeId);
          }
          return null;
        }));
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

      const [pdfBuffer, invoiceBuffer] = await Promise.all([
        generateFerryTicketPDF(updatedBooking),
        generateInvoicePDF(updatedBooking),
      ]);
      await sendFerryBookingEmail(updatedBooking, pdfBuffer, invoiceBuffer);
    } catch (emailErr) {
      console.error("Failed to generate/send ferry e-ticket:", emailErr);
    }
  })();

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
  let issuePending = false;
  try {
    const providerResult = await apiService.fetchData(requestData);
    if (providerResult && providerResult.data && providerResult.data.rc === "00") {
      issueSuccess = true;
    } else if (providerResult?.data?.rc === "32" || providerResult?.data?.status === "ONPROGRESS") {
      // rc 32 = "Proses Issued Sedang Berlangsung": the provider accepted the
      // payment and is issuing asynchronously. Not a failure — poll bookInfo
      // until the ticket lands (observed live on booking NJUBID, 2026-07-23).
      issuePending = true;
    } else {
      console.error(`Failed to issue flight ticket on provider side (non-zero rc): ${providerResult?.data?.msg || providerResult?.message}`);
    }
  } catch (e) {
    console.error("Failed to issue ticket on provider side (exception):", e.message);
  }

  if (issuePending) {
    // Let the FE advance off the "checking payment" page: payment is settled,
    // the e-ticket page will show the ONPROGRESS state until the next update.
    emitBookingUpdate(bookingCode);
    pollUntilIssued(bookingCode, booking.id);
    return { settled: true, pending: true };
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

  // E-ticket email is non-critical for the webhook ack: run it after
  // returning. Idempotency comes from the claim; all errors stay logged.
  sendFlightEticketEmail(booking.id);

  return { settled: true };
}

/** Fire-and-forget e-ticket + invoice email for an issued flight booking. */
function sendFlightEticketEmail(bookingId) {
  (async () => {
    try {
      const { generateTicketPDF } = require('./pdfService');
      const { generateInvoicePDF } = require('./invoiceService');
      const { sendBookingEmail } = require('./emailService');

      const fullBooking = await FlightBookingDAO.findBookingById(bookingId);
      const [pdfBuffer, invoiceBuffer] = await Promise.all([
        generateTicketPDF(fullBooking),
        generateInvoicePDF(fullBooking),
      ]);
      await sendBookingEmail(fullBooking, pdfBuffer, invoiceBuffer);
    } catch (emailErr) {
      console.error("Failed to generate/send e-ticket:", emailErr);
    }
  })();
}

const ISSUE_POLL_INTERVAL_MS = 15000;
const ISSUE_POLL_MAX_ATTEMPTS = 40; // 40 × 15s = 10 minutes

/**
 * Background poll for an async provider issuance (rc 32 / ONPROGRESS): checks
 * bookInfo until the ticket is ISSUED, then finishes the normal settlement
 * (mark issued, notify FE, email). Flags TICKET_FAILED only on a terminal
 * provider status or timeout — payment_status stays true throughout.
 */
function pollUntilIssued(bookingCode, bookingId) {
  (async () => {
    for (let attempt = 1; attempt <= ISSUE_POLL_MAX_ATTEMPTS; attempt++) {
      await new Promise((r) => setTimeout(r, ISSUE_POLL_INTERVAL_MS));
      let status;
      try {
        const info = await apiService.fetchBookingInfo(bookingCode);
        status = info?.data?.status;
      } catch (e) {
        console.error(`Issue poll for ${bookingCode} (attempt ${attempt}) failed:`, e.message);
        continue;
      }
      if (status === "ISSUED") {
        await FlightBookingDAO.markTicketIssued(bookingCode);
        console.log(`Successfully settled booking ${bookingCode} (issued after poll ${attempt})`);
        emitBookingUpdate(bookingCode);
        sendFlightEticketEmail(bookingId);
        return;
      }
      if (status && status !== "ONPROGRESS") {
        console.error(`CRITICAL: Payment settled for booking ${bookingCode}, but provider issuance ended as ${status}.`);
        await FlightBookingDAO.markTicketFailed(bookingCode);
        emitBookingUpdate(bookingCode);
        return;
      }
    }
    console.error(`CRITICAL: Payment settled for booking ${bookingCode}, but issuance still ONPROGRESS after ${ISSUE_POLL_MAX_ATTEMPTS} polls; flagging for ops.`);
    await FlightBookingDAO.markTicketFailed(bookingCode);
    emitBookingUpdate(bookingCode);
  })().catch((e) => console.error(`Issue poll for ${bookingCode} crashed:`, e));
}

module.exports = { fulfillFerryBooking, fulfillFlightBooking };
