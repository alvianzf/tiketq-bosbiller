/**
 * Drives DANA's 3 "General Payment finish notify" mandatory test scenarios end-to-end:
 * creates a sandbox order with the NOTIFICATION url pointed at our own webhook (passed as
 * argv[2], e.g. an ngrok tunnel), then triggers DANA to call it back.
 *
 * Uses DANA's own documented magic test amounts (see github.com/dana-id/uat-script):
 *   11011.00 -> success notify (latestTransactionStatus 00)
 *   11012.00 -> partner-simulated internal server error
 *   11013.00 -> expired notify (latestTransactionStatus 05), via a short validUpTo
 *
 * Usage: node scripts/dana-notify-uat-test.js https://your-tunnel.example.com
 */
require('dotenv').config();
const crypto = require('crypto');
const { dana } = require('../services/danaService');

const notifyBaseUrl = process.argv[2];
if (!notifyBaseUrl) {
  console.error('Usage: node scripts/dana-notify-uat-test.js <public-notify-base-url>');
  process.exit(1);
}
const notifyUrl = `${notifyBaseUrl.replace(/\/$/, '')}/api/dana-notify-callback`;

const SANDBOX_TOOLS_EXECUTE_URL = 'https://dashboard-sandbox.dana.id/merchant-portal-app/api/sandbox-tools/execute';

function futureDate(offsetSeconds) {
  const t = new Date(Date.now() + offsetSeconds * 1000);
  const jakarta = new Date(t.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${jakarta.getUTCFullYear()}-${pad(jakarta.getUTCMonth() + 1)}-${pad(jakarta.getUTCDate())}T${pad(jakarta.getUTCHours())}:${pad(jakarta.getUTCMinutes())}:${pad(jakarta.getUTCSeconds())}+07:00`;
}

function orderPayload(amountValue, validUpToOffsetSeconds) {
  const partnerReferenceNo = crypto.randomUUID();
  return {
    partnerReferenceNo,
    merchantId: process.env.DANA_MERCHANT_ID,
    amount: { value: amountValue, currency: 'IDR' },
    urlParams: [
      { url: 'https://tiketq.com/dana-transaction-status', type: 'PAY_RETURN', isDeeplink: 'Y' },
      { url: notifyUrl, type: 'NOTIFICATION', isDeeplink: 'Y' },
    ],
    validUpTo: futureDate(validUpToOffsetSeconds),
    additionalInfo: {
      order: { orderTitle: 'TiketQ Notify UAT', scenario: 'API', buyer: {} },
      mcc: '5732',
      envInfo: { sourcePlatform: 'IPG', terminalType: 'SYSTEM', orderTerminalType: 'WEB' },
    },
    payOptionDetails: [
      { payMethod: 'VIRTUAL_ACCOUNT', payOption: 'VIRTUAL_ACCOUNT_CIMB', transAmount: { value: amountValue, currency: 'IDR' } },
    ],
  };
}

async function payVirtualAccountSandbox(virtualAccountNo) {
  const res = await fetch(SANDBOX_TOOLS_EXECUTE_URL, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', origin: 'https://dashboard.dana.id' },
    body: JSON.stringify({ urlEndpoint: '/v1.0/transfer-va/payment.htm', requestBody: { virtualAccountNo } }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`sandbox VA payment failed: status=${res.status} body=${body}`);
  return body;
}

async function runPaidScenario(label, amountValue) {
  console.log(`\n=== ${label} (amount ${amountValue}) ===`);
  const response = await dana.paymentGatewayApi.createOrder(orderPayload(amountValue, 600));
  console.log('createOrder response:', JSON.stringify(response));
  const paymentCode = response?.additionalInfo?.paymentCode;
  if (!paymentCode) throw new Error('No paymentCode in create order response');
  console.log('Paying VA in sandbox:', paymentCode);
  await payVirtualAccountSandbox(paymentCode);
  console.log('VA payment submitted. Watch the server log for the incoming notify call.');
}

async function runExpiredScenario() {
  console.log('\n=== ExpiredNotify (amount 11013.00, validUpTo +135s) ===');
  const response = await dana.paymentGatewayApi.createOrder(orderPayload('11013.00', 135));
  console.log('createOrder response:', JSON.stringify(response));
  console.log('Order created without payment; DANA should send a latestTransactionStatus=05 notify once it expires (~2m15s). Watch the server log.');
}

async function run() {
  await runPaidScenario('TransactionSuccessNotify', '11011.00');
  await new Promise((r) => setTimeout(r, 3000));
  await runPaidScenario('InternalServerErrorNotify', '11012.00');
  await new Promise((r) => setTimeout(r, 3000));
  await runExpiredScenario();
}

run().then(() => console.log('\nAll 3 scenarios triggered.')).catch((e) => {
  console.error('Script error:', e);
  process.exit(1);
});
