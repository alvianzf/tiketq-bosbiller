const axios = require("axios");
require("dotenv").config();

const { FERRY_URL, FERRY_CORE_URL } = process.env;

const apiEndpoints = {
  api: axios.create({ baseURL: FERRY_URL }),
  core: axios.create({ baseURL: FERRY_CORE_URL }),
};

const getFerryToken = require("../../../utils/node-cache");

/**
 * Make a request to Ferry 3rd party API
 * @param {string} method - HTTP method
 * @param {string} url - endpoint path
 * @param {object} data - request body or query params
 * @param {string} token - authorization token
 * @param {string} type - 'api' (default) or 'core'
 */
const makeRequest = async (method, url, data = {}, token, type = "api") => {
  const apiClient = apiEndpoints[type] || apiEndpoints.api;
  
  if (type === "api" && !token) {
    try {
      token = await getFerryToken();
    } catch (err) {
      console.warn("Failed to fetch ferry token automatically:", err.message);
    }
  }

  const config = {
    method,
    url,
    headers: {},
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (method.toLowerCase() === "get") {
    config.params = data;
  } else {
    config.data = data;
  }
  try {
    return await apiClient(config);
  } catch (err) {
    let errorMessage = "An error occurred while connecting to the Ferry service.";

    if (err.response) {
      const status = err.response.status;
      if (status === 403) {
        errorMessage = "Access to the Ferry API was denied. This is likely due to an IP whitelisting restriction on our server. Please contact support.";
      } else if (status === 401) {
        errorMessage = "Authentication with the Ferry API failed. This is a configuration issue on our end.";
      } else {
        errorMessage = err.response.data?.message || err.message || `The Ferry API service responded with status ${status}.`;
      }
    } else if (err.request) {
      errorMessage = "No response was received from the Ferry API. The external service might be down or our connection is being blocked.";
    } else {
      errorMessage = err.message;
    }

    console.error(`Ferry API Error [${url}]:`, errorMessage);

    const error = new Error(errorMessage);
    error.status = err.response ? 502 : 504;
    error.source = "FerryAPI";
    error.errors = [errorMessage];
    
    if (err.response && err.response.data) {
      error.details = err.response.data;
    }

    throw error;
  }
};

const validateFields = (fields, body, res) => {
  for (const field of fields) {
    if (!body[field]) {
      res.status(400).json({ message: `Missing required field: ${field}` });
      return false;
    }
  }
  return true;
};

module.exports = {
  makeRequest,
  validateFields,
  FERRY_URL,
};
