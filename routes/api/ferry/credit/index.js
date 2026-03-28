const express = require("express");
const router = express.Router();
const { makeRequest } = require("../utils");

router.get("/", async (req, res, next) => {
  try {
    const response = await makeRequest("get", "/agent/CreditMonitoring/Agents", {}, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Credit info fetched successfully",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

module.exports = router;
