const express = require("express");
const router = express.Router();
const { makeRequest, validateFields } = require("../utils");

router.get("/search", async (req, res, next) => {
  const { embarkation, destination, tripdate } = req.query;
  try {
    const requiredFields = ["embarkation", "destination", "tripdate"];
    if (!validateFields(requiredFields, req.query, res)) return;

    const response = await makeRequest("get", "/Trips/GetTripWeb", { embarkation, destination, tripdate }, null, "core");
    res.json({
      message: response.data?.message || response.data?.msg || "Trips fetched successfully",
      data: response.data?.data || response.data
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
