const express = require('express');
const apiService = require('../../../services/apiService');
const getRedisClient = require('../../../utils/redisClient');

const router = express.Router();

/**
 * Handles GET request for airports data.
 * 
 * This function first checks if the data is cached in Redis. If it is, it returns the cached data.
 * If not, it fetches the data from the API service, sorts it, caches it, and then returns it.
 * 
 * @param {NextFunction} next - The next middleware function in the application's request-response cycle.
 */
router.get('/', async (req, res, next) => {
  const requestData = {
    f: "airports"
  };

  const cacheKey = 'airports_data';

  try {
    const client = await getRedisClient();
    const cachedData = await client.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached data');
      return res.status(200).send(JSON.parse(cachedData));
    }

    const responseData = await apiService.fetchData(requestData);
    
    // Sort the data array based on the "code" property in ascending order
    responseData.data.sort((a, b) => a.code.localeCompare(b.code));

    await cacheResponse(client, cacheKey, responseData);

    res.status(200).send(responseData);
  } catch (error) {
    next(error);
  }
});

/**
 * Caches the response data in Redis with a 24-hour expiry.
 * 
 * @param {Object} client - The Redis client instance.
 * @param {String} key - The key under which the data will be cached.
 * @param {Object} data - The data to be cached.
 */
async function cacheResponse(client, key, data) {
  await client.set(key, JSON.stringify(data), {
    EX: 86400 // Set expiry to 24 hours in seconds
  });
}

module.exports = router;
