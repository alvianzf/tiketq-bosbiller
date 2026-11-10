const crypto = require('crypto');
const Dana = require('dana-node').default;
const { DanaSignatureUtil } = require('dana-node/runtime');

const DANA_API_BASE_URL = process.env.DANA_API_BASE_URL || 'https://api.sandbox.dana.id';
const CREATE_ORDER_PATH = '/payment-gateway/v1.0/debit/payment-host-to-host.htm';

// A blank/missing DANA_ENV must never silently become 'sandbox': the DANA
// SDK's webhook verifier treats '' the same as 'sandbox' and checks incoming
// Finish Notify signatures against DANA's publicly-known sandbox key, so a
// prod deploy that simply forgets this var would accept forged "paid"
// webhooks. dana-preflight.js already fails fast on this before `npm start`,
// but this module-load check is the backstop for any path that imports
// danaService without going through that prestart script.
const DANA_ENV = (process.env.DANA_ENV || '').trim().toLowerCase();
if (DANA_ENV !== 'sandbox' && DANA_ENV !== 'production') {
  throw new Error(
    `DANA_ENV must be explicitly set to "sandbox" or "production" (got ${JSON.stringify(process.env.DANA_ENV)}). A blank value is treated as sandbox by the DANA SDK's webhook verifier, which would accept forged payment webhooks in production.`
  );
}

// Native payment methods → DANA payMethod/payOption enums.
// Only payment options verified working against the production merchant are
// listed here. BCA/BTPN/PERMATA/BSI are rejected by DANA for this merchant, and
// QRIS requires a registered externalStoreId (see DANA_STORE_ID below).
const PAY_METHOD_MAP = {
  // DANA balance/e-wallet — returns a webRedirectUrl to the DANA app/checkout.
  DANA: { payMethod: 'BALANCE', payOption: '' },
  // Virtual accounts — return a VA number the customer transfers to.
  BNI: { payMethod: 'VIRTUAL_ACCOUNT', payOption: 'VIRTUAL_ACCOUNT_BNI' },
  BRI: { payMethod: 'VIRTUAL_ACCOUNT', payOption: 'VIRTUAL_ACCOUNT_BRI' },
  MANDIRI: { payMethod: 'VIRTUAL_ACCOUNT', payOption: 'VIRTUAL_ACCOUNT_MANDIRI' },
  CIMB: { payMethod: 'VIRTUAL_ACCOUNT', payOption: 'VIRTUAL_ACCOUNT_CIMB' },
  PANIN: { payMethod: 'VIRTUAL_ACCOUNT', payOption: 'VIRTUAL_ACCOUNT_PANI' },
  // QRIS — requires a DANA_STORE_ID (externalStoreId) registered with DANA; a
  // merchant with no registered shop gets 4005401/4045408 for this method.
  QRIS: { payMethod: 'NETWORK_PAY', payOption: 'NETWORK_PAY_PG_QRIS' },
};

/**
 * Shared DANA SDK client, configured from env vars set in the merchant sandbox dashboard.
 * Signing is asymmetric (RSA-SHA256 over the SNAP B2B string-to-sign), per DANA's
 * official Node SDK (see DanaSignatureUtil.generateSnapB2BScenarioSignature).
 */
