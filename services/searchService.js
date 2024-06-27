const airportList = require('../constants/airportList');
const { getAsync, setAsync } = require('../utils/redisClient');

async function searchAirports(query) {
  const lowerCaseQuery = query.toLowerCase();
  const cacheKey = `airport_search_${lowerCaseQuery}`;

  try {
    let cachedData = await getAsync(cacheKey);

    if (cachedData) {
      console.log('Returning cached data for airport search:', lowerCaseQuery);
      return JSON.parse(cachedData);
    } else {
      const result = airportList.filter(airport =>
        airport.code.toLowerCase().includes(lowerCaseQuery) ||
        airport.name.toLowerCase().includes(lowerCaseQuery)
      );

      await setAsync(cacheKey, JSON.stringify(result), 'EX', 24 * 60 * 60);

      return result;
    }
  } catch (error) {
    console.error('Error while caching airport search:', error);
    return airportList.filter(airport =>
      airport.code.toLowerCase().includes(lowerCaseQuery) ||
      airport.name.toLowerCase().includes(lowerCaseQuery)
    );
  }
}

module.exports = {
  searchAirports
};