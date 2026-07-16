const Dana = require('dana-node').default;

/**
 * Shared DANA SDK client, configured from env vars set in the merchant sandbox dashboard.
 * Signing is asymmetric (RSA-SHA256 over the SNAP B2B string-to-sign), per DANA's
 * official Node SDK (see DanaSignatureUtil.generateSnapB2BScenarioSignature).
 */
const dana = new Dana({
  partnerId: process.env.DANA_CLIENT_ID || '',
  privateKey: process.env.DANA_PRIVATE_KEY || '',
  origin: process.env.DANA_ORIGIN || 'https://tiketq.com',
  env: process.env.DANA_ENV || 'sandbox',
});

/**
 * Calls DANA's Payment Gateway Create Order API (payment-host-to-host).
 *
 * @param {Object} orderRequest - CreateOrderByApiRequest / CreateOrderByRedirectRequest payload.
 * @returns {Promise<Object>} DANA's create order response.
 */
async function createOrder(orderRequest) {
  return dana.paymentGatewayApi.createOrder(orderRequest);
}

/** DANA requires validUpTo in GMT+7 as `YYYY-MM-DDTHH:mm:ss+07:00`, at most one week ahead. */
function danaValidUpTo(minutesAhead) {
  const d = new Date(Date.now() + minutesAhead * 60000 + 7 * 3600000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}+07:00`;
}

/**
 * Create a DANA hosted-checkout order (CreateOrderByRedirectRequest) and return
 * the response. The caller redirects the browser to `response.webRedirectUrl`.
 * `amountValue` must be a server-derived IDR string with 2 decimals (e.g. "350000.00").
 */
async function createRedirectOrder({ bookingNo, amountValue, orderTitle }) {
  const origin = process.env.DANA_ORIGIN || 'https://tiketq.com';
  const request = {
    partnerReferenceNo: bookingNo,
    merchantId: process.env.DANA_MERCHANT_ID,
    amount: { value: amountValue, currency: 'IDR' },
    validUpTo: danaValidUpTo(30),
    urlParams: [
      { url: `${origin}/dana-transaction-status?bookingno=${encodeURIComponent(bookingNo)}`, type: 'PAY_RETURN', isDeeplink: 'Y' },
      { url: `${process.env.DANA_NOTIFY_URL || origin}/api/dana-notify-callback`, type: 'NOTIFICATION', isDeeplink: 'Y' },
    ],
    additionalInfo: {
      mcc: '5732',
      envInfo: { sourcePlatform: 'IPG', terminalType: 'SYSTEM', orderTerminalType: 'WEB' },
      order: { orderTitle: orderTitle || `TiketQ Booking ${bookingNo}`, scenario: 'REDIRECT' },
    },
  };
  return dana.paymentGatewayApi.createOrder(request);
}

module.exports = { dana, createOrder, createRedirectOrder };
