const express = require('express');
const router = express.Router();
const createError = require('http-errors');

router.use('/airports', require('./airports'));

router.get('/', (req, res, next) => {
  try {
    res.send({
      data: "/api endpoint, thread carefully",
      error: null
    });
  } catch (err) {
    next(createError(500, err.message || 'Internal Server Error'));
  }
});



module.exports = router;
