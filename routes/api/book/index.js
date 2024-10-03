const express = require('express');
const apiService = require('../../../services/apiService');
const router = express.Router();
const FlightBookingDAO = require('../../../db/dao/FlightBookingDAO');
const { body, validationResult } = require('express-validator');

/**
 * POST request to book a flight
 * @param {string} origin - The origin of the flight
 * @param {string} destination - The destination of the flight
 * @param {string} departureDate - The departure date of the flight
 * @param {string} mobile_number - The mobile number of the buyer
 * @param {string} name - The name of the buyer
 */
router.post('/', [
  body('origin').notEmpty().withMessage('Origin is required'),
  body('destination').notEmpty().withMessage('Destination is required'),
  body('departureDate').notEmpty().isISO8601().withMessage('Valid departure date is required'),
  body('mobile_number').notEmpty().isMobilePhone().withMessage('Valid mobile number is required'),
  body('name').notEmpty().withMessage('Name is required')
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const requestData = { ...req.body, f: "book" };

  try {
    const result = await apiService.fetchData(requestData);
    const { bookingCode, nominal, flightdetail, buyer } = result.data;
    const { origin, destination, departureDate } = flightdetail[0];
    const { mobile_number, name } = buyer;
    const saveToDb = { bookingCode, nominal, origin, destination, departureDate, mobile_number, name };
    console.log(saveToDb);

    await FlightBookingDAO.createBooking(saveToDb);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
