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
  if (Array.isArray(data)) {
    return data.map(updateLogoURLs);
  } else if (data !== null && typeof data === 'object') {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        if (typeof data[key] === 'string') {
          data[key] = data[key].replace(/http:\/\/117\.102\.64\.238:1212\/assets\/maskapai/g, ASSET_BASE_URL);
        } else if (typeof data[key] === 'object') {
          data[key] = updateLogoURLs(data[key]);
        }
      }
    }
  }
  return data;
};

module.exports = updateLogoURLs;