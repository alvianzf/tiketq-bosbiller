/**
 * Importing required modules and utilities.
 */
const mongoose = require('mongoose');
const toGMT7 = require('../../utils/timezone-convert');

/**
 * Defining the schema for FlightBooking model.
 * 
 * @type {mongoose.Schema} - The schema definition for FlightBooking.
 */
const FlightBookingSchema = new mongoose.Schema({
    /**
     * Booking code for the flight.
     * @type {String}
     */
    bookingCode: { type: String },
    /**
     * Nominal value of the booking.
     * @type {String}
     */
    nominal: { type: String },
    /**
     * Date of departure.
     * @type {String}
     */
    departureDate: { type: String },
    /**
     * Origin of the flight.
     * @type {String}
     */
    origin: { type: String },
    /**
     * Destination of the flight.
     * @type {String}
     */
    destination: { type: String },
    /**
     * Mobile number of the passenger.
     * @type {String}
     */
    mobile_number: { type: String },
    /**
     * Name of the passenger.
     * @type {String}
     */
    name: { type: String },
    /**
     * Date of booking.
     * 
     * @type {Date}
     * @required
     * @default {Date.now} - The current date and time.
     * @set {toGMT7} - Converts the date to GMT+7 timezone.
     */
    book_date: {
      type: Date,
      required: true,
      default: Date.now,
      set: toGMT7
    },
    /**
     * Status of the payment.
     * 
     * @type {Boolean}
     * @default {false} - Indicates payment status as false by default.
     */
    payment_status: { type: Boolean, default: false }
}, { timestamps: true });

/**
 * Exporting the FlightBooking model.
 * 
 * @type {mongoose.Model} - The FlightBooking model.
 */
module.exports = mongoose.model('FlightBooking', FlightBookingSchema);
