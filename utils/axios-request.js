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

  return axiosInstance.post(FLIGHT_API_URL, data).catch((err) => {
    const errorMessage =
      err.code === "ECONNABORTED"
        ? "Flight API request timed out"
        : err.response?.data?.message || err.message || "Internal Server Error";

    console.error(`Flight API Error [${FLIGHT_API_URL}]:`, errorMessage);
    return Promise.reject(
      new Error(`Flight API Request failed: ${errorMessage}`),
    );
  });
};

module.exports = makeRequest;
