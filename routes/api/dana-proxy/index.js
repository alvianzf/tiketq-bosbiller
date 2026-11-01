const express = require('express');
const router = express.Router();
const danaProxyAuth = require('../../../middleware/danaProxyAuth');
const { createNativePaymentOrder, queryPaymentStatus, PAY_METHOD_MAP } = require('../../../services/danaService');

const EXT_PREFIX = 'EXT-';

router.use(danaProxyAuth);

/**
 * POST /api/dana-proxy/create-order
 * Body: { referenceNo, amountValue, orderTitle, payMethod }
 *
 * Stopgap endpoint letting an external product reach DANA through this
 * server's whitelisted IP. Unlike /api/dana/create-order, this amount is NOT
 * independently verified against a tiketq booking — the caller is trusted to
 * supply the correct amount. referenceNo must be EXT-prefixed so it can never
 * collide with a real tiketq bookingNo, and so the notify webhook (see
 * dana-notify-callback.js) knows to forward the result here instead of trying
 * to fulfill a ferry/flight booking.
 */
router.post('/create-order', async (req, res, next) => {
  try {
    const { referenceNo, amountValue, orderTitle, payMethod } = req.body || {};

    if (!referenceNo || !referenceNo.startsWith(EXT_PREFIX)) {
      return res.status(400).json({ message: `referenceNo must start with "${EXT_PREFIX}"` });
    }
    if (!amountValue || !/^\d+\.\d{2}$/.test(amountValue)) {
      return res.status(400).json({ message: 'amountValue is required as a string with 2 decimals, e.g. "150000.00"' });
    }
    if (!payMethod || !PAY_METHOD_MAP[payMethod]) {
      return res.status(400).json({ message: `payMethod must be one of: ${Object.keys(PAY_METHOD_MAP).join(', ')}` });
    }

    const result = await createNativePaymentOrder({ bookingNo: referenceNo, amountValue, orderTitle, methodKey: payMethod });

    if (result.responseCode !== '2005400' || (!result.paymentCode && !result.redirectUrl)) {
      console.error('DANA proxy create-order failed:', result.responseCode, result.responseMessage);
      return res.status(502).json({
        message: 'Failed to create DANA payment',
        code: result.responseCode,
        detail: result.responseMessage,
      });
    }

    return res.json({
      method: result.method,
      kind: result.kind,
      vaNumber: result.vaNumber,
      redirectUrl: result.redirectUrl,
      paymentCode: result.paymentCode,
      qrContent: result.qrContent,
      expiryTime: result.expiryTime,
      referenceNo: result.partnerReferenceNo,
    });
  } catch (error) {
    if (error.status && error.rawText) {
      console.error('DANA gateway error:', error.status, error.rawText);
      return res.status(502).json({ message: 'DANA payment gateway is temporarily unavailable. Please try again.' });
    }
    console.error('DANA proxy create-order error:', error.message);
    next(error);
  }
});

/**
 * GET /api/dana-proxy/status/:referenceNo
 *
 * Fallback for when the notify webhook forward (see dana-notify-callback.js)
 * is missed or your endpoint was down — queries DANA directly for the
 * current status of an order you created through this proxy.
 */
router.get('/status/:referenceNo', async (req, res, next) => {
  try {
    const { referenceNo } = req.params;
    if (!referenceNo || !referenceNo.startsWith(EXT_PREFIX)) {
      return res.status(400).json({ message: `referenceNo must start with "${EXT_PREFIX}"` });
    }

    const result = await queryPaymentStatus(referenceNo);
    return res.json({
      referenceNo: result.referenceNo,
      status: result.status,
      amount: result.amount,
    });
  } catch (error) {
    console.error('DANA proxy status-check error:', error.message);
    return res.status(502).json({ message: 'Failed to query DANA payment status' });
  }
});

module.exports = router;
