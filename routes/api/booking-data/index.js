const express = require('express');
const FlightBookingDAO = require('../../../db/dao/FlightBookingDAO');

const router = express.Router();

/**
 * Handles GET requests to fetch all flight bookings.
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object to send the booking list back to the client.
 * @param {NextFunction} next - The next middleware function in the application's request-response cycle.
 */
router.get('/', async (req, res, next) => {
    try {
        const bookingList = await FlightBookingDAO.findAllBookings();
        return res.json(bookingList);
    } catch (err) {
        next(err);
    }
});

/**
 * Handles DELETE requests to delete a flight booking by its ID.
 * 
 * @param {Request} req - The request object containing the booking ID in the URL parameters.
 * @param {Response} res - The response object to send the deleted booking back to the client.
 * @param {NextFunction} next - The next middleware function in the application's request-response cycle.
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const booking = await FlightBookingDAO.deleteBookingById(id);
        return res.json(booking);
    } catch (err) {
        return next(err);
    }
});

module.exports = router;