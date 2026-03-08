const { prisma } = require("../index");

class FlightBookingDAO {
  async createBooking(data) {
    const {
      bookingCode,
      nominal,
      origin,
      destination,
      departureDate,
      mobile_number,
      name,
      email,
      passengers,
      basePrice,
      serviceFee,
      totalSales,
    } = data;
    return await prisma.flightBooking.create({
      data: {
        bookingCode,
        nominal,
        origin,
        destination,
        departureDate,
        mobile_number,
        name,
        email,
        basePrice,
        serviceFee,
        totalSales,
        book_date: new Date(),
        passengers: passengers
          ? {
              create: passengers.map((p) => ({
                title: p.title,
                firstName: p.firstName,
                lastName: p.lastName,
                passportNumber: p.passportNumber,
                nationality: p.nationality,
                dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
              })),
            }
          : undefined,
      },
      include: {
        passengers: true,
      },
    });
  }

  async findBookingsByEmail(email) {
    return await prisma.flightBooking.findMany({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      include: {
        passengers: true,
      },
      orderBy: { book_date: "desc" },
    });
  }

  async findAllBookings() {
    return await prisma.flightBooking.findMany();
  }

  async findBookingById(id) {
    return await prisma.flightBooking.findUnique({
      where: { id: parseInt(id) },
    });
  }

  async updateBookingById(id, updateData) {
    return await prisma.flightBooking.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
  }

  async deleteBookingById(id) {
    return await prisma.flightBooking.delete({
      where: { id: parseInt(id) },
    });
  }

  async findBookingsByBookNo(book_no) {
    return await prisma.flightBooking.findMany({
      where: {
        bookingCode: book_no,
      },
    });
  }

  async findBookingsByUsername(username) {
    return await prisma.flightBooking.findMany({
      where: {
        mobile_number: {
          contains: username,
          mode: "insensitive",
        },
      },
    });
  }

  async findBookingsByName(name) {
    return await prisma.flightBooking.findMany({
      where: {
        name: {
          contains: name,
          mode: "insensitive",
        },
      },
    });
  }

  async findBookingsByPaymentStatus(payment_status) {
    return await prisma.flightBooking.findMany({
      where: { payment_status },
    });
  }

  async findAllBookingsSortedByBookDate() {
    return await prisma.flightBooking.findMany({
      orderBy: { book_date: "asc" },
    });
  }

  async findAllBookingsSortedByFlightDate() {
    return await prisma.flightBooking.findMany({
      orderBy: { departureDate: "asc" },
    });
  }

  async updatePaymentStatus(id, payment_status) {
    return await prisma.flightBooking.update({
      where: { id: parseInt(id) },
      data: { payment_status },
    });
  }

  async findBookingByCodeAndUpdatePaymentStatus(bookingCode) {
    const booking = await prisma.flightBooking.findFirst({
      where: { bookingCode },
    });
    if (!booking) {
      throw new Error("Booking not found");
    }
    return await prisma.flightBooking.update({
      where: { id: booking.id },
      data: { payment_status: true },
    });
  }

  async _findByDateRange(startDate, endDate) {
    return await prisma.flightBooking.findMany({
      where: {
        book_date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }
}

module.exports = new FlightBookingDAO();
