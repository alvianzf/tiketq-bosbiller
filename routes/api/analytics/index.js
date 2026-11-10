const express = require("express");
const router = express.Router();
const rateLimiter = require("../../../middleware/rate-limiter");
const PageViewDAO = require("../../../db/dao/PageViewDAO");

// Public, unauthenticated by necessity — every anonymous site visitor's
// browser calls this directly. Capped well above real usage (one create +
// one duration beacon per page visited) but far below anything useful for
// spamming the table.
const analyticsLimiter = rateLimiter({ max: 120, windowMs: 60 * 1000 });

// Known checkout-flow steps, keyed by what the FE sends — anything else is
// dropped (not stored) rather than erroring, so a typo or future page never
// 400s a real visitor's browser, it just doesn't show up in a funnel chart.
const FUNNEL_STEPS = new Set([
  "ferry_search", "ferry_list", "ferry_passenger", "ferry_payment", "ferry_success", "ferry_failed",
  "flight_search", "flight_list", "flight_checkout", "flight_payment",
  "flight_payment_success", "flight_payment_failed", "flight_payment_waiting", "flight_eticket",
  "car_list", "car_detail", "car_rent_form",
]);

const isUuid = (v) => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/**
 * POST /api/analytics/pageview
 * Fired once when a tracked page mounts.
 */
router.post("/pageview", analyticsLimiter, async (req, res, next) => {
  try {
    const { id, sessionId, path, referrer, funnelStep } = req.body || {};

    if (!isUuid(id) || typeof sessionId !== "string" || !sessionId || typeof path !== "string" || !path) {
      return res.status(400).json({ error: "Invalid pageview payload" });
    }

    await PageViewDAO.create({
      id,
      sessionId: sessionId.slice(0, 100),
      path: path.slice(0, 300),
      referrer: typeof referrer === "string" ? referrer.slice(0, 300) : null,
      funnelStep: FUNNEL_STEPS.has(funnelStep) ? funnelStep : null,
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/analytics/duration
 * Fired via navigator.sendBeacon when the visitor leaves a tracked page —
 * sendBeacon only supports POST, and only a single best-effort delivery, so
 * this must be fire-and-forget on the client (no response is read).
 */
router.post("/duration", analyticsLimiter, async (req, res, next) => {
  try {
    const { id, durationMs } = req.body || {};

    if (!isUuid(id) || typeof durationMs !== "number" || !Number.isFinite(durationMs)) {
      return res.status(400).json({ error: "Invalid duration payload" });
    }

    // Clamp: a backgrounded/sleeping tab can report a wildly inflated
    // duration; cap at 2 hours so one outlier doesn't skew averages.
    const clamped = Math.max(0, Math.min(durationMs, 2 * 60 * 60 * 1000));
    await PageViewDAO.setDuration(id, Math.round(clamped));

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.FUNNEL_STEPS = FUNNEL_STEPS;
