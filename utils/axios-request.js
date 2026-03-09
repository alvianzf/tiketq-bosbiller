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
    let errorMessage = "Internal Server Error";

    if (err.code === "ECONNABORTED") {
      errorMessage = "Flight API request timed out";
    } else if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = err.response.status;
      const data = err.response.data;

      if (status === 403) {
        errorMessage =
          "Access Denied by Flight API (Likely IP Whitelisting Issue)";
      } else if (status === 401) {
        errorMessage =
          "Unauthorized access to Flight API. Please check credentials.";
      } else if (status === 404) {
        errorMessage = "Flight API endpoint not found.";
      } else {
        errorMessage =
          data?.message ||
          err.message ||
          `Flight API responded with status ${status}`;
      }
    } else if (err.request) {
      // The request was made but no response was received
      errorMessage =
        "No response received from Flight API. It might be down or blocked.";
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = err.message;
    }

    console.error(`Flight API Error [${FLIGHT_API_URL}]:`, errorMessage);

    const error = new Error(`Flight API Request failed: ${errorMessage}`);
    error.errors = [errorMessage];
    if (err.response && err.response.data) {
      error.details = err.response.data;
      // If the 3rd party returns a more specific error structure, we could add it here
    }

    return Promise.reject(error);
  });
};

module.exports = makeRequest;
