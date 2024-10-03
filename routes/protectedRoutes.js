/**
 * Importing required modules and utilities.
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Mounting the payment API routes at the '/api/payment' path.
 */
router.use('/api/payment', require('./api/payment'));

/**
 * Mounting the flight bookings API routes at the '/api/flight-bookings' path.
 * 
 * @param {Function} authMiddleware - The middleware function to authenticate the user.
 */
router.use('/api/flight-bookings', authMiddleware, require('./api/flight-bookings'));

/**
 * Exporting the router instance to be used in the application.
 */
module.exports = router;
