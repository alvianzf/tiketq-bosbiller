const express = require("express");
const router = express.Router();
const ItineraryDAO = require("../../../db/dao/ItineraryDAO");

// POST /api/itinerary  — submit a custom trip bundle
router.post("/", async (req, res, next) => {
  try {
    const { fullName, phone, email, startDate, items } = req.body;
    if (!fullName || !phone || !email || !startDate || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "fullName, phone, email, startDate, and at least one item are required.",
      });
    }
    const itinerary = await ItineraryDAO.createItinerary(req.body);
    res.status(201).json({
      status: 201,
      message: "Itinerary request received. Our concierge team will confirm availability and reach out.",
      data: itinerary,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/itinerary/:id
router.get("/:id", async (req, res, next) => {
  try {
    const itinerary = await ItineraryDAO.getItineraryById(req.params.id);
    if (!itinerary) return res.status(404).json({ message: "Itinerary not found." });
    res.json({ message: "Itinerary fetched successfully", data: itinerary });
  } catch (err) {
    next(err);
  }
});

// GET /api/itinerary  — admin: list all requests
router.get("/", async (req, res, next) => {
  try {
    const itineraries = await ItineraryDAO.getAllItineraries();
    res.json({ status: 200, data: itineraries });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/itinerary/:id/status
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ status: 400, message: "status is required." });
    const updated = await ItineraryDAO.updateItineraryStatus(req.params.id, status);
    res.json({ status: 200, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
