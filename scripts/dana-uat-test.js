/**
 * Runs the 5 "Payment Gateway Payment" scenarios from DANA's mandatory sandbox
 * compliance checklist (POST /payment-gateway/v1.0/debit/payment-host-to-host.htm),
 * so DANA's dashboard can auto-verify them from its server-side logs.
 *
 * Usage: node scripts/dana-uat-test.js
 */
require('dotenv').config();
const crypto = require('crypto');
const { dana } = require('../services/danaService');
const { BaseAPI, Configuration, DanaSignatureUtil } = require('dana-node/runtime');

const API_PATH = '/payment-gateway/v1.0/debit/payment-host-to-host.htm';
const BASE_URL = process.env.DANA_API_BASE_URL || 'https://api.sandbox.dana.id';
const MERCHANT_ID = process.env.DANA_MERCHANT_ID;
const PARTNER_ID = process.env.DANA_CLIENT_ID;
const PRIVATE_KEY = process.env.DANA_PRIVATE_KEY;

function refNo() {
  return crypto.randomUUID();
}

function futureDate(offsetSeconds = 1800) {
  const t = new Date(Date.now() + offsetSeconds * 1000);
  const jakarta = new Date(t.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${jakarta.getUTCFullYear()}-${pad(jakarta.getUTCMonth() + 1)}-${pad(jakarta.getUTCDate())}T${pad(jakarta.getUTCHours())}:${pad(jakarta.getUTCMinutes())}:${pad(jakarta.getUTCSeconds())}+07:00`;
}

function baseOrderPayload(partnerReferenceNo, amountValue) {
  return {
    partnerReferenceNo,
    merchantId: MERCHANT_ID,
    amount: { value: amountValue, currency: 'IDR' },
    urlParams: [
      { url: 'https://tiketq.com/dana-transaction-status', type: 'PAY_RETURN', isDeeplink: 'Y' },
      { url: 'https://tiketq.com/api/dana-notify-callback', type: 'NOTIFICATION', isDeeplink: 'Y' },
    ],
    validUpTo: futureDate(1800),
    additionalInfo: {
      order: { orderTitle: 'TiketQ UAT Order', scenario: 'REDIRECT', buyer: {} },
      mcc: '5732',
      envInfo: { sourcePlatform: 'IPG', terminalType: 'SYSTEM', orderTerminalType: 'WEB' },
    },
    payOptionDetails: [
      { payMethod: 'BALANCE', payOption: '', transAmount: { value: amountValue, currency: 'IDR' } },
    ],
  };
}

async function manualRequest(caseName, requestObj, customHeaders = {}) {
  const headers = {
    'X-PARTNER-ID': PARTNER_ID,
    'CHANNEL-ID': '95221',
    'Content-Type': 'application/json',
    ORIGIN: process.env.DANA_ORIGIN || 'https://tiketq.com',
    'X-EXTERNAL-ID': crypto.randomUUID(),
    'X-CLIENT-KEY': PARTNER_ID,
  };

  const timeStamp = customHeaders['X-TIMESTAMP'] === '' ? '' : futureDate(0);
  headers['X-TIMESTAMP'] = timeStamp;

  const requestBody = JSON.stringify(requestObj);
  headers['X-SIGNATURE'] = DanaSignatureUtil.generateSnapB2BScenarioSignature('POST', API_PATH, requestBody, PRIVATE_KEY, timeStamp);

  Object.assign(headers, customHeaders);

  const config = new Configuration({ basePath: BASE_URL });
  const client = new BaseAPI(config);

  console.log(`\n[${caseName}] request:`, JSON.stringify(requestObj));
  try {
    const response = await client.request({ method: 'POST', path: API_PATH, headers, body: requestObj });
    console.log(`[${caseName}] response:`, JSON.stringify(response.body));
    return response;
  } catch (e) {
    console.log(`[${caseName}] error status=${e.status}:`, JSON.stringify(e.rawResponse || e.message));
    throw e;
  }
}

async function run() {
  // 1. Successfully requests Create Order (2005400)
  await (async () => {
    const requestData = baseOrderPayload(refNo(), '1.00');
    try {
      const response = await dana.paymentGatewayApi.createOrder(requestData);
      console.log('\n[CreateOrder success] response:', JSON.stringify(response));
    } catch (e) {
      console.log('\n[CreateOrder success] FAILED:', e.rawResponse || e.message);
    }
  })();

  // 2. Missing or Invalid Format on Any Mandatory Field (4005402) - missing X-TIMESTAMP
  await manualRequest('MissingMandatoryField', baseOrderPayload(refNo(), '15000.00'), { 'X-TIMESTAMP': '' }).catch(() => {});

  // 3. Invalid Field Format (4005401) - amount without decimals
  await manualRequest('InvalidFieldFormat', (() => {
    const p = baseOrderPayload(refNo(), '1500');
    p.payOptionDetails[0].transAmount.value = '1500';
    return p;
  })()).catch(() => {});

  // 4. Inconsistent Request (4045418) - same partnerReferenceNo, different amount
  await (async () => {
    const ref = refNo();
    const first = baseOrderPayload(ref, '100000.00');
    try {
      await dana.paymentGatewayApi.createOrder(first);
    } catch (e) {
      console.log('\n[Inconsistent first call] FAILED:', e.rawResponse || e.message);
      return;
    }
    await new Promise((r) => setTimeout(r, 2000));
    const second = baseOrderPayload(ref, '200000.00');
    try {
      const response = await dana.paymentGatewayApi.createOrder(second);
      console.log('\n[Inconsistent second call] unexpected success:', JSON.stringify(response));
    } catch (e) {
      console.log('\n[Inconsistent second call] response (expected 4045418):', JSON.stringify(e.rawResponse || e.message));
    }
  })();

  // 5. General unauthorized error (Invalid Signature) (4015400)
  await manualRequest('InvalidSignature', baseOrderPayload(refNo(), '15000.00'), { 'X-SIGNATURE': 'invalid_signature' }).catch(() => {});
}

run().then(() => console.log('\nDone.')).catch((e) => {
  console.error('Script error:', e);
  process.exit(1);
});
