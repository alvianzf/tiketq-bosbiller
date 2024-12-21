const mongoose = require('mongoose');
const toGMT7 = require('../../utils/timezone-convert');

const FlightBookingSchema = new mongoose.Schema({
  bookingCode: { type: String, trim: true },
  nominal: { type: String, trim: true },
  departureDate: { type: String, trim: true },
  origin: { type: String, trim: true },
  destination: { type: String, trim: true },
  mobile_number: { type: String, trim: true },
  name: { type: String, trim: true },
  book_date: {
    type: Date,
    required: true,
    default: Date.now,
    set: toGMT7
  },
  payment_status: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('FlightBooking', FlightBookingSchema);