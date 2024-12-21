const makeRequest = require('../utils/axios-request');

/**
 * API Service class responsible for making API requests.
 */
class ApiService {
  /**
   * Fetches data from the API.
   * 
   * @param {object} data - Request data.
   * @returns {object} Response data.
   */
  async fetchData(data) {
    try {
      const response = await this.makeRequestWithData(data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  }

  /**
   * Fetches booking information from the API.
   * 
   * @param {string} bookingCode - Booking code.
   * @returns {object} Response data.
   */
  async fetchBookingInfo(bookingCode) {
    try {
      const data = {
        f: "bookInfo",
        bookingCode
      };

      const response = await this.makeRequestWithData(data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch booking info: ${error.message}`);
    }
  }

  /**
   * Makes a request to the API with the provided data.
   * 
   * @param {object} data - Request data.
   * @returns {object} Response.
   */
  async makeRequestWithData(data) {
    try {
      const response = await makeRequest(JSON.stringify(data));
      return response;
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }
}

module.exports = new ApiService();