const express = require('express');
const router = express.Router();
const createError = require('http-errors');

// Route imports
const routes = {
  airports: require('./airports'),
  airlines: require('./airlines'),
  search: require('./search'),
  book: require('./book'),
  'book-info': require('./bookinfo'),
  searchAirport: require('./search-airport'),
  auth: require('./auth'),
  payment: require('./payment'),
  bookingData: require('./booking-data'),
  users: require('./users'),
  'search-airport': require('./search-airport')
};

// Route configurations
Object.entries(routes).forEach(([key, value]) => {
  router.use(`/${key}`, value);
});

// Root endpoint
router.get('/', (req, res, next) => {
  try {
    res.json({
      message: "Welcome to the API! Explore the available endpoints for a seamless travel experience.",
      error: null
    });
  } catch (err) {
    next(createError(500, err.message || 'An unexpected error occurred. Please try again later.'));
  }
});

module.exports = router;
