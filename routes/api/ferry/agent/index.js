const express = require("express");
const router = express.Router();
const { makeRequest } = require("../utils");

router.get("/agents", async (req, res, next) => {
  try {
    const response = await makeRequest("get", "/agent/agent/Agents", {}, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Agents fetched successfully",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

module.exports = router;
