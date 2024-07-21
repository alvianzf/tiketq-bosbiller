const makeRequest = require('../../../utils/axios-request');
const airlines = ['LIO', 'GAR', 'CIT', 'SRI', 'TRI', 'TRA', 'PLA'];

const updateLogoURLs = require('../../../utils/update-logo');

const createRequestBodies = (params) => {
  const { departure, arrival, departureDate, returnDate, adult, child = 0, infant = 0 } = params;

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

const fetchAirlineData = async (requestBodies) => {
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
