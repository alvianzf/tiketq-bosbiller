const express = require("express");
const router = express.Router();
const ActivityDAO = require("../../../db/dao/ActivityDAO");

// GET /api/activities  — list all (supports ?category=GOLF&available=true)
router.get("/", async (req, res, next) => {
  try {
    const activities = await ActivityDAO.getAllActivities(req.query);
    res.json({ message: "Activities fetched successfully", data: activities });
  } catch (err) {
    next(err);
  }
});

// GET /api/activities/categories
router.get("/categories", async (req, res, next) => {
  try {
    const activities = await ActivityDAO.getAllActivities();
    const categories = [...new Set(activities.map((a) => a.category))];
    res.json({ message: "Categories fetched successfully", data: categories });
  } catch (err) {
    next(err);
  }
});

// GET /api/activities/:id
router.get("/:id", async (req, res, next) => {
  try {
    const activity = await ActivityDAO.getActivityById(req.params.id);
    if (!activity) return res.status(404).json({ message: "Activity not found." });
    res.json({ message: "Activity fetched successfully", data: activity });
  } catch (err) {
    next(err);
  }
});

// POST /api/activities  — create activity (admin)
router.post("/", async (req, res, next) => {
  try {
    const { name, category, price } = req.body;
    if (!name || !category || !price) {
      return res.status(400).json({ message: "name, category, and price are required." });
    }
    const activity = await ActivityDAO.createActivity(req.body);
    res.status(201).json({ message: "Activity created successfully", data: activity });
  } catch (err) {
    next(err);
  }
});

// PUT /api/activities/:id
router.put("/:id", async (req, res, next) => {
  try {
    const activity = await ActivityDAO.updateActivity(req.params.id, req.body);
    res.json({ message: "Activity updated successfully", data: activity });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/activities/:id
router.delete("/:id", async (req, res, next) => {
  try {
    await ActivityDAO.deleteActivity(req.params.id);
    res.json({ message: "Activity deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// POST /api/activities/:id/book
router.post("/:id/book", async (req, res, next) => {
  try {
    const { date, participants, fullName, phone, email } = req.body;
    if (!date || !fullName || !phone || !email) {
      return res.status(400).json({ status: 400, message: "Missing required fields." });
    }
    const booking = await ActivityDAO.createBooking({
      activityId: req.params.id,
      date,
      participants,
      fullName,
      phone,
      email,
    });
    res.status(201).json({
      status: 201,
      message: "Activity booking request received. Our team will contact you shortly.",
      data: booking,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/activities/bookings/all — admin: list all requests
router.get("/bookings/all", async (req, res, next) => {
  try {
    const bookings = await ActivityDAO.getAllBookings();
    res.json({ status: 200, data: bookings });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/activities/bookings/:id/status
router.patch("/bookings/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ status: 400, message: "status is required." });
    const updated = await ActivityDAO.updateBookingStatus(req.params.id, status);
    res.json({ status: 200, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
