const express = require("express");
const router = express.Router();
const FlightBookingDAO = require("../../../db/dao/FlightBookingDAO");
const FerryBookingDAO = require("../../../db/dao/FerryBookingDAO");

/**
 * GET bookings by email for guest history lookup
 */
router.get("/history", async (req, res, next) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const { prisma } = require("../../../db");
    const transactions = await prisma.transaction.findMany({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      include: {
        flightBooking: {
          include: { passengers: true },
        },
        ferryBooking: {
          include: {
            passengers: true,
            origin: true,
            destination: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Support legacy format or update FE. Let's return both for compatibility.
    res.json({
      flights: transactions
        .filter((t) => t.serviceType === "FLIGHT")
        .map((t) => t.flightBooking),
      ferries: transactions
        .filter((t) => t.serviceType === "FERRY")
        .map((t) => t.ferryBooking),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
