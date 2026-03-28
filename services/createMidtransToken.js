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
    let errorMessage = "Failed to communicate with Midtrans payment service.";
    
    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      errorMessage = "Midtrans authentication failed. Please check the server's Midtrans API keys.";
    } else if (error.message.includes("ETIMEDOUT") || error.message.includes("ENOTFOUND")) {
      errorMessage = "Could not connect to Midtrans. The service might be down or unreachable from this server.";
    } else {
      errorMessage = `Midtrans Error: ${error.message}`;
    }

    console.error(`Midtrans API Error: ${errorMessage}`);
    
    const err = new Error(errorMessage);
    err.status = 502; // Bad Gateway
    err.source = "MidtransAPI";
    throw err;
  }
}

module.exports = createMidtransToken;
