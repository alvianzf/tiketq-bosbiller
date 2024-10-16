const midtransClient = require('midtrans-client');

/**
 * Creates a Midtrans token for a transaction.
 * 
 * @param {Object} transactionDetails - The details of the transaction.
 * @returns {Promise<string>} A promise that resolves with the Midtrans token.
 * @throws {Error} If there's an error creating the token.
 */
async function createMidtransToken(transactionDetails) {
  try {
    const snap = new midtransClient.Snap({
      isProduction: process.env.ENVIRONMENT === 'production',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    const transaction = await snap.createTransaction(transactionDetails);

    return transaction.token;
  } catch (error) {
    console.error('Error creating Midtrans token:', error);
    throw new Error('Failed to create Midtrans token');
  }
}

module.exports = createMidtransToken;
