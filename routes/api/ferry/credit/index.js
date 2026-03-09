const express = require("express");
const router = express.Router();
router.get("/", async (req, res, next) => {
  try {
    const response = await makeRequest(
      "get",
      "/agent/CreditMonitoring/Agents",
      {},
      req.token,
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
