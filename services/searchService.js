const client = require('../utils/redisClient');
const apiService = require('./apiService');

async function searchAirports(query) {
  const lowerCaseQuery = query.toLowerCase();
  const cacheKey = `airport_search_${lowerCaseQuery}`;

  try {
    let cachedData = await client.get(cacheKey);

    if (cachedData) {
      console.log('Returning cached data for airport search:', lowerCaseQuery);
      return JSON.parse(cachedData);
    } else {
      const airportList = await cachedList();

      const result = airportList.data.filter(airport =>
        airport.code.toLowerCase().includes(lowerCaseQuery) ||
        airport.name.toLowerCase().includes(lowerCaseQuery) ||
        airport.bandara.toLowerCase().includes(lowerCaseQuery)
      );

      await client.set(cacheKey, JSON.stringify(result), 'EX', 24 * 60 * 60);

      return result;
    }
  } catch (error) {
    console.error('Error while caching airport search:', error);
    throw error;
  }
}

async function cachedList() {
  try {
    const cachedData = await client.get('airports_data');

    if (cachedData) {
      return JSON.parse(cachedData);
    } else {
      const requestData = {
        f: "airports"
      };

      const responseData = await apiService.fetchData(requestData);

      await client.set('airports_data', JSON.stringify(responseData), 'EX', 24 * 60 * 60);

      return responseData;
    }
  } catch (error) {
    console.error('Error while fetching or caching airport list:', error);
    throw error;
  }
}

module.exports = {
  searchAirports
};
