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

const makeRequest = async (method, url, data = {}, token) => {
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
  return apiClient(config);
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
