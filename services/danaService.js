const crypto = require('crypto');
const Dana = require('dana-node').default;
const { DanaSignatureUtil } = require('dana-node/runtime');

const DANA_API_BASE_URL = process.env.DANA_API_BASE_URL || 'https://api.sandbox.dana.id';
const CREATE_ORDER_PATH = '/payment-gateway/v1.0/debit/payment-host-to-host.htm';

// Native payment methods → DANA payMethod/payOption enums. QRIS + 4 VA banks.
const PAY_METHOD_MAP = {
  QRIS: { payMethod: 'NETWORK_PAY', payOption: 'NETWORK_PAY_PG_QRIS' },
  BCA: { payMethod: 'VIRTUAL_ACCOUNT', payOption: 'VIRTUAL_ACCOUNT_BCA' },
  BNI: { payMethod: 'VIRTUAL_ACCOUNT', payOption: 'VIRTUAL_ACCOUNT_BNI' },
  BRI: { payMethod: 'VIRTUAL_ACCOUNT', payOption: 'VIRTUAL_ACCOUNT_BRI' },
  MANDIRI: { payMethod: 'VIRTUAL_ACCOUNT', payOption: 'VIRTUAL_ACCOUNT_MANDIRI' },
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
  const isQris = methodKey === 'QRIS';
  return {
    method: methodKey,
    kind: isQris ? 'QRIS' : 'VA',
    // For QRIS this is the QR payload string; for VA this is the VA number.
    paymentCode: ai.paymentCode || vaInfo.virtualAccountCode || null,
    qrContent: isQris ? (ai.paymentCode || ai.qrContent || null) : null,
    vaNumber: isQris ? null : (vaInfo.virtualAccountCode || ai.paymentCode || null),
    expiryTime: vaInfo.virtualAccountExpiryTime || ai.expiryTime || fallbackExpiry,
    referenceNo: body.referenceNo || null,
    partnerReferenceNo: body.partnerReferenceNo || null,
    responseCode: body.responseCode,
    responseMessage: body.responseMessage,
    raw: body,
  };
}

/**
 * Create a native DANA payment (host-to-host) for a booking and return the
 * normalized VA/QRIS instructions. `methodKey` is one of QRIS|BCA|BNI|BRI|MANDIRI.
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
    externalStoreId: process.env.DANA_STORE_ID || 'TIKETQ01',
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
  PAY_METHOD_MAP,
};
