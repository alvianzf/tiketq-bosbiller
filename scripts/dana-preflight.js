/**
 * Pre-start sanity check for DANA payment config. Runs automatically before
 * `npm run start` (via the `prestart` script) and fails fast, locally, with no
 * network calls, if DANA credentials are missing or the private key can't sign.
 *
 * For a live end-to-end check against the DANA sandbox (creates real test orders),
 * run `node scripts/dana-uat-test.js` manually instead.
 */
require('dotenv').config();
const { DanaSignatureUtil } = require('dana-node/runtime');

const REQUIRED_VARS = [
  'DANA_MERCHANT_ID',
  'DANA_CLIENT_ID',
  'DANA_CLIENT_SECRET',
  'DANA_PRIVATE_KEY',
  'DANA_API_BASE_URL',
];

function fail(message) {
  console.error(`[dana-preflight] FAILED: ${message}`);
  process.exit(1);
}

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  fail(`missing env vars: ${missing.join(', ')}`);
}

const env = (process.env.DANA_ENV || process.env.ENV || '').trim().toLowerCase();
const isSandbox = env === 'sandbox' || env === '';
if (!isSandbox) {
  if (!process.env.DANA_NOTIFY_URL) {
    // Without this, danaService falls back to DANA_ORIGIN (the FRONTEND domain),
    // so DANA posts Finish Notify to a 404 and paid bookings never fulfill
    // (prod incident 2026-07-23, booking NJUBID). Must be the backend origin,
    // e.g. https://api.tiketq.com — the /api/dana-notify-callback path is appended.
    fail('DANA_NOTIFY_URL must be set in production (backend origin, e.g. https://api.tiketq.com); the fallback points notifies at the frontend, which 404s.');
  }
  if (!process.env.DANA_WEBHOOK_PUBLIC_KEY && !process.env.DANA_WEBHOOK_PUBLIC_KEY_PATH) {
    // Not fatal: without DANA's public key the notify webhook falls back to
    // confirming each notification via queryPayment (see routes/api/dana-notify-callback.js).
    console.warn('[dana-preflight] WARN: DANA_WEBHOOK_PUBLIC_KEY not set; webhook will confirm notifications via queryPayment instead of signature verification.');
  }
}

try {
  const signature = DanaSignatureUtil.generateSnapB2BScenarioSignature(
    'POST',
    '/payment-gateway/v1.0/debit/payment-host-to-host.htm',
    '{}',
    process.env.DANA_PRIVATE_KEY,
    '2020-01-01T00:00:00+07:00',
  );
  if (!signature) {
    fail('DANA_PRIVATE_KEY produced an empty signature');
  }
} catch (error) {
  fail(`DANA_PRIVATE_KEY cannot sign a request: ${error.message}`);
}

console.log('[dana-preflight] OK: DANA config present and private key signs correctly.');
