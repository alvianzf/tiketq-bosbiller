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
      // Return just the data array as requested
      if (response && response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      // Preserve status and source if they exist
      if (!error.status) error.status = 502;
      if (!error.source) error.source = "FlightAPI";
      throw error;
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
      if (!error.status) error.status = 502;
      if (!error.source) error.source = "FlightAPI";
      throw error;
    }
  }

  /**
   * Makes a request to the API with the provided data.
   * 
   * @param {object} data - Request data.
   * @returns {object} Response.
   */
  async makeRequestWithData(data) {
    // Just return the result or let error bubble from utilities
    return makeRequest(JSON.stringify(data));
  }
}

module.exports = new ApiService();