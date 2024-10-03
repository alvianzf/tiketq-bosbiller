const FlightBooking = require('../models/FlightBooking');
const moment = require('moment');

class FlightBookingDAO {
  async createBooking({ bookingCode, nominal, origin, destination, departureDate, mobile_number, name }) {
    const newBooking = new FlightBooking({
      bookingCode,
      nominal,
      origin,
      destination,
      departureDate,
      mobile_number,
      name,
      book_date: new Date()
    });
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
    return await FlightBooking.find({ bookingCode: book_no });
  }

  async findBookingsByUsername(username) {
    const regex = new RegExp(username, 'i');
    return await FlightBooking.find({ mobile_number: regex });
  }

  async findBookingsByName(name) {
    const regex = new RegExp(name, 'i');
    return await FlightBooking.find({ name: regex });
  }

  async findBookingsByPaymentStatus(payment_status) {
    return await FlightBooking.find({ payment_status });
  }

  async findBookingsByAirlines(airlines) {
    return await this._findByRegex('flight_carrier', airlines);
  }

  async findAllBookingsSortedByBookDate() {
    return await FlightBooking.find().sort({ book_date: 1 });
  }
  
  async findAllBookingsSortedByFlightDate() {
    return await FlightBooking.find().sort({ departureDate: 1 });
  }

  async updatePaymentStatus(id, payment_status) {
    return await FlightBooking.findByIdAndUpdate(id, { payment_status }, { new: true });
  }

  async findBookingsByMonth(month) {
    return await this._findByDateRange(
      moment().month(month - 1).startOf('month').toDate(),
      moment().month(month - 1).endOf('month').toDate()
    );
  }

  async findBookingsThisMonth() {
    return await this._findByDateRange(
      moment().startOf('month').toDate(),
      moment().endOf('month').toDate()
    );
  }

  async findBookingsLastMonth() {
    return await this._findByDateRange(
      moment().subtract(1, 'months').startOf('month').toDate(),
      moment().subtract(1, 'months').endOf('month').toDate()
    );
  }

  async findBookingByCodeAndUpdatePaymentStatus(bookingCode) {
    const booking = await FlightBooking.findOneAndUpdate(
      { bookingCode },
      { payment_status: true },
      { new: true }
    );
    if (!booking) {
      throw new Error('Booking not found');
    }
    return booking;
  }

  async _findByRegex(field, value) {
    const regex = new RegExp(value, 'i');
    return await FlightBooking.find({ [field]: regex });
  }

  async _findByDateRange(startDate, endDate) {
    return await FlightBooking.find({ book_date: { $gte: startDate, $lte: endDate } });
  }
}

module.exports = new FlightBookingDAO();