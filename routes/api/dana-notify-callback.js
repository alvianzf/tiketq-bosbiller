const express = require('express');
const router = express.Router();
const { WebhookParser } = require('dana-node/webhook/v1');
const FlightBookingDAO = require('../../db/dao/FlightBookingDAO');
const FerryBookingDAO = require('../../db/dao/FerryBookingDAO');

// In sandbox, WebhookParser verifies against DANA's own baked-in sandbox public key
// (DANA signs the notify with its key, not ours). For production, set DANA_WEBHOOK_PUBLIC_KEY
// to the key DANA publishes for production webhook verification.
const webhookParser = new WebhookParser(process.env.DANA_WEBHOOK_PUBLIC_KEY);

/**
 * DANA Finish Notify webhook (registered as the merchant's "Finish Payment URL").
 * DANA calls this after a payment attempt completes; we must ack with
 * { responseCode: "2005600", responseMessage: "Successful" } once processed.
 */
router.post('/', async (req, res) => {
  const rawBody = req.rawBody || JSON.stringify(req.body);

  let notification;
  try {
    notification = webhookParser.parseWebhook('POST', req.originalUrl, req.headers, rawBody);
  } catch (error) {
    console.error('DANA notify signature/parse error:', error.message);
    return res.status(401).json({ message: 'Unauthorized. Invalid Signature' });
  }

  const { originalPartnerReferenceNo: bookingNo, latestTransactionStatus, amount } = notification;
  console.log('DANA notify received:', bookingNo, latestTransactionStatus, amount?.value);

  // DANA's own compliance test suite (github.com/dana-id/uat-script) uses amount 11012.00
  // as the trigger for the "partner simulates an internal server error" mandatory test scenario.
  if ((process.env.DANA_ENV || 'sandbox') === 'sandbox' && amount?.value === '11012.00') {
    return res.status(500).json({ responseCode: '5005601', responseMessage: 'Internal Server Error' });
  }

  try {
    if (latestTransactionStatus === '00') {
      const ferryBooking = await FerryBookingDAO.findBookingByNo(bookingNo);
      if (ferryBooking && ferryBooking.status !== 'PAID') {
        await FerryBookingDAO.updatePaymentStatusByNo(bookingNo, true);
      } else {
        const flightBookings = await FlightBookingDAO.findBookingsByBookNo(bookingNo);
        const flightBooking = flightBookings && flightBookings[0];
        if (flightBooking && !flightBooking.payment_status) {
          await FlightBookingDAO.findBookingByCodeAndUpdatePaymentStatus(bookingNo);
        }
      }

      try {
        require('../../socket').getIo().emit('booking:update', { bookingNo });
      } catch (socketErr) {
        console.error('Failed to emit socket event:', socketErr.message);
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
