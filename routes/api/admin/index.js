const express = require("express");
const router = express.Router();
const { prisma } = require("../../../db/index");

// GET /api/admin/transactions - Get all transactions
router.get("/transactions", async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        flightBooking: {
          include: { passengers: true }
        },
        ferryBooking: {
          include: { passengers: true, origin: true, destination: true }
        },
        carRentalRequest: {
          include: { car: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      message: "Transactions fetched successfully",
      data: transactions
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/stats - Get dashboard statistics
router.get("/stats", async (req, res, next) => {
  try {
    const totalTransactions = await prisma.transaction.count();
    const successfulTransactions = await prisma.transaction.count({
      where: { payment_status: true }
    });
    
    // Sum total sales (using Decimal precision handling if needed, but for now simple agg)
    const transactions = await prisma.transaction.findMany({
      where: { payment_status: true },
      select: { totalSales: true }
    });

    const totalRevenue = transactions.reduce((acc, curr) => acc + Number(curr.totalSales || 0), 0);
    
    const activeCars = await prisma.car.count({
      where: { available: true }
    });

    res.json({
      message: "Stats fetched successfully",
      data: {
        totalTransactions,
        successfulTransactions,
        totalRevenue,
        activeCars,
        growth: "+12.5%" // Mocked for now
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
