const { request } = require('express');
const makeRequest = require('../../../utils/axios-request');
const router = require('express').Router();

const airlines = ['LIO', 'GAR', 'CIT', 'SRI', 'TRI', "TRA", 'PLA'];

router.post('/', async (req, res, next) => {
    const { departure, arrival, departureDate, returnDate, adult, child = 0, infant = 0 } = req.body;

    const requestBodies = airlines.map(airline => ({
        f: "search",
        airline,
        departure,
        arrival,
        departureDate,
        returnDate,
        adult,
        child,
        infant
    }));

    try {
        // Map over the requestBodies to create an array of Promises
        const responses = await Promise.all(requestBodies.map(requestBody => 
            makeRequest(JSON.stringify(requestBody))
        ));

        // Extract data from each response
        const data = responses.map(response => response.data.data);

        const returnData = {
            rc: "00",
            msg: "sukses",
            data
        }

        return res.send(returnData);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
