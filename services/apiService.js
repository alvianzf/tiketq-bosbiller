const makeRequest = require('../utils/axios-request');

class ApiService {
  async fetchData(data) {
    try {
      const response = await makeRequest(JSON.stringify(data));
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  }
}

module.exports = new ApiService();
