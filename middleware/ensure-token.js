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
    const { FERRY_URL, FERRY_AGENT_CODE, FERRY_USERNAME, FERRY_PASSWORD } =
      process.env;

    if (!FERRY_URL || !FERRY_AGENT_CODE || !FERRY_USERNAME || !FERRY_PASSWORD) {
      console.warn("Ferry API credentials missing from environment.");
    }

    try {
      const response = await axios.post(`${FERRY_URL}/agent/Agent/Login`, {
        agentCode: FERRY_AGENT_CODE,
        username: FERRY_USERNAME,
        password: FERRY_PASSWORD,
        rememberMe: true,
      });

      if (response.data.status === "Ok") {
        token = response.data.data.access_token;
        cache.set("ferryToken", token, response.data.data.expires_in || 86400);
      } else {
        throw new Error(response.data.exception?.message || "Login failed");
      }
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
