const express = require('express');
const apiService = require('../../../services/apiService');
const FlightBookingDAO = require('../../../db/dao/FlightBookingDAO');
const router = express.Router();

/**
 * Handles POST requests for processing flight booking payments.
 * 
 * This function processes payment for a flight booking by sending a request to the API service.
 * It updates the payment status of the booking in the database upon successful payment.
 * 
 * @param {Request} req - The request object containing the booking code and nominal in the body.
 * @param {Response} res - The response object to send the payment response back to the client.
 * @param {NextFunction} next - The next middleware function in the application's request-response cycle.
 */
router.post('/', async (req, res, next) => {
    const {bookingCode, nominal} = req.body;
    const requestData = {
        f: "payment",
        bookingCode,
        nominal
    };
    
    try {
        const responseData = await apiService.fetchData(requestData);
        if(responseData === "") {
            return res.status(400).json({status: 400, message: "Network error, please retry", bookingCode, nominal});
        } else {
            const paid = await FlightBookingDAO.findBookingByCodeAndUpdatePaymentStatus(bookingCode);
            if(paid) {
                return res.status(200).json({status: 200, message: "Payment successful", bookingCode, nominal});
            } else {
                return res.status(404).json({status: 404, message: "Booking not found", bookingCode, nominal});
            }
        }
    } catch(error) {
        next(error);
    }
})

/**
 * Handles GET requests for the payment endpoint.
 * 
 * This function returns a 404 status with a message indicating that the requested resource is not found.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object to send the response back to the client.
 */
router.get('/', (req, res) => {
    return res.status(404).json({
        status: 404,
        message: "Not Found"
    });
})

module.exports = router;