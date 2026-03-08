const express = require("express");
const router = express.Router();
const axios = require("axios");
const ensureToken = require("../../../middleware/ensure-token");
const { validateFields } = require("../utils");

router.get("/search", ensureToken, async (req, res, next) => {
  const { embarkation, destination, tripdate } = req.query;
  try {
    const requiredFields = ["embarkation", "destination", "tripdate"];
    if (!validateFields(requiredFields, req.query, res)) return;

    const response = await axios.get(
      "https://core.test.sindoferry.com.sg/api/Trips/GetTripWeb",
      {
        params: { embarkation, destination, tripdate },
      },
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
