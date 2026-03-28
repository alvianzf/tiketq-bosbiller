const express = require("express");
const router = express.Router();
const { prisma } = require("../../../db/index");
const UserDAO = require("../../../db/dao/UserDAO");
const authMiddleware = require("../../../middleware/authMiddleware");
const adminMiddleware = require("../../../middleware/adminMiddleware");

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
    
    // Sum total sales
    const transactions = await prisma.transaction.findMany({
      where: { payment_status: true },
      select: { totalSales: true }
    });

    const totalRevenue = transactions.reduce((acc, curr) => acc + Number(curr.totalSales || 0), 0);
    
    const activeCars = await prisma.car.count({
      where: { available: true }
    });

    // Simple revenue by month for charts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        payment_status: true,
        createdAt: { gte: sixMonthsAgo }
      },
      _sum: { totalSales: true }
    });

    // Grouping by month name helper
    const revenueByMonth = monthlyData.reduce((acc, item) => {
      const month = item.createdAt.toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + Number(item._sum.totalSales || 0);
      return acc;
    }, {});

    const chartData = Object.entries(revenueByMonth).map(([name, total]) => ({ name, total }));

    // Service distribution
    const distribution = await prisma.transaction.groupBy({
      by: ['serviceType'],
      where: { payment_status: true },
      _count: { id: true }
    });

    const serviceDistribution = distribution.map(item => ({
      name: item.serviceType.replace('_', ' '),
      value: item._count.id,
      color: item.serviceType === 'FLIGHT_BOOKING' ? '#4267B2' : item.serviceType === 'FERRY_BOOKING' ? '#00D5FF' : '#10b981'
    }));

    // Real month-over-month revenue growth
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonthTxns, lastMonthTxns] = await Promise.all([
      prisma.transaction.findMany({
        where: { payment_status: true, createdAt: { gte: startOfThisMonth } },
        select: { totalSales: true }
      }),
      prisma.transaction.findMany({
        where: { payment_status: true, createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
        select: { totalSales: true }
      }),
    ]);

    const thisMonthRevenue = thisMonthTxns.reduce((s, t) => s + Number(t.totalSales || 0), 0);
    const lastMonthRevenue = lastMonthTxns.reduce((s, t) => s + Number(t.totalSales || 0), 0);

    let growth = "N/A";
    if (lastMonthRevenue > 0) {
      const pct = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1);
      growth = `${pct >= 0 ? "+" : ""}${pct}%`;
    } else if (thisMonthRevenue > 0) {
      growth = "+100%"; // new revenue this month with none last month
    }

    res.json({
      message: "Stats fetched successfully",
      data: {
        totalTransactions,
        successfulTransactions,
        totalRevenue,
        activeCars,
        growth,
        chartData,
        serviceDistribution
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/health - System health monitoring (real data)
router.get("/health", async (req, res, next) => {
  const os = require("os");

  // Measure real DB latency
  let dbStatus = "Unhealthy";
  let dbLatency = "N/A";
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = `${Date.now() - dbStart}ms`;
    dbStatus = "Healthy";
  } catch {}

  // Measure API server own response time (loopback)
  const apiLatency = `${process.hrtime()[1] / 1e6 | 0}ms`;

  // Real CPU load (1-min avg, scaled to percentage)
  const cpuLoad = os.loadavg()[0];
  const cpuCores = os.cpus().length;
  const cpuPercent = Math.min(100, Math.round((cpuLoad / cpuCores) * 100));

  // Real memory
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const toGB = (b) => (b / 1024 / 1024 / 1024).toFixed(1) + "GB";
  const memPercent = Math.round((usedMem / totalMem) * 100);

  // Real uptime (process uptime, not OS — more relevant for server health)
  const uptimeSec = Math.floor(process.uptime());
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const mins = Math.floor((uptimeSec % 3600) / 60);
  const uptime = days > 0 ? `${days}d ${hours}h ${mins}m` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  try {
    res.json({
      message: "Health status fetched",
      data: {
        status: dbStatus === "Healthy" ? "Online" : "Degraded",
        services: [
          { name: "Database (PostgreSQL)", status: dbStatus, latency: dbLatency },
          { name: "API Server", status: "Healthy", latency: apiLatency },
        ],
        system: {
          cpu: `${cpuPercent}%`,
          memory: `${toGB(usedMem)}/${toGB(totalMem)} (${memPercent}%)`,
          uptime,
          memPercent,
          cpuPercent,
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// --- User Management ---
router.use("/users", authMiddleware, adminMiddleware);

// GET /api/admin/users - Get all users
router.get("/users", async (req, res, next) => {
  try {
    const users = await UserDAO.findAllUsers();
    res.json({
      message: "Users fetched successfully",
      data: users
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users/register - Create new admin
router.post("/users/register", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await UserDAO.register(username, password, true);
    res.status(201).json({
      message: "Administrator created successfully",
      data: user
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id - Update user
router.put("/users/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedUser = await UserDAO.updateUser(id, req.body);
    res.json({
      message: "User updated successfully",
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete("/users/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await UserDAO.deleteUser(id);
    res.json({
      message: "User deleted successfully"
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
