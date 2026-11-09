const express = require("express");
const router = express.Router();
const HotelDAO = require("../../../db/dao/HotelDAO");

// GET /api/hotels  — list all (supports ?location=Batam&available=true)
router.get("/", async (req, res, next) => {
  try {
    const hotels = await HotelDAO.getAllHotels(req.query);
    res.json({ message: "Hotels fetched successfully", data: hotels });
  } catch (err) {
    next(err);
  }
});

// GET /api/hotels/:id
router.get("/:id", async (req, res, next) => {
  try {
    const hotel = await HotelDAO.getHotelById(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found." });
    res.json({ message: "Hotel fetched successfully", data: hotel });
  } catch (err) {
    next(err);
  }
});

// POST /api/hotels  — create hotel (admin)
router.post("/", async (req, res, next) => {
  try {
    const { name, location, pricePerNight } = req.body;
    if (!name || !location || !pricePerNight) {
      return res.status(400).json({ message: "name, location, and pricePerNight are required." });
    }
    const hotel = await HotelDAO.createHotel(req.body);
    res.status(201).json({ message: "Hotel created successfully", data: hotel });
  } catch (err) {
    next(err);
  }
});

// PUT /api/hotels/:id
router.put("/:id", async (req, res, next) => {
  try {
    const hotel = await HotelDAO.updateHotel(req.params.id, req.body);
    res.json({ message: "Hotel updated successfully", data: hotel });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/hotels/:id
router.delete("/:id", async (req, res, next) => {
  try {
    await HotelDAO.deleteHotel(req.params.id);
    res.json({ message: "Hotel deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// POST /api/hotels/:id/book
router.post("/:id/book", async (req, res, next) => {
  try {
    const { checkIn, checkOut, guests, fullName, phone, email } = req.body;
    if (!checkIn || !checkOut || !fullName || !phone || !email) {
      return res.status(400).json({ status: 400, message: "Missing required fields." });
    }
    const booking = await HotelDAO.createBooking({
      hotelId: req.params.id,
      checkIn,
      checkOut,
      guests,
      fullName,
      phone,
      email,
    });
    res.status(201).json({
      status: 201,
      message: "Hotel booking request received. Our team will contact you shortly.",
      data: booking,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/hotels/bookings/all  — admin: list all requests
router.get("/bookings/all", async (req, res, next) => {
  try {
    const bookings = await HotelDAO.getAllBookings();
    res.json({ status: 200, data: bookings });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/hotels/bookings/:id/status
router.patch("/bookings/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ status: 400, message: "status is required." });
    const updated = await HotelDAO.updateBookingStatus(req.params.id, status);
    res.json({ status: 200, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
