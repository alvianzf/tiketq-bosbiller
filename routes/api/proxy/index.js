const express = require("express");
const router = express.Router();
const makeRequest = require("../../../utils/axios-request");

/**
 * Public proxy endpoint to forward requests to the Flight API.
 * This is useful for local development to bypass IP whitelisting.
 * URL: /api/proxy/:route
 * body: JSON matching the expected 3rd party API format
 */
router.post("/:route", async (req, res, next) => {
    try {
        const response = await makeRequest(req.body);
        res.json(response.data);
    } catch (error) {
        // Bubble up the 502/504 errors we configured in axios-request
        next(error);
    }
});

// Support GET for simple health checks if needed
router.get("/:route", async (req, res, next) => {
    try {
        const response = await makeRequest(req.query);
        res.json(response.data);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
