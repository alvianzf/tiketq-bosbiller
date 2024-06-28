const FlightBooking = require('../models/FlightBooking');

class FlightBookingDAO {
  async createBooking(passenger_name, amount, flight_date, flight_carrier, book_date) {
    const newBooking = new FlightBooking({ passenger_name, amount, flight_date, flight_carrier, book_date });
    return await newBooking.save();
  }

  async findAllBookings() {
    return await FlightBooking.find();
  }

  async findBookingById(id) {
    return await FlightBooking.findById(id);
  }

  async updateBookingById(id, updateData) {
    return await FlightBooking.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteBookingById(id) {
    return await FlightBooking.findByIdAndDelete(id);
  }

  async findBookingsByBookNo(book_no) {
    return await FlightBooking.find({ book_no });
  }

  async findBookingsByUsername(username) {
    const regex = new RegExp(username, 'i');
    return await FlightBooking.find({ passenger_username: regex });
  }

  async findBookingsByName(name) {
    const regex = new RegExp(name, 'i');
    return await FlightBooking.find({ passenger_name: regex });
  }

  async findBookingsByPaymentStatus(payment_status) {
    return await FlightBooking.find({ payment_status });
  }

  async findBookingsByAirlines(airlines) {
    const regex = new RegExp(airlines, 'i');
    return await FlightBooking.find({ flight_carrier: regex });
  }

  async findAllBookingsSortedByBookDate() {
    return await FlightBooking.find().sort({ book_date: 1 });
  }
  
  async findAllBookingsSortedByFlightDate() {
    return await FlightBooking.find().sort({ flight_date: 1 });
  }
}

module.exports = new FlightBookingDAO();
