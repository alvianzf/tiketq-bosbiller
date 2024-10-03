/**
 * Importing required modules and utilities.
 */
const client = require('../utils/redisClient');
const apiService = require('./apiService');

/**
 * Searches for airports based on the provided query and returns the results.
 * 
 * @param {String} query - The search query to filter airports.
 * @returns {Promise<Array>} - A promise that resolves to an array of airport objects that match the query.
 */
async function searchAirports(query) {
  /**
   * Converting the query to lowercase for case-insensitive comparison.
   */
  const lowerCaseQuery = query.toLowerCase();
  /**
   * Constructing the cache key based on the lowercase query.
   */
  const cacheKey = `airport_search_${lowerCaseQuery}`;

  try {
    /**
     * Attempting to retrieve cached data for the search query.
     */
    const cachedData = await client.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached data for airport search:', lowerCaseQuery);
      /**
       * Parsing the cached data and returning it.
       */
      return JSON.parse(cachedData);
    } else {
      /**
       * Fetching the list of airports if no cached data is found.
       */
      const airportList = await cachedList();
      /**
       * Filtering the airport list based on the query.
       */
      const result = airportList.data.filter(airport =>
        airport.code.toLowerCase().includes(lowerCaseQuery) ||
        airport.name.toLowerCase().includes(lowerCaseQuery) ||
        airport.bandara.toLowerCase().includes(lowerCaseQuery)
      );
      /**
       * Caching the filtered result for future queries.
       */
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
    /**
     * Attempting to retrieve cached data for the airport list.
     */
    const cachedData = await client.get('airports_data');
    if (cachedData) {
      /**
       * Parsing the cached data and returning it.
       */
      return JSON.parse(cachedData);
    } else {
      /**
       * Preparing the request data for fetching airport list.
       */
      const requestData = { f: "airports" };
      /**
       * Fetching the airport list from the API.
       */
      const responseData = await apiService.fetchData(requestData);
      /**
       * Caching the fetched airport list for future use.
       */
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
