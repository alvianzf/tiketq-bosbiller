const { prisma } = require("../index");
const DestinationDAO = require("./DestinationDAO");

class ItineraryDAO {
  // items: [{ destinationId?, serviceType, label?, price?, order }]. When
  // destinationId is set, label/price/duration/travelGap are snapshotted from
  // the catalog Destination so a later edit there doesn't rewrite saved plans.
  async createItinerary({ fullName, phone, email, startDate, endDate, durationLabel, interests, notes, items }) {
    const list = Array.isArray(items) ? items : [];

    const resolved = await Promise.all(
      list.map(async (item, index) => {
        if (item.destinationId) {
          const dest = await DestinationDAO.getDestinationById(item.destinationId);
          if (!dest) throw new Error(`Destination ${item.destinationId} not found`);
          return {
            destinationId: dest.id,
            serviceType: "DESTINATION",
            label: dest.name,
            price: dest.price,
            order: item.order ?? index,
            durationMinutes: dest.minStayMinutes,
            travelGapMinutes: dest.travelGapMinutes,
          };
        }
        return {
          serviceType: item.serviceType,
          label: item.label,
          price: parseFloat(item.price) || 0,
          order: item.order ?? index,
          durationMinutes: item.durationMinutes ?? null,
          travelGapMinutes: item.travelGapMinutes ?? null,
        };
      }),
    );

    const totalSales = resolved.reduce((sum, item) => sum + Number(item.price || 0), 0);

    return prisma.itinerary.create({
      data: {
        fullName,
        phone,
        email,
        startDate,
        endDate,
        durationLabel,
        interests: interests ?? [],
        notes,
        status: "PENDING_REVIEW",
        items: { create: resolved },
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
