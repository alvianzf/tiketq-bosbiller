const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.use('/api/payment', require('./api/payment'));
router.use('/api/flight-bookings', authMiddleware, require('./api/flight-bookings'));

module.exports = router;
