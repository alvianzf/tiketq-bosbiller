const router = require('express').Router();
const FlightBookingDAO = require('../../../db/dao/FlightBookingDAO');

router.get('/', async (req, res, next) => {
    try {
        const bookingList = await FlightBookingDAO.findAllBookings();

        return res.json(bookingList)

    } catch (err) {
        next(err);
    }
})

module.exports = router;