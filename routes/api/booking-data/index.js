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

router.delete('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const booking = await FlightBookingDAO.deleteBookingById(id);
        return res.json(booking);
    } catch (err) {
        return next(err);
    }
})

module.exports = router;