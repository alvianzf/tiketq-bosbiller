const express = require("express");
const router = express.Router();
const { makeRequest, validateFields } = require("../utils");

router.get("/search", async (req, res, next) => {
  const { embarkation, destination, tripdate } = req.query;
  try {
    const requiredFields = ["embarkation", "destination", "tripdate"];
    if (!validateFields(requiredFields, req.query, res)) return;

    const response = await makeRequest(
      "get",
      "/Trips/GetTripWeb",
      { embarkation, destination, tripdate }
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
