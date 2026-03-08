/**
 * This function creates request bodies for airline data.
 * @param {Object} params - The parameters for the request.
 * @returns {Array} - An array of request bodies.
 */
const createRequestBodies = (params) => {
  const { departure, arrival, departureDate, returnDate, adult, child = 0, infant = 0 } = params;
  const airlines = ['LIO', 'GAR', 'CIT', 'SRI', 'TRI', 'TRA', 'PLA'];

  return airlines.map(airline => ({
    f: "search",
    airline,
    departure,
    arrival,
    departureDate,
    returnDate,
    adult,
    child,
    infant
  }));
};

/**
 * This function fetches airline data.
 * @param {Array} requestBodies - The request bodies for the airlines.
 * @returns {Array} - The fetched airline data.
 */
const fetchAirlineData = async (requestBodies) => {
  const makeRequest = require('../../../utils/axios-request');
  const updateLogoURLs = require('../../../utils/update-logo');

  const responses = await Promise.all(requestBodies.map(requestBody => 
    makeRequest(JSON.stringify(requestBody))
  ));

  let data = responses.map(response => response.data.data).filter(item => item !== null && item !== undefined);

  data = updateLogoURLs(data);

  return data;
};

module.exports = {
  createRequestBodies,
  fetchAirlineData
};
