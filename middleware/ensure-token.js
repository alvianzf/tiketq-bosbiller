const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });
const axios = require("axios");
require("dotenv").config();

const FERRY_URL = process.env.FERRY_URL;
const FERRY_USERNAME = process.env.FERRY_USERNAME;
const FERRY_PASSWORD = process.env.FERRY_PASSWORD;
OAUT2_TOKEN_PATH = `${FERRY_URL}/oauth2/token`;

async function ensureToken(req, res, next) {
  const token = cache.get("ferryToken");

  if (!token) {
    try {
      const response = await axios.post(OAUT2_TOKEN_PATH, {
        name: FERRY_USERNAME,
        password: FERRY_PASSWORD,
      });

      cache.set("ferryToken", response.data, 86400);
      req.token = response.data;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  req.token = token;
  next();
}

module.exports = ensureToken;
