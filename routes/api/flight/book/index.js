const express = require("express");
const apiService = require("../../../../services/apiService");
const FlightBookingDAO = require("../../../../db/dao/FlightBookingDAO");
const router = express.Router();

router.post("/", async (req, res, next) => {
  const requestData = req.body;
  const {
    origin,
    destination,
    departureDate,
    mobile_number,
    name,
    passengers,
  } = requestData;

  requestData.f = "book";

  try {
    const result = await apiService.fetchData(requestData);

    // Store in DB if booking was successful and we have a booking code
    if (result && result.bookingCode) {
      await FlightBookingDAO.createBooking({
        bookingCode: result.bookingCode,
        nominal: result.nominal || "0",
        origin,
        destination,
        departureDate,
        mobile_number,
        name,
        passengers,
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
