
const mongoose = require('mongoose');
const toGMT7 = require('../../utils/timezone-convert');

const FlightBookingSchema = new mongoose.Schema({
  passenger_name: { type: String, required: true },
  amount: { type: Number, required: true },
  flight_date: { type: Date, required: true },
  flight_carrier: { type: String, required: true },
  book_date: {
    type: Date,
    required: true,
    default: Date.now,
    set: toGMT7
  },
  book_no: { type: String, required: true }
  payment_status: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('FlightBooking', FlightBookingSchema);
