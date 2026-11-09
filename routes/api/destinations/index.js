const express = require("express");
const router = express.Router();
const DestinationDAO = require("../../../db/dao/DestinationDAO");

// GET /api/destinations — list all (supports ?area=Nongsa&category=Beach&tags=beach,family&available=true)
router.get("/", async (req, res, next) => {
  try {
    const destinations = await DestinationDAO.getAllDestinations(req.query);
    res.json({ message: "Destinations fetched successfully", data: destinations });
  } catch (err) {
    next(err);
  }
});

// GET /api/destinations/:id
router.get("/:id", async (req, res, next) => {
  try {
    const destination = await DestinationDAO.getDestinationById(req.params.id);
    if (!destination) return res.status(404).json({ message: "Destination not found." });
    res.json({ message: "Destination fetched successfully", data: destination });
  } catch (err) {
    next(err);
  }
});

// POST /api/destinations — create (admin)
router.post("/", async (req, res, next) => {
  try {
    const { name, area } = req.body;
    if (!name || !area) {
      return res.status(400).json({ message: "name and area are required." });
    }
    const destination = await DestinationDAO.createDestination(req.body);
    res.status(201).json({ message: "Destination created successfully", data: destination });
  } catch (err) {
    next(err);
  }
});

// PUT /api/destinations/:id
router.put("/:id", async (req, res, next) => {
  try {
    const destination = await DestinationDAO.updateDestination(req.params.id, req.body);
    res.json({ message: "Destination updated successfully", data: destination });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/destinations/:id
router.delete("/:id", async (req, res, next) => {
  try {
    await DestinationDAO.deleteDestination(req.params.id);
    res.json({ message: "Destination deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
