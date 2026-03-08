const express = require('express');
const apiService = require('../../../services/apiService');
const getRedisClient = require('../../../utils/redisClient');

const router = express.Router();

const CACHE_KEY = 'airports_data';
const PRIORITY_AIRPORTS = ['CGK', 'DPS', 'SUB', 'UPG', 'KNO', 'BPN', 'YIA', 'PLM', 'PKU', 'BTH'];
const CACHE_EXPIRY = 86400;

/**
 * Handles GET request for airports data.
 * 
 * This function first checks if the data is cached in Redis. If it is, it returns the cached data.
 * If not, it fetches the data from the API service, processes it, caches it, and then returns it.
 * 
 * @param {NextFunction} next - The next middleware function in the application's request-response cycle.
 */
router.get('/', async (req, res, next) => {
  try {
    const cachedData = await getCachedData();
    if (cachedData) {
      return res.status(200).send(cachedData);
    }

    const responseData = await fetchAndProcessAirportsData();
    await cacheResponse(CACHE_KEY, responseData);

    res.status(200).send(responseData);
  } catch (error) {
    next(error);
  }
});

/**
 * Retrieves cached data from Redis.
 * 
 * @returns {Object|null} The cached data or null if not found.
 */
async function getCachedData() {
  const client = await getRedisClient();
  const cachedData = await client.get(CACHE_KEY);
  if (cachedData) {
    console.log('Returning cached data');
    return JSON.parse(cachedData);
  }
  return null;
}

/**
 * Fetches airports data from the API and processes it.
 * 
 * @returns {Object} The processed airports data.
 */
async function fetchAndProcessAirportsData() {
  const requestData = { f: "airports" };
  const responseData = await apiService.fetchData(requestData);
  
  responseData.data = sortAirports(responseData.data);
  return responseData;
}

/**
 * Sorts airports based on priority and code.
 * 
 * @param {Array} airports - The array of all airports.
 * @returns {Array} Sorted array of airports.
 */
function sortAirports(airports) {
  const priorityData = [];
  const otherData = [];
  
  airports.forEach(airport => {
    if (PRIORITY_AIRPORTS.includes(airport.code)) {
      priorityData.push(airport);
    } else {
      otherData.push(airport);
    }
  });
  
  priorityData.sort((a, b) => PRIORITY_AIRPORTS.indexOf(a.code) - PRIORITY_AIRPORTS.indexOf(b.code));
  otherData.sort((a, b) => a.code.localeCompare(b.code));
  
  return [...priorityData, ...otherData];
}

/**
 * Caches the response data in Redis with a 24-hour expiry.
 * 
 * @param {String} key - The key under which the data will be cached.
 * @param {Object} data - The data to be cached.
 */
async function cacheResponse(key, data) {
  const client = await getRedisClient();
  await client.set(key, JSON.stringify(data), {
    EX: CACHE_EXPIRY
  });
}

module.exports = router;
