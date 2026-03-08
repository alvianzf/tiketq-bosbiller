const express = require("express");
const router = express.Router();
const FlightBookingDAO = require("../db/dao/FlightBookingDAO");
const FerryBookingDAO = require("../db/dao/FerryBookingDAO");

/**
 * GET bookings by email for guest history lookup
 */
router.get("/history", async (req, res, next) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const [flightBookings, ferryBookings] = await Promise.all([
      FlightBookingDAO.findBookingsByEmail(email),
      FerryBookingDAO.findBookingsByEmail(email),
    ]);

    res.json({
      flights: flightBookings,
      ferries: ferryBookings,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
