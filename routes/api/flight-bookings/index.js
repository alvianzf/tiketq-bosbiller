const express = require('express');
const router = express.Router();
const FlightBookingDAO = require('../../../db/dao/FlightBookingDAO');

router.post('/', async (req, res) => {
  const { passenger_name, amount, flight_date, flight_carrier, book_date } = req.body;
  try {
    const newBooking = await FlightBookingDAO.createBooking(passenger_name, amount, flight_date, flight_carrier, book_date);
    res.status(201).json(newBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

router.get('/', async (req, res) => {
  try {
    const bookings = await FlightBookingDAO.findAllBookingsSortedByBookDate();
    res.status(200).json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve bookings' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const booking = await FlightBookingDAO.findBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(200).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve booking' });
  }
});

router.get('/bookNo/:bookNo', async (req, res) => {
  const { bookNo } = req.params;
  try {
    const bookings = await FlightBookingDAO.findBookingsByBookNo(bookNo);
    res.status(200).json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve bookings by book number' });
  }
});

router.get('/name/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const bookings = await FlightBookingDAO.findBookingsByName(name);
    res.status(200).json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve bookings by name' });
  }
});

router.get('/paymentStatus/:status', async (req, res) => {
  const { status } = req.params;
  if (status !== 'true' && status !== 'false') {
    return res.status(400).json({ error: 'Invalid payment status value. Use true or false.' });
  }
  try {
    const paymentStatus = status === 'true'; // Convert string to boolean
    const bookings = await FlightBookingDAO.findBookingsByPaymentStatus(paymentStatus);
    res.status(200).json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve bookings by payment status' });
  }
});

router.get('/airlines/:airlines', async (req, res) => {
  const { airlines } = req.params;
  try {
    const bookings = await FlightBookingDAO.findBookingsByAirlines(airlines);
    res.status(200).json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve bookings by airlines' });
  }
});

router.get('/sortedByBookDate', async (req, res) => {
  try {
    const bookings = await FlightBookingDAO.findAllBookingsSortedByBookDate();
    res.status(200).json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve bookings sorted by book date' });
  }
});

router.get('/sortedByFlightDate', async (req, res) => {
  try {
    const bookings = await FlightBookingDAO.findAllBookingsSortedByFlightDate();
    res.status(200).json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve bookings sorted by flight date' });
  }
});

module.exports = router;
