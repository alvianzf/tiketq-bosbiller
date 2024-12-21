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
      isProduction: process.env.NODE_ENV === 'production',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    const transaction = await snap.createTransaction(transactionDetails);

    return transaction.token;
  } catch (error) {
    const errorMessage = `Failed to create Midtrans token: ${error.message}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

module.exports = createMidtransToken;
