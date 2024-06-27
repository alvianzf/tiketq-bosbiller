const express = require('express');
const apiService = require('../../../services/apiService');

const router = express.Router();

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
