const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const getRedisClient = require("../../../utils/redisClient");
const flightRequest = require("../../../utils/axios-request");
const ferryUtils = require("../ferry/utils");
const midtransClient = require("midtrans-client");

/**
 * GET /api/health
 * Comprehensive health check for all internal and external services.
 */
router.get("/", async (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: { status: "unknown" },
      redis: { status: "unknown" },
      flightApi: { status: "unknown" },
      ferryApi: { status: "unknown" },
      midtrans: { status: "unknown" },
    },
  };

  const checks = [];

  // 1. Database Check
  checks.push(
    prisma.$queryRaw`SELECT 1`
      .then(() => { health.services.database = { status: "connected" }; })
      .catch((err) => { 
        health.status = "error";
        health.services.database = { status: "disconnected", error: err.message }; 
      })
  );

  // 2. Redis Check
  checks.push(
    (async () => {
      try {
        const client = await getRedisClient();
        if (client && client.isOpen) {
          const ping = await client.ping();
          health.services.redis = { status: "connected", ping };
        } else {
          throw new Error("Redis client not connected");
        }
      } catch (err) {
        health.status = "degraded";
        health.services.redis = { status: "disconnected", error: err.message };
      }
    })()
  );

  // 3. Flight API Check (Shallow)
  checks.push(
    flightRequest({ f: "airports" })
      .then(() => { health.services.flightApi = { status: "available" }; })
      .catch((err) => {
        health.status = "degraded";
        health.services.flightApi = { status: "unavailable", error: err.message };
      })
  );

  // 4. Ferry API Check (Shallow)
  checks.push(
    ferryUtils.makeRequest("get", "/Agent/Booking/Sectors/Available")
      .then(() => { health.services.ferryApi = { status: "available" }; })
      .catch((err) => {
        health.status = "degraded";
        health.services.ferryApi = { status: "unavailable", error: err.message };
      })
  );

  // 5. Midtrans Check
  checks.push(
    (async () => {
      try {
        const snap = new midtransClient.Snap({
          isProduction: false,
          serverKey: process.env.MIDTRANS_SERVER_KEY || "",
          clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
        });
        // Just check if we can initialize; real status check might needing hitting an endpoint
        health.services.midtrans = { status: "configured" };
      } catch (err) {
        health.services.midtrans = { status: "error", error: err.message };
      }
    })()
  );

  await Promise.all(checks);

  const statusCode = health.status === "error" ? 500 : 200;
  res.status(statusCode).json(health);
});

module.exports = router;
