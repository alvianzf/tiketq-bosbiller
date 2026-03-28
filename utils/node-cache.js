const NodeCache = require("node-cache");
const axios = require("axios");
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });
require("dotenv").config();

async function getFerryToken() {
  const token = cache.get("ferryToken");
  if (token) {
    return token;
  }

  const { FERRY_URL, FERRY_AGENT_CODE, FERRY_USERNAME, FERRY_PASSWORD } =
    process.env;


  try {
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
      const msg = response.data.exception?.message || "Login failed";
      const error = new Error(`Ferry Login Failed: ${msg}`);
      error.status = 502;
      error.source = "FerryTokenAPI";
      throw error;
    }
  } catch (err) {
    let errorMessage = "Failed to authenticate with the Ferry service.";
    
    if (err.response) {
      if (err.response.status === 403) {
        errorMessage = "Access to the Ferry Login API was denied. This is likely an IP whitelisting issue on our server.";
      } else {
        errorMessage = err.response.data?.exception?.message || err.response.data?.message || err.message;
      }
    } else if (err.request) {
      errorMessage = "No response received from the Ferry service during login. It might be down or blocked.";
    } else {
      errorMessage = err.message;
    }

    const error = new Error(errorMessage);
    error.status = err.response ? 502 : 504;
    error.source = "FerryTokenAPI";
    throw error;
  }
}

module.exports = getFerryToken;
