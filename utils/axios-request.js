require('dotenv').config();
const axios = require('axios');

const username = process.env.API_KEY;
const password = process.env.SECRET_KEY;
const BASE_URL = process.env.BASE_URL;

// Base64 encode
const auth = Buffer.from(`${username}:${password}`).toString('base64');

// setup axios instance
const axiosInstance = axios.create({
    headers: {
        'Authorization': `Basic ${auth}`
    }
});

/**
 * Make an Axios request with a dynamic HTTP method.
 * @param {string} method - The HTTP method (e.g., 'get', 'post', 'put', 'delete').
 * @param {string} url - The URL for the request.
 * @param {Object} [data] - The data to be sent as the request body (for methods like POST and PUT).
 * @returns {Promise} - The Axios response promise.
 */
const makeRequest = (data = {}) => {
    try {
      return axiosInstance.post(BASE_URL, data)
    } catch (err) {
      return next(createError(500, err.message || 'Internal Server Error'));
    }
  };

module.exports = makeRequest;