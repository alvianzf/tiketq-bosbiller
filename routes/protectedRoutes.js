const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.use('/api/payment', authMiddleware, require('./api/payment'));

module.exports = router;
