const express = require("express");
const router = express.Router();
const rateLimiter = require("../../../middleware/rate-limiter");

// A booking's own email is the only factor guarding this lookup (no login,
// by design — see product UVP), so it's a realistic target for scraping by
// email guessing. Throttle it harder than the general /api limit.
const historyLimiter = rateLimiter({ max: 10, windowMs: 15 * 60 * 1000 });

// Passenger fields never returned by this listing endpoint — identity-theft
// grade PII that isn't needed to recognize "yes, that's my booking" from a
// list. Full passenger detail (still behind its own booking-code lookup) is
// available via /api/flight/bookinfo/:id for a specific booking.
const PASSENGER_SELECT = {
  id: true,
  title: true,
  firstName: true,
  lastName: true,
  cabinClass: true,
  isLapInfant: true,
};

/**
 * GET /api/history?email=...
 * Guest booking history lookup — no authentication required (product UVP:
 * no sign-up to book). Returns a minimized view per booking; see
 * PASSENGER_SELECT above for what's deliberately left out.
 */
router.get("/", historyLimiter, async (req, res, next) => {
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
          include: { passengers: { select: PASSENGER_SELECT } },
        },
        ferryBooking: {
          include: {
            passengers: { select: PASSENGER_SELECT },
            origin: true,
            destination: true,
          },
        },
        carRentalRequest: {
          include: { car: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      flights: transactions
        .filter((t) => t.serviceType === "FLIGHT" && t.flightBooking)
        .map((t) => ({
          ...t.flightBooking,
          transactionStatus: t.status,
          totalSales: t.totalSales,
        })),
      ferries: transactions
        .filter((t) => t.serviceType === "FERRY" && t.ferryBooking)
        .map((t) => ({
          ...t.ferryBooking,
          transactionStatus: t.status,
          totalSales: t.totalSales,
        })),
      cars: transactions
        .filter((t) => t.serviceType === "CAR_RENTAL" && t.carRentalRequest)
        .map((t) => ({
          ...t.carRentalRequest,
          transactionStatus: t.status,
          totalSales: t.totalSales,
        })),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
