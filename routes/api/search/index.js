/**
 * This module handles the API route for searching flights.
 * It utilizes Redis for caching to reduce the load on the airline data fetcher.
 * 
 * @module routes/api/search/index
 */

const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const client = require('../../../utils/redisClient');
const { createRequestBodies, fetchAirlineData } = require('./apiRequestHandler');

/**
 * Handles the POST request to the search API.
 * 
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 * @param {express.NextFunction} next - The Express next function.
 */
router.post('/', async (req, res, next) => {
  const { departure, arrival, departureDate, returnDate, adult, child, infant } = req.body;
  const cacheKey = `${departure}-${arrival}-${departureDate}-${returnDate}-${adult}-${child}-${infant}`;

  try {
    const cachedResponse = await client.get(cacheKey);
    
    if (cachedResponse) {
      return res.json(JSON.parse(cachedResponse));
    }

    const requestBodies = createRequestBodies(req.body);
    const data = await fetchAirlineData(requestBodies);
    
    const returnData = {
      rc: "00",
      msg: "Search successful. Data fetched and cached.",
      data
    };

    // Cache the result with 30-minute expiration
    await client.set(cacheKey, JSON.stringify(returnData), {
      EX: 1800 // Set expiry to 30 minutes
    });

    res.json(returnData);
  } catch (err) {
    next(createError(500, err.message || 'Internal Server Error'));
  }
});

module.exports = router;
