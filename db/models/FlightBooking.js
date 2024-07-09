
const mongoose = require('mongoose');
const toGMT7 = require('../../utils/timezone-convert');

const FlightBookingSchema = new mongoose.Schema({
    bookingCode: { type: String },
    nominal: { type: String },
    departureDate: { type: String },
    origin: { type: String },
    destination: { type: String },
    mobile_number: { type: String },
    name: { type: String },
    book_date: {
      type: Date,
      required: true,
      default: Date.now,
      set: toGMT7
    },
    payment_status: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('FlightBooking', FlightBookingSchema);
