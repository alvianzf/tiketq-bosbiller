require("dotenv").config();
const axios = require("axios");

// Load environment variables
const username = process.env.API_KEY;
const password = process.env.SECRET_KEY;
const FLIGHT_API_URL = process.env.FLIGHT_API_URL;

if (!FLIGHT_API_URL) {
  console.error(
    "CRITICAL: FLIGHT_API_URL is not defined in environment variables.",
  );
}

// Base64 encode the credentials for Basic Authentication
const auth = Buffer.from(`${username}:${password}`).toString("base64");

// Create an Axios instance with Basic Authentication headers
const axiosInstance = axios.create({
  headers: {
    Authorization: `Basic ${auth}`,
  },
  timeout: 30000, // Added default timeout for safety
});

/**
 * Makes a POST request to the specified FLIGHT_API_URL with the provided data.
 * This function is designed to handle errors gracefully and return a promise.
 *
 * @param {Object} [data] - The data to be sent as the request body.
 * @returns {Promise} - The Axios response promise.
 */
const makeRequest = (data = {}) => {
  if (!FLIGHT_API_URL) {
    return Promise.reject(
      new Error(
        "Flight API URL is not configured. Please check your .env file.",
      ),
    );
  }

  // Ensure we are working with a valid URL
  try {
    new URL(FLIGHT_API_URL);
  } catch (e) {
    return Promise.reject(
      new Error(`Invalid FLIGHT_API_URL configuration: ${FLIGHT_API_URL}`),
    );
  }

  const timestamp = new Date().toISOString();
  let logData = data;
  try {
    if (typeof data === 'string') logData = JSON.parse(data);
  } catch (e) {
    // Keep as string if not JSON
  }
  
  console.log(`[${timestamp}] >>> Outbound Flight API Request [${FLIGHT_API_URL}]:`, JSON.stringify(logData, null, 2));

  return axiosInstance.post(FLIGHT_API_URL, data).catch((err) => {
    let errorMessage = "Internal Server Error";

    if (err.code === "ECONNABORTED") {
      errorMessage =
        "The Flight API service is taking too long to respond. Please try again in a few moments.";
    } else if (err.response) {
      const status = err.response.status;
      if (status === 403) {
        errorMessage =
          "Access to the Flight API was denied. This is usually due to an IP whitelisting restriction on the server. Please contact support.";
      } else if (status === 401) {
        errorMessage =
          "The Flight API credentials appear to be invalid. This is a configuration issue on our end.";
      } else if (status === 404) {
        errorMessage =
          "The Flight API endpoint was not found. The service provider may have changed their API structure.";
      } else {
        errorMessage =
          err.response.data?.message ||
          err.message ||
          `The Flight API service responded with an error (Status: ${status}).`;
      }
    } else if (err.request) {
      errorMessage =
        "No response was received from the Flight API. The service may be temporarily down or our server IP might be blocked.";
    } else {
      errorMessage = err.message;
    }

    console.error(`Flight API Error [${FLIGHT_API_URL}]:`, errorMessage);

    const error = new Error(errorMessage);
    error.status = err.response ? 502 : 504; // 502 Bad Gateway or 504 Gateway Timeout
    error.source = "FlightAPI";
    error.errors = [errorMessage];

    if (err.response && err.response.data) {
      error.details = err.response.data;
    }

    return Promise.reject(error);
  });
};

module.exports = makeRequest;
