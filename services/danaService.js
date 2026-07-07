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

module.exports = { dana, createOrder };
