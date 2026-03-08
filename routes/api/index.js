const express = require("express");
const router = express.Router();
const createError = require("http-errors");

/**
 * Domain-based routes
 */
const domains = {
  flight: require("./flight"),
  auth: require("./auth"),
  payment: require("./payment"),
  ferry: require("./ferry"),
};

/**
 * Domain configurations
 */
Object.entries(domains).forEach(([key, value]) => {
  router.use(`/${key}`, value);
});

/**
 * Root endpoint
 */
router.get("/", (req, res, next) => {
  try {
    res.json({
      message:
        "Welcome to the API! Explore the available domains: flight, auth, payment, ferry.",
      error: null,
    });
  } catch (err) {
    next(
      createError(
        500,
        err.message || "An unexpected error occurred. Please try again later.",
      ),
    );
  }
});

module.exports = router;
