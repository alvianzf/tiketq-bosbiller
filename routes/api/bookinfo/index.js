const express = require('express');
const apiService = require('../../../services/apiService');
const router = express.Router();

/**
 * Handles GET requests to the root endpoint of bookinfo.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object to send the message back to the client.
 * @param {NextFunction} next - The next middleware function in the application's request-response cycle.
 */
router.get('/', (req, res, next) => {
  res.json({
    message: 'Booking ID required'
  });
});

/**
 * Handles GET requests to fetch booking information by booking code.
 * 
 * @param {string} req.params.id - The booking code to fetch information for.
 * @param {Response} res - The response object to send the booking information back to the client.
 * @param {NextFunction} next - The next middleware function in the application's request-response cycle.
 */
router.get('/:id', async (req, res, next) => {
  const bookingCode = req.params.id;

  try {
    const bookingInfo = await apiService.fetchBookingInfo(bookingCode);
    res.json(bookingInfo);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