const dana = new Dana({
  partnerId: process.env.DANA_CLIENT_ID || '',
  privateKey: process.env.DANA_PRIVATE_KEY || '',
  origin: process.env.DANA_ORIGIN || 'https://tiketq.com',
  env: DANA_ENV,
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

function danaTimestamp() {
  const d = new Date(Date.now() + 7 * 3600000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}+07:00`;
}

/**
 * Normalize DANA's create-order response into the fields the frontend needs to
 * render a native VA / QRIS payment. DANA returns the code in additionalInfo;
 * exact field placement varies by method, so we read defensively and also
 * return `raw` for debugging until the shape is confirmed against a live
 * (non-502) sandbox / production response.
 */
function normalizePaymentResponse(body, methodKey, fallbackExpiry) {
  const ai = body.additionalInfo || {};
  const vaInfo = ai.virtualAccountInfo || {};
  const vaNumber = vaInfo.virtualAccountCode || ai.paymentCode || null;
  const redirectUrl = body.webRedirectUrl || null;
  // QRIS field name is unconfirmed live (no registered shop to test against
  // yet) — check the candidates DANA's SNAP docs/SDK use and fall back to
  // `raw` for debugging if none match.
  const qrContent = methodKey === 'QRIS'
    ? (ai.qrContent || ai.qrCode || ai.qrString || body.qrContent || body.qrCode || null)
    : null;
  const isQris = methodKey === 'QRIS';
  // BALANCE (DANA wallet) returns a redirect URL and no VA number.
  const isRedirect = !isQris && !vaNumber && !!redirectUrl;
  return {
    method: methodKey,
    kind: isQris ? 'QR' : (isRedirect ? 'REDIRECT' : 'VA'),
    // The Virtual Account number the customer transfers to (null for redirect/QR).
    paymentCode: vaNumber,
    qrContent,
    vaNumber,
    redirectUrl,
    expiryTime: vaInfo.virtualAccountExpiryTime || ai.expiryTime || fallbackExpiry,
    referenceNo: body.referenceNo || null,
    partnerReferenceNo: body.partnerReferenceNo || null,
    responseCode: body.responseCode,
    responseMessage: body.responseMessage,
    raw: body,
  };
}

/**
 * Queries DANA directly for a transaction's current status. Used by the
 * external-product proxy's status-check endpoint as a fallback when the
 * notify webhook is missed (see routes/api/dana-proxy/index.js).
 */
async function queryPaymentStatus(referenceNo) {
  try {
    const result = await dana.paymentGatewayApi.queryPayment({
      originalPartnerReferenceNo: referenceNo,
      serviceCode: '54',
      merchantId: process.env.DANA_MERCHANT_ID,
    });
    return {
      referenceNo,
      status: result.latestTransactionStatus,
      amount: result.amount || null,
      responseCode: result.responseCode,
      responseMessage: result.responseMessage,
    };
  } catch (error) {
    // The SDK throws on DANA's own 404 "Transaction Not Found" — surface that
    // as a normal not-found result instead of a generic failure.
    const body = error.rawResponse;
    if (body && body.responseCode === '4045501') {
      return { referenceNo, status: 'NOT_FOUND', amount: null, responseCode: body.responseCode, responseMessage: body.responseMessage };
    }
    throw error;
  }
}

/**
 * Create a native DANA payment (host-to-host) for a booking and return the
 * normalized VA instructions. `methodKey` is one of the keys in PAY_METHOD_MAP.
 * Uses a raw signed fetch (the SDK double-reads the body on these responses).
 * `amountValue` must be a server-derived IDR string with 2 decimals.
 */
async function createNativePaymentOrder({ bookingNo, amountValue, orderTitle, methodKey }) {
  const method = PAY_METHOD_MAP[methodKey];
  if (!method) throw new Error(`Unsupported DANA payment method: ${methodKey}`);

  const origin = process.env.DANA_ORIGIN || 'https://tiketq.com';
  const validUpTo = danaValidUpTo(25);
  const request = {
    partnerReferenceNo: bookingNo,
    merchantId: process.env.DANA_MERCHANT_ID,
    amount: { value: amountValue, currency: 'IDR' },
    // externalStoreId must be a shop registered with DANA (Create Shop API); an
    // unregistered value is rejected with 4045408 Invalid Merchant. Only send it
    // when a real store ID is configured (required for QRIS, optional for VA).
    ...(process.env.DANA_STORE_ID ? { externalStoreId: process.env.DANA_STORE_ID } : {}),
    validUpTo,
    urlParams: [
      { url: `${origin}/dana-transaction-status?bookingno=${encodeURIComponent(bookingNo)}`, type: 'PAY_RETURN', isDeeplink: 'Y' },
      { url: `${process.env.DANA_NOTIFY_URL || origin}/api/dana-notify-callback`, type: 'NOTIFICATION', isDeeplink: 'Y' },
    ],
    payOptionDetails: [
      { payMethod: method.payMethod, payOption: method.payOption, transAmount: { value: amountValue, currency: 'IDR' } },
    ],
    additionalInfo: {
      mcc: '5732',
      envInfo: { sourcePlatform: 'IPG', terminalType: 'SYSTEM', orderTerminalType: 'WEB' },
      order: { orderTitle: orderTitle || `TiketQ Booking ${bookingNo}`, scenario: 'API' },
    },
  };

  const timeStamp = danaTimestamp();
  const rawBody = JSON.stringify(request);
  const signature = DanaSignatureUtil.generateSnapB2BScenarioSignature(
    'POST', CREATE_ORDER_PATH, rawBody, process.env.DANA_PRIVATE_KEY, timeStamp
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let res;
  try {
    res = await fetch(DANA_API_BASE_URL + CREATE_ORDER_PATH, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'X-PARTNER-ID': process.env.DANA_CLIENT_ID,
        'CHANNEL-ID': '95221',
        'Content-Type': 'application/json',
        ORIGIN: origin,
        'X-EXTERNAL-ID': crypto.randomUUID(),
        'X-CLIENT-KEY': process.env.DANA_CLIENT_ID,
        'X-TIMESTAMP': timeStamp,
        'X-SIGNATURE': signature,
      },
      body: rawBody,
    });
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch (_) {
    // Non-JSON (e.g. the sandbox 502 HTML page) — surface a clear gateway error.
    const err = new Error('DANA payment gateway returned a non-JSON response');
    err.status = res.status;
    err.rawText = text.slice(0, 300);
    throw err;
  }

  // Log the full response until the VA/QRIS field mapping is confirmed live.
  console.log(`[DANA native ${methodKey}] response:`, JSON.stringify(body));
  return normalizePaymentResponse(body, methodKey, validUpTo);
}

module.exports = {
  dana,
  createOrder,
  createRedirectOrder,
  createNativePaymentOrder,
  queryPaymentStatus,
  PAY_METHOD_MAP,
};
