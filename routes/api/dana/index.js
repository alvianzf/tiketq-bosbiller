const express = require('express');
const router = express.Router();
const FerryBookingDAO = require('../../../db/dao/FerryBookingDAO');
const FlightBookingDAO = require('../../../db/dao/FlightBookingDAO');
const { createNativePaymentOrder, PAY_METHOD_MAP } = require('../../../services/danaService');

/** Format a Prisma Decimal / number into DANA's 2-decimal IDR string. */
function toDanaAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

/**
 * POST /api/dana/create-order
 * Body: { bookingNo, payMethod }  payMethod ∈ QRIS | BCA | BNI | BRI | MANDIRI
 *
 * Creates a native DANA payment priced entirely from the stored booking (the
 * client never supplies an amount) and returns the VA/QRIS instructions the
 * frontend renders. Rejects bookings that are already paid.
 */
router.post('/create-order', async (req, res, next) => {
  try {
    const { bookingNo, payMethod } = req.body || {};
    if (!bookingNo) {
      return res.status(400).json({ message: 'bookingNo is required' });
    }
    if (!payMethod || !PAY_METHOD_MAP[payMethod]) {
      return res.status(400).json({ message: `payMethod must be one of: ${Object.keys(PAY_METHOD_MAP).join(', ')}` });
    }

    // Resolve the booking from whichever table owns this number, and read the
    // server-side total. Never trust a client-supplied amount.
    let amountSource;
    let orderTitle;
    let alreadyPaid = false;

    const ferryBooking = await FerryBookingDAO.findBookingByNo(bookingNo);
    if (ferryBooking) {
      amountSource = ferryBooking.totalSales;
      orderTitle = `TiketQ Ferry ${bookingNo}`;
      alreadyPaid = ferryBooking.status === 'PAID' || ferryBooking.payment_status === true;
    } else {
      const flightBookings = await FlightBookingDAO.findBookingsByBookNo(bookingNo);
      const flightBooking = flightBookings && flightBookings[0];
      if (!flightBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      amountSource = flightBooking.totalSales;
      orderTitle = `TiketQ Flight ${bookingNo}`;
      alreadyPaid = flightBooking.payment_status === true;
    }

    if (alreadyPaid) {
      return res.status(409).json({ message: 'Booking is already paid' });
    }

    const amountValue = toDanaAmount(amountSource);
    if (!amountValue) {
      return res.status(422).json({ message: 'Booking has no valid amount to charge' });
    }

    const result = await createNativePaymentOrder({ bookingNo, amountValue, orderTitle, methodKey: payMethod });

    if (result.responseCode !== '2005400' || !result.paymentCode) {
      console.error('DANA create-order failed:', result.responseCode, result.responseMessage);
      return res.status(502).json({
        message: 'Failed to create DANA payment',
        code: result.responseCode,
        detail: result.responseMessage,
      });
    }

    return res.json({
      method: result.method,
      kind: result.kind,          // 'QRIS' | 'VA'
      vaNumber: result.vaNumber,  // for VA
      qrContent: result.qrContent, // for QRIS
      paymentCode: result.paymentCode,
      expiryTime: result.expiryTime,
      referenceNo: result.referenceNo,
      bookingNo,
    });
  } catch (error) {
    // A DANA gateway outage (e.g. sandbox 502 on VA/QRIS) surfaces here.
    if (error.status && error.rawText) {
      console.error('DANA gateway error:', error.status, error.rawText);
      return res.status(502).json({ message: 'DANA payment gateway is temporarily unavailable. Please try again.' });
    }
    console.error('DANA create-order error:', error.message);
    next(error);
  }
});

module.exports = router;
