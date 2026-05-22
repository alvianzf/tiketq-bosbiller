const express = require("express");
const router = express.Router();
const { makeRequest, validateFields } = require("../utils");
const ferryCache = require("../../../../utils/ferryCache");

router.get("/search", async (req, res, next) => {
  const { embarkation, destination, tripdate } = req.query;
  try {
    const requiredFields = ["embarkation", "destination", "tripdate"];
    if (!validateFields(requiredFields, req.query, res)) return;

    // Normalize tripdate from YYYY-MM-DD to YYYYMMDD
    const normalizedDate = tripdate.replace(/-/g, "");

    const cacheKey = `trips:${embarkation}:${destination}:${normalizedDate}`;
    let cachedData = ferryCache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const response = await makeRequest("get", "/Trips/GetTripWeb", {
      embarkation,
      destination,
      tripdate: normalizedDate
    }, null, "core");

    const rawTrips = response.data?.data || response.data || [];
    
    // Enrich trips for Frontend compatibility
    const enrichedTrips = Array.isArray(rawTrips) ? rawTrips.map(trip => {
      return {
        ...trip,
        price: trip.price || 350000,
        currency: trip.currency || "IDR",
        vesselName: trip.vesselName || `Sindo Express ${trip.tripID || trip.id || ""}`,
        availableSeats: trip.availableSeats !== undefined ? trip.availableSeats : (trip.usedSeat !== undefined ? Math.max(100 - trip.usedSeat, 0) : 100)
      };
    }) : [];

    const responsePayload = {
      message: response.data?.message || response.data?.msg || "Trips fetched successfully",
      data: enrichedTrips
    };

    // Cache the enriched trips for 5 minutes (300 seconds)
    ferryCache.set(cacheKey, responsePayload, 300);

    res.json(responsePayload);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
