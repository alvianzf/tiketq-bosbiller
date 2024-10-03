/**
 * This module sets up an Express router for handling GET requests to the /airlines endpoint.
 * It utilizes Redis for caching data to reduce the load on the API service.
 * 
 * @requires express - The Express framework for building web applications.
 * @requires ../../../services/apiService - Service for fetching data from the API.
 * @requires ../../../utils/redisClient - Client for interacting with Redis.
 */

const express = require('express');
const apiService = require('../../../services/apiService');
const client = require('../../../utils/redisClient');

const router = express.Router();

/**
 * Handles GET requests to the /airlines endpoint.
 * 
 * @param {NextFunction} next - The next middleware function in the Express application.
 */
router.get('/', async (req, res, next) => {
  const requestData = {
    f: "airlines"
  };

  const cacheKey = 'airlines_data';

  try {
    const cachedData = await client.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached data');
      return res.send(JSON.parse(cachedData));
    }

    const responseData = await apiService.fetchData(requestData);
    await client.set(cacheKey, JSON.stringify(responseData), {
      EX: 86400 // Set expiry to 24 hours in seconds
    });

    res.send(responseData);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
