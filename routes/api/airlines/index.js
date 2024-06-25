const makeRequest = require('../../../utils/axios-request');

const router = require('express').Router();

router.get('/', async (req, res, next) => {
    const data = {
        f: "airlines"
    }
    try {
        const response = await makeRequest(JSON.stringify(data));

        return res.send(response.data);
    } catch (err) {
        next(err);
    }
})

module.exports = router;