const express = require("express");
const router = express.Router();

/**
 * GET /api/history?email=...
 * Guest booking history lookup — no authentication required.
 */
router.get("/", async (req, res, next) => {
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
