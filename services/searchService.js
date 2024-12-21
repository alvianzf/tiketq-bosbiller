/**
 * Importing required modules and utilities.
 */
const getRedisClient = require('../utils/redisClient');
const apiService = require('./apiService');

/**
 * Searches for airports based on the provided query and returns the results.
 * 
 * @param {String} query - The search query to filter airports.
 * @returns {Promise<Array>} - A promise that resolves to an array of airport objects that match the query.
 */
async function searchAirports(query) {
  const lowerCaseQuery = query.toLowerCase();
  const cacheKey = `airport_search_${lowerCaseQuery}`;

  try {
    const client = await getRedisClient();
    const cachedData = await client.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached data for airport search:', lowerCaseQuery);
      return JSON.parse(cachedData);
    } else {
      const airportList = await cachedList();
      const result = airportList.data.filter(airport =>
        [airport.code, airport.name, airport.bandara].some(field => field.toLowerCase().includes(lowerCaseQuery))
      );
      await client.set(cacheKey, JSON.stringify(result), 'EX', 24 * 60 * 60);
      return result;
    }
  } catch (error) {
    console.error('Error while caching airport search:', error);
    throw error;
  }
}

/**
 * Fetches or retrieves cached list of airports.
 * 
 * @returns {Promise<Object>} - A promise that resolves to an object containing the list of airports.
 */
async function cachedList() {
  try {
    const client = await getRedisClient();
    const cachedData = await client.get('airports_data');
    if (cachedData) {
      return JSON.parse(cachedData);
    } else {
      const requestData = { f: "airports" };
      const responseData = await apiService.fetchData(requestData);
      await client.set('airports_data', JSON.stringify(responseData), 'EX', 24 * 60 * 60);
      return responseData;
    }
  } catch (error) {
    console.error('Error while fetching or caching airport list:', error);
    throw error;
  }
}

/**
 * Exporting the searchAirports function to be used in other modules.
 */
module.exports = {
  searchAirports
};