const express = require('express');
const apiService = require('../../../services/apiService');
const router = express.Router();

router.post('/', async (req, res, next) => {
    const {bookingCode, nominal} = req.body;
    const requestData = {
        f: "payment",
        bookingCode,
        nominal
    }

    try {
        const responseData = await apiService.fetchData(requestData);
        return res.json(responseData);
    } catch(error) {
        next(error);
    }
})

router.get('/', (req, res) => {
    return res.json({
        status: 404,
        message: "Not Found"
    });
})

module.exports = router;