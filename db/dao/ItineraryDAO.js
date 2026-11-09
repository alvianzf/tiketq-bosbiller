const { prisma } = require("../index");

class ItineraryDAO {
  async createItinerary({ fullName, phone, email, startDate, endDate, notes, items }) {
    const list = Array.isArray(items) ? items : [];
    const totalSales = list.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

    return prisma.itinerary.create({
      data: {
        fullName,
        phone,
        email,
        startDate,
        endDate,
        notes,
        status: "PENDING_REVIEW",
        items: {
          create: list.map((item) => ({
            serviceType: item.serviceType,
            label: item.label,
            price: parseFloat(item.price) || 0,
          })),
        },
        transaction: {
          create: {
            serviceType: "ITINERARY",
            bookingCode: `ITN-${Date.now()}`,
            email,
            basePrice: totalSales,
            serviceFee: 0,
            totalSales,
            status: "PENDING",
            payment_status: false,
          },
        },
      },
      include: { items: true, transaction: true },
    });
  }

  async getItineraryById(id) {
    return prisma.itinerary.findUnique({ where: { id: parseInt(id) }, include: { items: true, transaction: true } });
  }

  async getAllItineraries() {
    return prisma.itinerary.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });
  }

  async updateItineraryStatus(id, status) {
    return prisma.itinerary.update({ where: { id: parseInt(id) }, data: { status } });
  }
}

module.exports = new ItineraryDAO();
