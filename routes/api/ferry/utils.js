const axios = require("axios");
require("dotenv").config();

const { FERRY_URL } = process.env;

const apiClient = axios.create({
  baseURL: FERRY_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    if (config.token) {
      config.headers.Authorization = `Bearer ${config.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const getFerryToken = require("../../../utils/node-cache");

const makeRequest = async (method, url, data = {}, token) => {
  if (!token) {
    try {
      token = await getFerryToken();
    } catch (err) {
      console.warn("Failed to fetch ferry token automatically:", err.message);
    }
  }

  const config = {
    method,
    url,
    token,
  };
  if (method === "get") {
    config.params = data;
  } else {
    config.data = data;
  }
  try {
    return await apiClient(config);
  } catch (err) {
    let errorMessage = "Ferry API Request failed";

    if (err.response) {
      const status = err.response.status;
      if (status === 403) {
        errorMessage =
          "Access Denied by Ferry API (Likely IP Whitelisting Issue)";
      } else if (status === 401) {
        errorMessage =
          "Unauthorized access to Ferry API. Please check credentials.";
      } else {
        errorMessage =
          err.response.data?.message ||
          err.message ||
          `Ferry API responded with status ${status}`;
      }
    } else if (err.request) {
      errorMessage =
        "No response received from Ferry API. It might be down or blocked.";
    } else {
      errorMessage = err.message;
    }

    console.error(`Ferry API Error [${url}]:`, errorMessage);

    const error = new Error(errorMessage);
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
