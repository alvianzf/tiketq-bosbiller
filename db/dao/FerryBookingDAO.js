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

  /**
   * Atomically claim an unpaid ferry booking for settlement. The updateMany
   * guard (payment_status:false) means only the first concurrent caller flips
   * the row; a duplicate webhook delivery sees count 0 and gets null back.
   * Returns the full booking on a successful claim, or null if already
   * paid / not found.
   */
  async claimForPayment(bookingNo) {
    const res = await prisma.ferryBooking.updateMany({
      where: { bookingNo, payment_status: false },
      data: { payment_status: true, status: "PAID", ticketIssued: true },
    });
    if (res.count === 0) return null;

    const booking = await prisma.ferryBooking.findUnique({
      where: { bookingNo },
      include: { passengers: true, origin: true, destination: true, transaction: true },
    });
    if (booking?.transaction) {
      await prisma.transaction.update({
        where: { id: booking.transaction.id },
        data: { payment_status: true, status: "PAID" },
      });
    }
    return booking;
  }

  async updatePaymentStatusByNo(bookingNo, payment_status) {
    return await prisma.ferryBooking.update({
      where: { bookingNo },
      data: {
        payment_status,
        status: payment_status ? "PAID" : "PENDING",
        ticketIssued: payment_status,
        transaction: {
          update: {
            payment_status,
            status: payment_status ? "PAID" : "PENDING"
          }
        }
      },
      include: {
        passengers: true,
        origin: true,
        destination: true,
        transaction: true,
      },
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

  async updatePassengerVoucher(passengerId, voucherCodeId) {
    return await prisma.passenger.update({
      where: { id: passengerId },
      data: { voucherCodeId }
    });
  }
}

module.exports = new FerryBookingDAO();
