/**
 * Runs DANA's mandatory "Cancel Order" and "Refund Order" sandbox compliance scenarios.
 * Most negative scenarios are triggered via DANA's documented magic partnerReferenceNo /
 * refundAmount values (see the dashboard checklist); the "success" scenarios reuse a real
 * order created and paid via the sandbox VA tool.
 *
 * Usage: node scripts/dana-cancel-refund-uat-test.js
 */
require('dotenv').config();
const crypto = require('crypto');
const { dana } = require('../services/danaService');

const MERCHANT_ID = process.env.DANA_MERCHANT_ID;
const SANDBOX_TOOLS_EXECUTE_URL = 'https://dashboard-sandbox.dana.id/merchant-portal-app/api/sandbox-tools/execute';

function futureDate(offsetSeconds) {
  const t = new Date(Date.now() + offsetSeconds * 1000);
  const jakarta = new Date(t.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${jakarta.getUTCFullYear()}-${pad(jakarta.getUTCMonth() + 1)}-${pad(jakarta.getUTCDate())}T${pad(jakarta.getUTCHours())}:${pad(jakarta.getUTCMinutes())}:${pad(jakarta.getUTCSeconds())}+07:00`;
}

async function payVirtualAccountSandbox(virtualAccountNo) {
  const res = await fetch(SANDBOX_TOOLS_EXECUTE_URL, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', origin: 'https://dashboard.dana.id' },
    body: JSON.stringify({ urlEndpoint: '/v1.0/transfer-va/payment.htm', requestBody: { virtualAccountNo } }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`sandbox VA payment failed: status=${res.status} body=${body}`);
}

async function createPaidOrder(amountValue) {
  const partnerReferenceNo = crypto.randomUUID();
  const response = await dana.paymentGatewayApi.createOrder({
    partnerReferenceNo,
    merchantId: MERCHANT_ID,
    amount: { value: amountValue, currency: 'IDR' },
    urlParams: [
      { url: 'https://tiketq.com/dana-transaction-status', type: 'PAY_RETURN', isDeeplink: 'Y' },
      { url: 'https://tiketq.com/api/dana-notify-callback', type: 'NOTIFICATION', isDeeplink: 'Y' },
    ],
    validUpTo: futureDate(600),
    additionalInfo: {
      order: { orderTitle: 'TiketQ Cancel/Refund UAT', scenario: 'API', buyer: {} },
      mcc: '5732',
      envInfo: { sourcePlatform: 'IPG', terminalType: 'SYSTEM', orderTerminalType: 'WEB' },
    },
    payOptionDetails: [
      { payMethod: 'VIRTUAL_ACCOUNT', payOption: 'VIRTUAL_ACCOUNT_CIMB', transAmount: { value: amountValue, currency: 'IDR' } },
    ],
  });
  await payVirtualAccountSandbox(response.additionalInfo.paymentCode);
  await new Promise((r) => setTimeout(r, 4000)); // allow the payment to settle before cancel/refund
  return { partnerReferenceNo, referenceNo: response.referenceNo };
}

async function tryCancel(label, req) {
  console.log(`\n[Cancel: ${label}] request:`, JSON.stringify(req));
  try {
    const response = await dana.paymentGatewayApi.cancelOrder(req);
    console.log(`[Cancel: ${label}] response:`, JSON.stringify(response));
  } catch (e) {
    console.log(`[Cancel: ${label}] error status=${e.status}:`, JSON.stringify(e.rawResponse || e.message));
  }
}

async function tryRefund(label, req) {
  console.log(`\n[Refund: ${label}] request:`, JSON.stringify(req));
  try {
    const response = await dana.paymentGatewayApi.refundOrder(req);
    console.log(`[Refund: ${label}] response:`, JSON.stringify(response));
  } catch (e) {
    console.log(`[Refund: ${label}] error status=${e.status}:`, JSON.stringify(e.rawResponse || e.message));
  }
}

async function run() {
  // --- Cancel Order scenarios ---
  const { partnerReferenceNo: cancelSuccessRef } = await createPaidOrder('10000.00');
  await tryCancel('Success (2005700)', {
    originalPartnerReferenceNo: cancelSuccessRef,
    merchantId: MERCHANT_ID,
    reason: 'UAT compliance test',
    amount: { value: '10000.00', currency: 'IDR' },
  });

  const magicCancelCases = [
    ['In Progress (2025700)', '2025700'],
    ['Transaction Not Permitted (4035705)', '4035705'],
    ['Merchant Status Abnormal (4045708)', '4045708'],
    ['Exceed Cancel Window (4035700)', '4035700'],
    ['Not Allowed by Agreement (4035715)', '4035715'],
    ['Insufficient Merchant Balance (4035714)', '4035714'],
    ['Timeout / Internal Server Error (5005701)', '5005701'],
  ];
  for (const [label, refNo] of magicCancelCases) {
    await tryCancel(label, {
      originalPartnerReferenceNo: refNo,
      merchantId: MERCHANT_ID,
      reason: 'UAT compliance test',
      amount: { value: '10000.00', currency: 'IDR' },
    });
  }
  await tryCancel('Transaction Not Found (4045701)', {
    originalPartnerReferenceNo: '12345678',
    merchantId: MERCHANT_ID,
    reason: 'UAT compliance test',
    amount: { value: '10000.00', currency: 'IDR' },
  });

  // --- Refund Order scenarios ---
  const { partnerReferenceNo: refundSuccessRef } = await createPaidOrder('50000.00');
  await tryRefund('Success (2005800)', {
    merchantId: MERCHANT_ID,
    originalPartnerReferenceNo: refundSuccessRef,
    partnerRefundNo: crypto.randomUUID(),
    refundAmount: { value: '50000.00', currency: 'IDR' },
    reason: 'UAT compliance test',
  });

  const magicRefundCases = [
    ['Request In Progress (2025800)', '225800.00'],
    ['Not allowed by agreement (4035815)', '435815.00'],
    ['Insufficient Merchant Balance (4035814)', '435814.00'],
    ['Internal Server Error (5005801)', '505801.00'],
    ['Merchant Status Abnormal (4045808)', '445808.00'],
  ];
  for (const [label, amountValue] of magicRefundCases) {
    await tryRefund(label, {
      merchantId: MERCHANT_ID,
      originalPartnerReferenceNo: refundSuccessRef,
      partnerRefundNo: crypto.randomUUID(),
      refundAmount: { value: amountValue, currency: 'IDR' },
      reason: 'UAT compliance test',
    });
  }

  // Inconsistent Request: same orderId (originalPartnerReferenceNo) + partnerRefundNo used twice with different amount
  const inconsistentPartnerRefundNo = crypto.randomUUID();
  await tryRefund('Inconsistent Request setup call', {
    merchantId: MERCHANT_ID,
    originalPartnerReferenceNo: refundSuccessRef,
    partnerRefundNo: inconsistentPartnerRefundNo,
    refundAmount: { value: '1000.00', currency: 'IDR' },
    reason: 'UAT compliance test',
  });
  await tryRefund('Inconsistent Request (4045818)', {
    merchantId: MERCHANT_ID,
    originalPartnerReferenceNo: refundSuccessRef,
    partnerRefundNo: inconsistentPartnerRefundNo,
    refundAmount: { value: '2000.00', currency: 'IDR' },
    reason: 'UAT compliance test',
  });
}

run().then(() => console.log('\nDone.')).catch((e) => {
  console.error('Script error:', e);
  process.exit(1);
});
