const makeRequest = require('../utils/axios-request');

class ApiService {
  async fetchData(data) {
    try {
      const response = await this.makeRequestWithData(data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  }

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
