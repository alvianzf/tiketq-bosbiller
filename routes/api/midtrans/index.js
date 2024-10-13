const express = require('express');
const apiService = require('../../../services/apiService');
const router = express.Router();

/**
 * Handles POST requests to create a Midtrans token.
 * 
 * @param {Request} req - The request object containing transaction details.
 * @param {Response} res - The response object to send the Midtrans token back to the client.
 * @param {NextFunction} next - The next middleware function in the application's request-response cycle.
 */
router.post('/', async (req, res, next) => {
  try {
    const transactionDetails = req.body;
    const midtransToken = await apiService.createMidtransToken(transactionDetails);
    res.json({ token: midtransToken });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

