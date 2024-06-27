const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const { getAsync, setAsync } = require('../../../utils/redisClient');
const { createRequestBodies, fetchAirlineData } = require('../apiRequestHandler');

router.post('/', async (req, res, next) => {
  const { departure, arrival, departureDate, returnDate, adult, child, infant } = req.body;
  const cacheKey = `${departure}-${arrival}-${departureDate}-${returnDate}-${adult}-${child}-${infant}`;

  try {
    const cachedResponse = await getAsync(cacheKey);
    
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

    await setAsync(cacheKey, JSON.stringify(returnData), 'EX', 3600);

    res.json(returnData);
  } catch (err) {
    next(createError(500, err.message || 'Internal Server Error'));
  }
});

module.exports = router;
