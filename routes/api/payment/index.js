const express = require('express');
const apiService = require('../../../services/apiService');
const FlightBookingDAO = require('../../../db/dao/FlightBookingDAO');
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
        if(responseData == "") {
            return res.status(400).json({status: 400, message: "Network error, please retry", bookingCode, nominal});
        } else {
            const paid = await FlightBookingDAO.findBookingByCodeAndUpdatePaymentStatus(bookingCode);
            return res.json(responseData);
        }
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