const express = require('express');
const airportService = require('../../../services/searchService');
const client = require('../../../utils/redisClient');

const router = express.Router();

router.get('/:query', async (req, res, next) => {
  const query = req.params.query;
  const cacheKey = `airport_search_${query}`;

  try {
    // Check if data exists in cache
    let cachedData = await client.get(cacheKey);

    if (cachedData) {
      // Return cached data if available
      console.log('Returning cached data for airport search:', query);
      return res.json({ data: JSON.parse(cachedData) });
    } else {
      // Fetch data from service if not cached
      const result = await airportService.searchAirports(query);

      // Cache the result with 30-day expiration
      await client.set(cacheKey, JSON.stringify(result), {
        EX: 30 * 24 * 60 * 60 // Set expiry to 30 days
      });

      res.json({ data: result });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
