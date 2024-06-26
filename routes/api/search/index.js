const express = require('express');
const makeRequest = require('../../../utils/axios-request');
const router = express.Router();

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
        const responses = await Promise.all(requestBodies.map(requestBody => 
            makeRequest(JSON.stringify(requestBody))
        ));

        const data = responses
            .map(response => response.data.data)
            .filter(item => item !== null && item !== undefined);
            
        const returnData = {
            rc: "00",
            msg: "sukses",
            data
        };

        res.send(returnData);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
