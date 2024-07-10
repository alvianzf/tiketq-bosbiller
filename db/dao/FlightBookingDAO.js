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
    const regex = new RegExp(airlines, 'i');
    return await FlightBooking.find({ flight_carrier: regex });
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
    const startDate = moment().month(month - 1).startOf('month').toDate();
    const endDate = moment().month(month - 1).endOf('month').toDate();
    return await FlightBooking.find({ book_date: { $gte: startDate, $lte: endDate } });
  }

  async findBookingsThisMonth() {
    const startDate = moment().startOf('month').toDate();
    const endDate = moment().endOf('month').toDate();
    return await FlightBooking.find({ book_date: { $gte: startDate, $lte: endDate } });
  }

  async findBookingsLastMonth() {
    const startDate = moment().subtract(1, 'months').startOf('month').toDate();
    const endDate = moment().subtract(1, 'months').endOf('month').toDate();
    return await FlightBooking.find({ book_date: { $gte: startDate, $lte: endDate } });
  }

  async findBookingByCodeAndUpdatePaymentStatus(bookingCode) {
    const booking = await FlightBooking.findOne({ bookingCode });
    if (booking) {
      booking.payment_status = true;
      await booking.save();
      return booking;
    }
    throw new Error('Booking not found');
  }
}

module.exports = new FlightBookingDAO();