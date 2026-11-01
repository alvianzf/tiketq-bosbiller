const express = require('express');
const router = express.Router();
const { WebhookParser } = require('dana-node/webhook/v1');
const FerryBookingDAO = require('../../db/dao/FerryBookingDAO');
const FlightBookingDAO = require('../../db/dao/FlightBookingDAO');
const { dana } = require('../../services/danaService');
const { fulfillFerryBooking, fulfillFlightBooking } = require('../../services/bookingFulfillment');

// In sandbox, WebhookParser verifies against DANA's own baked-in sandbox public key
// (DANA signs the notify with its key, not ours). For production, set DANA_WEBHOOK_PUBLIC_KEY
// or DANA_WEBHOOK_PUBLIC_KEY_PATH to the key/path DANA publishes for production webhook verification.
let webhookParser = null;
try {
  webhookParser = new WebhookParser(
    process.env.DANA_WEBHOOK_PUBLIC_KEY,
    process.env.DANA_WEBHOOK_PUBLIC_KEY_PATH
  );
} catch (error) {
  console.warn(`[DANA Webhook] WebhookParser initialization skipped/failed: ${error.message}. Falling back to queryPayment confirmation for incoming notifications.`);
}

/**
 * Confirms a payment directly with DANA before trusting a notification.
 * Used when signature verification is unavailable (no DANA public key configured):
 * the notify body is treated as a hint only, and the booking is updated solely
 * based on DANA's signed queryPayment answer.
 */
async function confirmPaidWithDana(bookingNo) {
  try {
    const result = await dana.paymentGatewayApi.queryPayment({
      originalPartnerReferenceNo: bookingNo,
      serviceCode: '54',
      merchantId: process.env.DANA_MERCHANT_ID,
    });
    return result.latestTransactionStatus === '00';
  } catch (error) {
    console.error('DANA queryPayment confirmation failed:', error.message);
    return false;
  }
}

const EXT_PREFIX = 'EXT-';

/**
 * Forwards a verified DANA notification to the external product behind
 * /api/dana-proxy (see routes/api/dana-proxy/index.js). Single attempt, no
 * retry queue — acceptable for the stopgap, but means a down external
 * endpoint silently drops the notification; the external product should also
 * be able to confirm status via DANA's queryPayment if it needs a backstop.
 */
async function forwardToExternalProduct({ referenceNo, status, amount }) {
  const url = process.env.DANA_PROXY_WEBHOOK_URL;
  const secret = process.env.DANA_PROXY_SHARED_SECRET;
  if (!url || !secret) {
    console.error(`DANA notify for ${referenceNo}: DANA_PROXY_WEBHOOK_URL/DANA_PROXY_SHARED_SECRET not set, cannot forward`);
    return;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'X-Service-Key': secret },
        body: JSON.stringify({ referenceNo, status, amount }),
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.error(`DANA notify forward to external product failed for ${referenceNo}:`, error.message);
  }
}

/**
 * DANA Finish Notify webhook (registered as the merchant's "Finish Payment URL").
 * DANA calls this after a payment attempt completes; we must ack with
 * { responseCode: "2005600", responseMessage: "Successful" } once processed.
 */
router.post('/', async (req, res) => {
  const rawBody = req.rawBody || JSON.stringify(req.body);

  let notification;
  if (webhookParser) {
    try {
      notification = webhookParser.parseWebhook('POST', req.originalUrl, req.headers, rawBody);
    } catch (error) {
      console.error('DANA notify signature/parse error:', error.message);
      return res.status(401).json({ message: 'Unauthorized. Invalid Signature' });
    }
  } else {
    // No DANA public key available: skip signature verification, but every
    // status-changing action below is gated on confirmPaidWithDana().
    try {
      notification = JSON.parse(rawBody);
    } catch (error) {
      console.error('DANA notify body parse error:', error.message);
      return res.status(400).json({ responseCode: '4005600', responseMessage: 'Bad Request' });
    }
  }

  const { originalPartnerReferenceNo: bookingNo, latestTransactionStatus, amount } = notification;
  console.log('DANA notify received:', bookingNo, latestTransactionStatus, amount?.value);

  // DANA's own compliance test suite (github.com/dana-id/uat-script) uses amount 11012.00
  // as the trigger for the "partner simulates an internal server error" mandatory test scenario.
  if ((process.env.DANA_ENV || 'sandbox') === 'sandbox' && amount?.value === '11012.00') {
    return res.status(500).json({ responseCode: '5005601', responseMessage: 'Internal Server Error' });
  }

  try {
    // Orders created through the external-product proxy (routes/api/dana-proxy)
    // use EXT-prefixed reference numbers and own no ferry/flight booking here —
    // forward the verified result instead of trying to fulfill a local booking.
    if (bookingNo && bookingNo.startsWith(EXT_PREFIX)) {
      if (latestTransactionStatus === '00' && !webhookParser && !(await confirmPaidWithDana(bookingNo))) {
        console.error(`DANA notify for ${bookingNo} claims paid but queryPayment did not confirm; rejecting.`);
        return res.status(500).json({ responseCode: '5005601', responseMessage: 'Internal Server Error' });
      }
      await forwardToExternalProduct({ referenceNo: bookingNo, status: latestTransactionStatus, amount });
      return res.status(200).json({ responseCode: '2005600', responseMessage: 'Successful' });
    }

    if (latestTransactionStatus === '00') {
      // Without signature verification the notify content is untrusted: confirm
      // the payment status with DANA directly before marking anything paid.
      if (!webhookParser && !(await confirmPaidWithDana(bookingNo))) {
        console.error(`DANA notify for ${bookingNo} claims paid but queryPayment did not confirm; rejecting.`);
        return res.status(500).json({ responseCode: '5005601', responseMessage: 'Internal Server Error' });
      }

      // Ferry vs flight is determined by which booking table owns this bookingNo.
      const isFerryBooking = await FerryBookingDAO.existsByNo(bookingNo);

      // Verify the paid amount matches the stored booking total before
      // fulfilling, so an underpaid/tampered settlement can't issue a ticket.
      // Enforced only when a stored booking exists (DANA's sandbox compliance
      // notifies use synthetic refs with no local booking).
      const booking = isFerryBooking
        ? await FerryBookingDAO.findBookingByNo(bookingNo)
        : (await FlightBookingDAO.findBookingsByBookNo(bookingNo))?.[0];
      if (booking) {
        const paidValue = Number(amount?.value);
        const expectedTotal = Number(booking.totalSales);
        if (!Number.isFinite(paidValue) || Math.round(paidValue) !== Math.round(expectedTotal)) {
          console.error(`DANA notify for ${bookingNo}: paid amount ${amount?.value} does not match booking total ${booking.totalSales}; rejecting.`);
          return res.status(500).json({ responseCode: '5005601', responseMessage: 'Internal Server Error' });
        }
      }

      // Fulfillment (mark PAID, issue tickets/vouchers, email) is idempotent, so a
      // duplicate notify delivery is a no-op.
      if (isFerryBooking) {
        await fulfillFerryBooking(bookingNo);
      } else {
        await fulfillFlightBooking(bookingNo);
      }
    }
    // latestTransactionStatus '05' (closed/expired) requires no DB action beyond acknowledging.

    return res.status(200).json({ responseCode: '2005600', responseMessage: 'Successful' });
  } catch (error) {
    console.error('DANA notify processing error:', error);
    return res.status(500).json({ responseCode: '5005601', responseMessage: 'Internal Server Error' });
  }
});

module.exports = router;
