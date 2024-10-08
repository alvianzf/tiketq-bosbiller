const express = require('express');
const apiService = require('../../../services/apiService');
const router = express.Router();
const FlightBookingDAO = require('../../../db/dao/FlightBookingDAO');

/**
 * POST request to book a flight
 * @param {string} searchId - The search ID for the flight
 * @param {string} adult - Number of adult passengers
 * @param {string} child - Number of child passengers
 * @param {string} infant - Number of infant passengers
 * @param {Object} buyer - Buyer information
 * @param {Object} passengers - Passenger information
 */
router.post('/', async (req, res, next) => {
  const { searchId, adult, child, infant, buyer, passengers } = req.body;
  const requestData = { 
    searchId, 
    adult, 
    child, 
    infant, 
    buyer, 
    passengers,
    f: "book" 
  };

  try {
    const result = await apiService.fetchData(requestData);
    const { bookingCode, nominal } = result.data;
    const { origin, destination, departureDate } = result.data.flightdetail[0];
    const { mobile_number, email } = buyer;
    const { first_name, last_name } = passengers.adults[0];
    const name = `${first_name} ${last_name}`;
    
    const saveToDb = { 
      bookingCode, 
      nominal, 
      origin, 
      destination, 
      departureDate, 
      mobile_number, 
      email,
      name 
    };
    console.log(saveToDb);

    await FlightBookingDAO.createBooking(saveToDb);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
