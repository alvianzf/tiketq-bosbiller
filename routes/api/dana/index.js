const express = require('express');
const router = express.Router();
const FerryBookingDAO = require('../../../db/dao/FerryBookingDAO');
const FlightBookingDAO = require('../../../db/dao/FlightBookingDAO');
const { createRedirectOrder } = require('../../../services/danaService');

/** Format a Prisma Decimal / number into DANA's 2-decimal IDR string. */
function toDanaAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

/**
 * POST /api/dana/create-order
 * Body: { bookingNo }
 *
 * Creates a DANA hosted-checkout order priced entirely from the stored booking
 * (the client never supplies an amount) and returns { redirectUrl } for the
 * browser to navigate to. Rejects bookings that are already paid.
 */
router.post('/create-order', async (req, res, next) => {
  try {
    const { bookingNo } = req.body || {};
    if (!bookingNo) {
      return res.status(400).json({ message: 'bookingNo is required' });
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

    const result = await createRedirectOrder({ bookingNo, amountValue, orderTitle });

    if (result.responseCode !== '2005400' || !result.webRedirectUrl) {
      console.error('DANA create-order failed:', result.responseCode, result.responseMessage);
      return res.status(502).json({ message: 'Failed to create DANA payment order', code: result.responseCode });
    }

    return res.json({ redirectUrl: result.webRedirectUrl, referenceNo: result.referenceNo });
  } catch (error) {
    console.error('DANA create-order error:', error.message);
    next(error);
  }
});

module.exports = router;
