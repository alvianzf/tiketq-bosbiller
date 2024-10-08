/**
 * This module sets up an Express router to handle GET requests for searching airports.
 * It utilizes Redis for caching search results to improve performance.
 * 
 * @module routes/api/search-airport/index
 * @requires express
 * @requires ../../../services/searchService
 * @requires ../../../utils/redisClient
 */

const express = require('express');
const airportService = require('../../../services/searchService');
const getRedisClient = require('../../../utils/redisClient');

const router = express.Router();

/**
 * Handles GET requests for searching airports.
 * 
 * @param {string} query - The search query for airports.
 * @returns {Promise} A promise that resolves to the search result.
 */
router.get('/:query', async (req, res, next) => {
  const query = req.params.query;
  const cacheKey = `airport_search_${query}`;

  try {
    // Check if data exists in cache
    const client = await getRedisClient();
    let cachedData = await client.get(cacheKey);

    if (cachedData) {
      // Return cached data if available
      console.log('Returning cached data for airport search:', query);
      return res.json(JSON.parse(cachedData));
    } else {
      // Fetch data from service if not cached
      const result = await airportService.searchAirports(query);

      // Cache the result with 30-day expiration
      await client.set(cacheKey, JSON.stringify(result), {
        EX: 30 * 24 * 60 * 60 // Set expiry to 30 days
      });

      res.json(result);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
