require('dotenv').config();
const axios = require('axios');

// Load environment variables
const username = process.env.API_KEY;
const password = process.env.SECRET_KEY;
const BASE_URL = process.env.BASE_URL;

// Base64 encode the credentials for Basic Authentication
const auth = Buffer.from(`${username}:${password}`).toString('base64');

// Create an Axios instance with Basic Authentication headers
const axiosInstance = axios.create({
    headers: {
        'Authorization': `Basic ${auth}`
    }
});

/**
 * Makes a POST request to the specified BASE_URL with the provided data.
 * This function is designed to handle errors gracefully and return a promise.
 * 
 * @param {Object} [data] - The data to be sent as the request body.
 * @returns {Promise} - The Axios response promise.
 */
const makeRequest = (data = {}) => {
    return axiosInstance.post(BASE_URL, data)
        .catch(err => {
            // Handle error and return a custom error response
            return Promise.reject(new Error(`Request failed: ${err.message || 'Internal Server Error'}`));
        });
};

module.exports = makeRequest;