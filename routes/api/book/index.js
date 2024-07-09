const express = require('express');
const apiService = require('../../../services/apiService');
const router = express.Router();
const FlightBookingDAO = require('../../../db/dao/FlightBookingDAO');

router.post('/', async (req, res, next) => {
  const requestData = req.body;
  requestData.f = "book";

  try {
    const result = await apiService.fetchData(requestData);
    const { bookingCode, nominal } = result.data;
    const { origin, destination, departureDate } = result.data.flightdetail[0];
    const { mobile_number, name } = result.data.buyer;
    const saveToDb = { bookingCode, nominal, origin, destination, departureDate, mobile_number, name };
    console.log(saveToDb);

    const saveBooking = await FlightBookingDAO.createBooking(saveToDb);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
