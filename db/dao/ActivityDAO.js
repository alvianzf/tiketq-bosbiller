const { prisma } = require("../index");

class ActivityDAO {
  async getAllActivities({ category, available } = {}) {
    const where = {};
    if (category && category !== "all") where.category = { equals: category, mode: "insensitive" };
    if (available !== undefined) where.available = available === true || available === "true";
    return prisma.activity.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async getActivityById(id) {
    return prisma.activity.findUnique({ where: { id: parseInt(id) } });
  }

  async createActivity({ name, category, location, description, price, duration, photos }) {
    return prisma.activity.create({
      data: {
        name,
        category,
        location,
        description,
        price: parseFloat(price),
        duration,
        photos: photos ?? [],
        available: true,
      },
    });
  }

  async updateActivity(id, { name, category, location, description, price, duration, photos, available }) {
    const data = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (location !== undefined) data.location = location;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = parseFloat(price);
    if (duration !== undefined) data.duration = duration;
    if (photos !== undefined) data.photos = photos;
    if (available !== undefined) data.available = available === true || available === "true";
    return prisma.activity.update({ where: { id: parseInt(id) }, data });
  }

  async deleteActivity(id) {
    return prisma.activity.delete({ where: { id: parseInt(id) } });
  }

  async createBooking({ activityId, date, participants, fullName, phone, email }) {
    const activity = await this.getActivityById(activityId);
    const count = parseInt(participants) || 1;
    const totalSales = activity ? parseFloat(activity.price) * count : 0;

    return prisma.activityBooking.create({
      data: {
        activityId: parseInt(activityId),
        date,
        participants: count,
        fullName,
        phone,
        email,
        status: "PENDING_REVIEW",
        transaction: {
          create: {
            serviceType: "ACTIVITY",
            bookingCode: `ACT-${Date.now()}`,
            email,
            basePrice: totalSales,
            serviceFee: 0,
            totalSales,
            status: "PENDING",
            payment_status: false,
          },
        },
      },
      include: { activity: true, transaction: true },
    });
  }

  async getAllBookings() {
    return prisma.activityBooking.findMany({ include: { activity: true }, orderBy: { createdAt: "desc" } });
  }

  async updateBookingStatus(id, status) {
    return prisma.activityBooking.update({ where: { id: parseInt(id) }, data: { status } });
  }
}

module.exports = new ActivityDAO();
