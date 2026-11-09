const { prisma } = require("../index");

class DestinationDAO {
  async getAllDestinations({ area, category, tags, available } = {}) {
    const where = {};
    if (area) where.area = { equals: area, mode: "insensitive" };
    if (category && category !== "all") where.category = { equals: category, mode: "insensitive" };
    if (tags) {
      const list = Array.isArray(tags) ? tags : String(tags).split(",");
      where.tags = { hasSome: list.map((t) => t.trim().toLowerCase()) };
    }
    if (available !== undefined) where.available = available === true || available === "true";
    return prisma.destination.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async getDestinationById(id) {
    return prisma.destination.findUnique({ where: { id: parseInt(id) } });
  }

  async createDestination({ name, area, category, description, tags, minStayMinutes, travelGapMinutes, price, photos }) {
    return prisma.destination.create({
      data: {
        name,
        area,
        category,
        description,
        tags: (tags ?? []).map((t) => String(t).trim().toLowerCase()),
        minStayMinutes: parseInt(minStayMinutes) || 30,
        travelGapMinutes: parseInt(travelGapMinutes) || 15,
        price: parseFloat(price) || 0,
        photos: photos ?? [],
        available: true,
      },
    });
  }

  async updateDestination(id, { name, area, category, description, tags, minStayMinutes, travelGapMinutes, price, photos, available }) {
    const data = {};
    if (name !== undefined) data.name = name;
    if (area !== undefined) data.area = area;
    if (category !== undefined) data.category = category;
    if (description !== undefined) data.description = description;
    if (tags !== undefined) data.tags = tags.map((t) => String(t).trim().toLowerCase());
    if (minStayMinutes !== undefined) data.minStayMinutes = parseInt(minStayMinutes);
    if (travelGapMinutes !== undefined) data.travelGapMinutes = parseInt(travelGapMinutes);
    if (price !== undefined) data.price = parseFloat(price);
    if (photos !== undefined) data.photos = photos;
    if (available !== undefined) data.available = available === true || available === "true";
    return prisma.destination.update({ where: { id: parseInt(id) }, data });
  }

  async deleteDestination(id) {
    return prisma.destination.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new DestinationDAO();
