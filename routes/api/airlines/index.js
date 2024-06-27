const express = require('express');
const apiService = require('../../../services/apiService');
const client = require('../../../utils/redisClient');

const router = express.Router();

router.get('/', async (req, res, next) => {
  const requestData = {
    f: "airlines"
  };

  const cacheKey = 'airlines_data';

  try {
    let cachedData = await client.get(cacheKey);
    
    if (cachedData) {
      console.log('Returning cached data');
      return res.send(JSON.parse(cachedData));
    } else {
      const responseData = await apiService.fetchData(requestData);
      
      await client.set(cacheKey, JSON.stringify(responseData), {
        EX: 24 * 60 * 60 // Set expiry to 24 hours
      });
      
      res.send(responseData);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
