const express = require('express');
const apiService = require('../../../services/apiService');
const router = express.Router();
const FlightBookingDAO = require('../../../db/dao/FlightBookingDAO');

/**
 * POST request to book a flight
 * @param {string} bookingCode - The booking code of the flight
 * @param {number} nominal - The nominal value of the booking
 * @param {string} origin - The origin of the flight
 * @param {string} destination - The destination of the flight
 * @param {string} departureDate - The departure date of the flight
 * @param {string} mobile_number - The mobile number of the buyer
 * @param {string} name - The name of the buyer
 */
router.post('/', async (req, res, next) => {
  const requestData = { ...req.body, f: "book" };

  try {
    const result = await apiService.fetchData(requestData);
    const { bookingCode?, nominal } = result.data;
    const { origin, destination, departureDate } = result.data.flightdetail[0];
    const { mobile_number, name } = result.data.buyer;
    const saveToDb = { bookingCode, nominal, origin, destination, departureDate, mobile_number, name };
    console.log(saveToDb);

    await FlightBookingDAO.createBooking(saveToDb);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
