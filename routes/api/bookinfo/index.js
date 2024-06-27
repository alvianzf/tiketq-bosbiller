const makeRequest = require('../../../utils/axios-request');
const router = require('express').Router();

router.get('/:id', async (req, res, next) => {
    const bookingCode = req.params.id;

    const requestData = {
        f: "bookInfo",
        bookingCode
    };

    try {
        const response = await makeRequest(JSON.stringify(requestData));
        return res.json(response.data);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
