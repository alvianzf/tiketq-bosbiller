const { request } = require('express');
const makeRequest = require('../../../utils/axios-request');

const router = require('express').Router();

router.post('/', async (req, res, next) => {

    const {airline, departure, arrival, departureDate, returnDate, adult, child = 0, infant = 0} = req.body;

    let requestBody = {
        f: "search",
        airline,
        departure,
        arrival,
        departureDate,
        returnDate,
        adult,
        child,
        infant
    };

    try {
        const response = await makeRequest(JSON.stringify(requestBody));
        return res.send(response.data);
    } catch(err) {
        next(err);
    }
})

module.exports = router;