/**
 * List of airline codes to update logo URLs for.
 * @type {Array<string>}
 */
const airlines = ['LIO', 'GAR', 'CIT', 'SRI', 'TRI', 'TRA', 'PLA'];

/**
 * Base URL for assets.
 * @type {string}
 */
const ASSET_BASE_URL = 'https://api.tiketq.com/assets/maskapai';

/**
 * Recursively updates logo URLs in the provided data.
 * 
 * @param {any} data - The data to update logo URLs in. Can be an array, object, or string.
 * @returns {any} - The data with updated logo URLs.
 */
const updateLogoURLs = (data) => {
  // If data is an array, recursively update each item in the array
  if (Array.isArray(data)) {
    return data.map(item => updateLogoURLs(item));
  } 
  // If data is an object, iterate through its properties and update any strings that match the old URL
  else if (data !== null && typeof data === 'object') {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // If the value is a string and contains the old URL, replace it with the new URL
        if (typeof data[key] === 'string' && data[key].includes('117.102.64.238:1212/assets/maskapai')) {
          data[key] = data[key].replace('http://117.102.64.238:1212/assets/maskapai', ASSET_BASE_URL);
        } 
        // If the value is an object, recursively update its logo URLs
        else if (typeof data[key] === 'object') {
          data[key] = updateLogoURLs(data[key]);
        }
      }
    }
  }
  return data;
};

module.exports = updateLogoURLs;