const express = require("express");
const router = express.Router();
const createError = require("http-errors");

/**
 * Domain-based routes
 */
const domains = {
  flight: require("./flight"),
  auth: require("./auth"),
  ferry: require("./ferry"),
  history: require("./history"),
  "car-rental": require("./car-rental"),
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
        "Welcome to the API! Explore the available domains: flight, auth, payment, ferry, car-rental.",
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
