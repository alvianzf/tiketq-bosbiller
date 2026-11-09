const { prisma } = require("../index");

class HotelDAO {
  async getAllHotels({ location, available } = {}) {
    const where = {};
    if (location) where.location = { contains: location, mode: "insensitive" };
    if (available !== undefined) where.available = available === true || available === "true";
    return prisma.hotel.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async getHotelById(id) {
    return prisma.hotel.findUnique({ where: { id: parseInt(id) } });
  }

  async createHotel({ name, location, description, pricePerNight, amenities, photos }) {
    return prisma.hotel.create({
      data: {
        name,
        location,
        description,
        pricePerNight: parseFloat(pricePerNight),
        amenities: amenities ?? [],
        photos: photos ?? [],
        available: true,
      },
    });
  }

  async updateHotel(id, { name, location, description, pricePerNight, amenities, photos, available }) {
    const data = {};
    if (name !== undefined) data.name = name;
    if (location !== undefined) data.location = location;
    if (description !== undefined) data.description = description;
    if (pricePerNight !== undefined) data.pricePerNight = parseFloat(pricePerNight);
    if (amenities !== undefined) data.amenities = amenities;
    if (photos !== undefined) data.photos = photos;
    if (available !== undefined) data.available = available === true || available === "true";
    return prisma.hotel.update({ where: { id: parseInt(id) }, data });
  }

  async deleteHotel(id) {
    return prisma.hotel.delete({ where: { id: parseInt(id) } });
  }

  async createBooking({ hotelId, checkIn, checkOut, guests, fullName, phone, email }) {
    const hotel = await this.getHotelById(hotelId);
    const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000));
    const totalSales = hotel ? parseFloat(hotel.pricePerNight) * nights : 0;

    return prisma.hotelBooking.create({
      data: {
        hotelId: parseInt(hotelId),
        checkIn,
        checkOut,
        guests: parseInt(guests) || 1,
        fullName,
        phone,
        email,
        status: "PENDING_REVIEW",
        transaction: {
          create: {
            serviceType: "HOTEL",
            bookingCode: `HTL-${Date.now()}`,
            email,
            basePrice: totalSales,
            serviceFee: 0,
            totalSales,
            status: "PENDING",
            payment_status: false,
          },
        },
      },
      include: { hotel: true, transaction: true },
    });
  }

  async getAllBookings() {
    return prisma.hotelBooking.findMany({ include: { hotel: true }, orderBy: { createdAt: "desc" } });
  }

  async updateBookingStatus(id, status) {
    return prisma.hotelBooking.update({ where: { id: parseInt(id) }, data: { status } });
  }
}

module.exports = new HotelDAO();
