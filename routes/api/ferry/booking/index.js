const express = require("express");
const router = express.Router();
const ensureToken = require("../../../middleware/ensure-token");
const { makeRequest, validateFields } = require("../utils");
const FerryBookingDAO = require("../../../db/dao/FerryBookingDAO");

router.post("/", ensureToken, async (req, res, next) => {
  try {
    const response = await makeRequest(
      "post",
      "/Agent/Booking/Bookings",
      req.body,
      req.token,
    );

    const bookingData = response.data;

    // Store in DB for admin panel
    if (bookingData && bookingData.bookingNo) {
      // Find or create terminals
      const originTerminal = await FerryBookingDAO.findOrCreateTerminal(
        req.body.originTerminalCode,
        req.body.originTerminalName || req.body.originTerminalCode,
      );
      const destTerminal = await FerryBookingDAO.findOrCreateTerminal(
        req.body.destinationTerminalCode,
        req.body.destinationTerminalName || req.body.destinationTerminalCode,
      );

      await FerryBookingDAO.createBooking({
        bookingNo: bookingData.bookingNo,
        nominal: bookingData.totalPrice?.toString() || "0",
        departureDate: req.body.departureDate,
        returnDate: req.body.returnDate,
        originId: originTerminal.id,
        destinationId: destTerminal.id,
        email: req.body.contactEmail,
        mobile_number: req.body.contactMobileNumber,
        passengers: req.body.passengers || [],
      });
    }

    res.json(bookingData);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/details", ensureToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await makeRequest(
      "post",
      `/Agent/Booking/Bookings/${id}/Details`,
      req.body,
      req.token,
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.post("/submit", ensureToken, async (req, res, next) => {
  const requiredFields = ["id", "emailConfirmation", "remarks"];
  if (!validateFields(requiredFields, req.body, res)) return;

  try {
    const response = await makeRequest(
      "post",
      "/Agent/Booking/Bookings/Submit",
      req.body,
      req.token,
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", ensureToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await makeRequest(
      "get",
      `/Agent/Booking/Bookings/${id}`,
      {},
      req.token,
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/pricing", ensureToken, async (req, res, next) => {
  const { id } = req.params;
  const { searchString, pageIndex = 0, pageSize = 0 } = req.query;
  try {
    const response = await makeRequest(
      "get",
      `/Agent/Booking/Bookings/${id}/Details/WithPricing`,
      {
        "filter.searchString": searchString || null,
        "pagination.pageIndex": pageIndex,
        "pagination.pageSize": pageSize,
      },
      req.token,
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.post("/transfer", ensureToken, async (req, res, next) => {
  try {
    const response = await makeRequest(
      "post",
      "/Agent/Booking/BookingTransfers",
      req.body,
      req.token,
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.get("/transfer/:id", ensureToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await makeRequest(
      "get",
      `/Agent/Booking/BookingTransfers/${id}`,
      {},
      req.token,
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
