const makeRequest = require('../../../utils/axios-request');

const router = require('express').Router();

router.post('/', async (req, res, next) => {
    let requestData = req.body;
    requestData.f = "book"
    try {
        const result = makeRequest(JSON.stringify(requestData));

        return res.send(result.data);
    } catch (error) {
        next(error);
    }
})

module.exports = router;