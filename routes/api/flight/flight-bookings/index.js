const express = require('express');
const router = express.Router();
const FlightBookingDAO = require('../../../db/dao/FlightBookingDAO');

/**
 * Handles the creation of a new flight booking.
 * 
 * This function processes the creation of a new flight booking by extracting required information from the request body,
 * attempting to create the booking in the database, and sending a response based on the outcome.
 * 
 * @param {NextFunction} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
router.post('/', async (req, res) => {
  const { passenger_name, amount, flight_date, flight_carrier, book_date } = req.body;
  try {
    const newBooking = await FlightBookingDAO.createBooking(passenger_name, amount, flight_date, flight_carrier, book_date);
    res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking', message: 'An error occurred while processing your request.' });
  }
});

/**
 * Retrieves all flight bookings sorted by book date.
 * 
 * This function fetches all flight bookings from the database, sorted by the date of booking, and sends them in the response.
 * 
 * @param {NextFunction} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
router.get('/', async (req, res) => {
  try {
    const bookings = await FlightBookingDAO.findAllBookingsSortedByBookDate();
    res.status(200).json({ message: 'Bookings retrieved successfully', bookings: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve bookings', message: 'An error occurred while fetching bookings.' });
  }
});

/**
 * Retrieves a single flight booking by its ID.
 * 
 * This function attempts to find a flight booking by its ID and sends the booking details in the response if found.
 * 
 * @param {NextFunction} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
router.get('/:id', async (req, res) => {
  try {
    const booking = await FlightBookingDAO.findBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found', message: 'The requested booking does not exist.' });
    }
    res.status(200).json({ message: 'Booking retrieved successfully', booking: booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve booking', message: 'An error occurred while fetching the booking.' });
  }
});

/**
 * Retrieves flight bookings by book number.
 * 
 * This function fetches all flight bookings that match the provided book number and sends them in the response.
 * 
 * @param {NextFunction} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
router.get('/bookNo/:bookNo', async (req, res) => {
  const { bookNo } = req.params;
  try {
    const bookings = await FlightBookingDAO.findBookingsByBookNo(bookNo);
    res.status(200).json({ message: 'Bookings by book number retrieved successfully', bookings: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve bookings by book number', message: 'An error occurred while fetching bookings by book number.' });
  }
});

/**
 * Retrieves flight bookings by passenger name.
 * 
 * This function fetches all flight bookings that match the provided passenger name and sends them in the response.
 * 
 * @param {NextFunction} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
router.get('/name/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const bookings = await FlightBookingDAO.findBookingsByName(name);
    res.status(200).json({ message: 'Bookings by name retrieved successfully', bookings: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve bookings by name', message: 'An error occurred while fetching bookings by name.' });
  }
});

/**
 * Retrieves flight bookings by payment status.
 * 
 * This function fetches all flight bookings that match the provided payment status and sends them in the response.
 * 
 * @param {NextFunction} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
router.get('/paymentStatus/:status', async (req, res) => {
  const { status } = req.params;
  if (status !== 'true' && status !== 'false') {
    return res.status(400).json({ error: 'Invalid payment status value', message: 'Please use true or false for payment status.' });
  }
  try {
    const paymentStatus = status === 'true'; // Convert string to boolean
    const bookings = await FlightBookingDAO.findBookingsByPaymentStatus(paymentStatus);
    res.status(200).json({ message: 'Bookings by payment status retrieved successfully', bookings: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve bookings by payment status', message: 'An error occurred while fetching bookings by payment status.' });
  }
});

/**
 * Retrieves flight bookings by airlines.
 * 
 * This function fetches all flight bookings that match the provided airlines and sends them in the response.
 * 
 * @param {NextFunction} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
router.get('/airlines/:airlines', async (req, res) => {
  const { airlines } = req.params;
  try {
    const bookings = await FlightBookingDAO.findBookingsByAirlines(airlines);
    res.status(200).json({ message: 'Bookings by airlines retrieved successfully', bookings: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve bookings by airlines', message: 'An error occurred while fetching bookings by airlines.' });
  }
});

/**
 * Retrieves all flight bookings sorted by book date.
 * 
 * This function fetches all flight bookings from the database, sorted by the date of booking, and sends them in the response.
 * 
 * @param {NextFunction} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
router.get('/sortedByBookDate', async (req, res) => {
  try {
    const bookings = await FlightBookingDAO.findAllBookingsSortedByBookDate();
    res.status(200).json({ message: 'Bookings sorted by book date retrieved successfully', bookings: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve bookings sorted by book date', message: 'An error occurred while fetching bookings sorted by book date.' });
  }
});

/**
 * Retrieves all flight bookings sorted by flight date.
 * 
 * This function fetches all flight bookings from the database, sorted by the date of the flight, and sends them in the response.
 * 
 * @param {NextFunction} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
router.get('/sortedByFlightDate', async (req, res) => {
  try {
    const bookings = await FlightBookingDAO.findAllBookingsSortedByFlightDate();
    res.status(200).json({ message: 'Bookings sorted by flight date retrieved successfully', bookings: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve bookings sorted by flight date', message: 'An error occurred while fetching bookings sorted by flight date.' });
  }
});

module.exports = router;
