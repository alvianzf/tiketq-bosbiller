const express = require("express");
const axios = require("axios");
const ensureToken = require("../../middleware/ensure-token");
require("dotenv").config();

const router = express.Router();
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
  (error) => Promise.reject(error)
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

// Routes
router.get("/ports", ensureToken, async (req, res, next) => {
  const { id, name, countryId, countryName } = req.body;
  try {
    const response = await makeRequest("get", "/ports", { id, name, countryId, countryName }, req.token);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.get("/sectors", ensureToken, async (req, res, next) => {
  const { id, name, portOrigin, portDestination } = req.body;
  try {
    const response = await makeRequest("get", "/sectors", { id, name, portOrigin, portDestination }, req.token);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.post("/trips/search", ensureToken, async (req, res, next) => {
  try {
    const requiredFields = ["departDate", "departPortOriginId", "departPortDestinationId"];
    if (!validateFields(requiredFields, req.body, res)) return;

    const response = await makeRequest("post", "/trips/search", req.body, req.token);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.post("/booking/reserve", ensureToken, async (req, res, next) => {
  const requiredFields = ["departTripId", "paxs"];
  if (!validateFields(requiredFields, req.body, res)) return;

  try {
    const response = await makeRequest("post", "/trips/book", req.body, req.token);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.post("/booking/confirm", ensureToken, async (req, res, next) => {
  const requiredFields = ["bookingId", "paymentRef"];
  if (!validateFields(requiredFields, req.body, res)) return;

  try {
    const response = await makeRequest("post", "/booking/confirm", req.body, req.token);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.post("/booking/cancel", ensureToken, async (req, res, next) => {
  const requiredFields = ["bookingId"];
  if (!validateFields(requiredFields, req.body, res)) return;

  try {
    const response = await makeRequest("post", "/booking/cancel", req.body, req.token);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.get("/booking/:id", ensureToken, async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Missing required field: id" });
  }

  try {
    const response = await makeRequest("get", `/booking/${id}`, {}, req.token);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
