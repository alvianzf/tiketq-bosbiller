const express = require('express');
const router = express.Router();
const createError = require('http-errors');

// Route imports
const airportsRouter = require('./airports');
const airlinesRouter = require('./airlines');
const searchRouter = require('./search');
const bookRouter = require('./book');
const bookInfoRouter = require('./bookinfo');
const searchAirportRouter = require('./search-airport');

// Route configurations
router.use('/airports', airportsRouter);
router.use('/airlines', airlinesRouter);
router.use('/search', searchRouter);
router.use('/book', bookRouter);
router.use('/book-info', bookInfoRouter);
router.use('/search-airport', searchAirportRouter);

// Root endpoint
router.get('/', (req, res, next) => {
  try {
    res.json({
      data: "/api endpoint, tread carefully",
      error: null
    });
  } catch (err) {
    next(createError(500, err.message || 'Internal Server Error'));
  }
});

module.exports = router;
