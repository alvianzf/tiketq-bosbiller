const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.use('/api/auth', authMiddleware, require('./api/auth'));

module.exports = router;
