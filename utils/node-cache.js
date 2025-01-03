const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });
require('dotenv').config();
const FERRY_URL = process.env.FERRY_URL;
const OAUT2_TOKEN_PATH = `${FERRY_URL}/oauth2/token`;
const FERRY_USERNAME = process.env.FERRY_USERNAME;
const FERRY_PASSWORD = process.env.FERRY_PASSWORD;

async function getFerryToken() {
  const token = cache.get('ferryToken');
  if (token) {
    return token;
  }

  const response = await axios.post(OAUT2_TOKEN_PATH, {
    name: FERRY_USERNAME,
    password: FERRY_PASSWORD,
    grant_type: 'password'
  });

  cache.set('ferryToken', response.data, 86400);
  return response.data;
}

module.exports = getFerryToken;