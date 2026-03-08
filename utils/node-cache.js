const NodeCache = require("node-cache");
const axios = require("axios");
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });
require("dotenv").config();
const FERRY_URL = process.env.FERRY_URL;
async function getFerryToken() {
  const token = cache.get("ferryToken");
  if (token) {
    return token;
  }

  const { FERRY_URL, FERRY_AGENT_CODE, FERRY_USERNAME, FERRY_PASSWORD } =
    process.env;

  const response = await axios.post(`${FERRY_URL}/agent/Agent/Login`, {
    agentCode: FERRY_AGENT_CODE,
    username: FERRY_USERNAME,
    password: FERRY_PASSWORD,
    rememberMe: true,
  });

  if (response.data.status === "Ok") {
    const tokenData = response.data.data.access_token;
    cache.set("ferryToken", tokenData, response.data.data.expires_in || 86400);
    return tokenData;
  } else {
    throw new Error(response.data.exception?.message || "Login failed");
  }
}

module.exports = getFerryToken;
