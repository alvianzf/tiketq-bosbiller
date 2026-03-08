const { prisma } = require("../index");

class FerryBookingDAO {
  async createBooking(data) {
    const {
      bookingNo,
      nominal,
      departureDate,
      returnDate,
      originId,
      destinationId,
      email,
      mobile_number,
      passengers,
      basePrice,
      serviceFee,
      totalSales,
    } = data;

    return await prisma.ferryBooking.create({
      data: {
        bookingNo,
        nominal,
        basePrice,
        serviceFee,
        totalSales,
        departureDate: departureDate ? new Date(departureDate) : null,
        returnDate: returnDate ? new Date(returnDate) : null,
        originId,
        destinationId,
        email,
        mobile_number,
        status: "PENDING",
        transaction: {
          create: {
            serviceType: "FERRY",
            bookingCode: bookingNo,
            email,
            basePrice,
            serviceFee,
            totalSales,
            status: "PENDING",
            payment_status: false,
          },
        },
        passengers: {
          create: passengers.map((p) => ({
            title: p.title,
            firstName: p.firstName,
            lastName: p.lastName,
            passportNumber: p.passportNumber,
            nationality: p.nationality,
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
          })),
        },
      },
      include: {
        passengers: true,
        origin: true,
        destination: true,
        transaction: true,
      },
    });
  }

  async findBookingsByEmail(email) {
    return await prisma.ferryBooking.findMany({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      include: {
        passengers: true,
        origin: true,
        destination: true,
      },
      orderBy: { book_date: "desc" },
    });
  }

  async findBookingByNo(bookingNo) {
    return await prisma.ferryBooking.findUnique({
      where: { bookingNo },
      include: {
        passengers: true,
        origin: true,
        destination: true,
      },
    });
  }

  async updatePaymentStatusByNo(bookingNo, payment_status) {
    return await prisma.ferryBooking.update({
      where: { bookingNo },
      data: { payment_status, status: payment_status ? "PAID" : "PENDING" },
    });
  }

  async findAllBookings() {
    return await prisma.ferryBooking.findMany({
      include: {
        passengers: true,
        origin: true,
        destination: true,
      },
    });
  }

  async findOrCreateTerminal(code, name, city, country) {
    return await prisma.terminal.upsert({
      where: { code },
      update: { name, city, country },
      create: { code, name, city, country },
    });
  }
}

module.exports = new FerryBookingDAO();
