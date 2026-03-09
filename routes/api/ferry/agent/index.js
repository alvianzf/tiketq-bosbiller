const express = require("express");
const router = express.Router();
router.get("/agents", async (req, res, next) => {
  try {
    const response = await makeRequest(
      "get",
      "/agent/agent/Agents",
      {},
      req.token,
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
