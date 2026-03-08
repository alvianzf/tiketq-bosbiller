const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });
const axios = require("axios");
require("dotenv").config();

/**
 * Middleware to ensure a valid ferry API token is available.
 * Caches the token for 24 hours.
 */
async function ensureToken(req, res, next) {
  let token = cache.get("ferryToken");

  if (!token) {
    const { FERRY_URL, FERRY_USERNAME, FERRY_PASSWORD } = process.env;

    if (!FERRY_URL || !FERRY_USERNAME || !FERRY_PASSWORD) {
      console.warn("Ferry API credentials missing from environment.");
      // For now, we allow next() if you want to skip, but usually we'd error
      // return res.status(500).json({ error: "Ferry API configuration missing" });
    }

    try {
      const response = await axios.post(`${FERRY_URL}/oauth2/token`, {
        name: FERRY_USERNAME,
        password: FERRY_PASSWORD,
      });

      token = response.data;
      cache.set("ferryToken", token);
    } catch (error) {
      console.error("Failed to fetch Ferry Token:", error.message);
      return res
        .status(401)
        .json({ error: "Failed to authenticate with Ferry API" });
    }
  }

  req.token = token;
  next();
}

module.exports = ensureToken;
