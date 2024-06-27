const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const client = require('../../../utils/redisClient');
const { createRequestBodies, fetchAirlineData } = require('./apiRequestHandler');

router.post('/', async (req, res, next) => {
  const { departure, arrival, departureDate, returnDate, adult, child, infant } = req.body;
  const cacheKey = `${departure}-${arrival}-${departureDate}-${returnDate}-${adult}-${child}-${infant}`;

  try {
    const cachedResponse = await client.get(cacheKey);
    
    if (cachedResponse) {
      return res.json(JSON.parse(cachedResponse));
    }

    const requestBodies = createRequestBodies(req.body);
    const data = await fetchAirlineData(requestBodies);
    
    const returnData = {
      rc: "00",
      msg: "sukses",
      data
    };

    // Cache the result with 30-minute expiration
    await client.set(cacheKey, JSON.stringify(returnData), {
      EX: 1800 // Set expiry to 30 minutes
    });

    res.json(returnData);
  } catch (err) {
    next(createError(500, err.message || 'Internal Server Error'));
  }
});

module.exports = router;
