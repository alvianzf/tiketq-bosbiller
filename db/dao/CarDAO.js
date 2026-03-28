const { prisma } = require("../index");

class CarDAO {
  // ── Car CRUD ──────────────────────────────────────────────
  async getAllCars({ type, rows, available } = {}) {
    const where = {};
    if (type && type !== "all") where.type = { equals: type, mode: "insensitive" };
    if (rows) where.rows = parseInt(rows);
    if (available !== undefined) where.available = available === true || available === "true";
    return prisma.car.findMany({ where, include: { photos: true }, orderBy: { createdAt: "desc" } });
  }

  async getCarById(id) {
    return prisma.car.findUnique({ where: { id: parseInt(id) }, include: { photos: true } });
  }

  async createCar({ name, type, rows, pricePerDay, transmission, description, features }) {
    return prisma.car.create({
      data: {
        name,
        type,
        rows: parseInt(rows),
        pricePerDay: parseFloat(pricePerDay),
        transmission,
        description,
        features: features ?? [],
        available: true,
      },
      include: { photos: true },
    });
  }

  async updateCar(id, { name, type, rows, pricePerDay, transmission, description, features, available }) {
    const data = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (rows !== undefined) data.rows = parseInt(rows);
    if (pricePerDay !== undefined) data.pricePerDay = parseFloat(pricePerDay);
    if (transmission !== undefined) data.transmission = transmission;
    if (description !== undefined) data.description = description;
    if (features !== undefined) data.features = Array.isArray(features) ? features : JSON.parse(features);
    if (available !== undefined) data.available = available === true || available === "true";
    return prisma.car.update({ where: { id: parseInt(id) }, data, include: { photos: true } });
  }

  async deleteCar(id) {
    return prisma.car.delete({ where: { id: parseInt(id) } });
  }

  // ── Car Photos ────────────────────────────────────────────
  async addPhoto(carId, { filename, url, isPrimary }) {
    if (isPrimary) {
      // Demote existing primary
      await prisma.carPhoto.updateMany({ where: { carId: parseInt(carId), isPrimary: true }, data: { isPrimary: false } });
    }
    return prisma.carPhoto.create({
      data: { carId: parseInt(carId), filename, url, isPrimary: isPrimary ?? false },
    });
  }

  async deletePhoto(photoId) {
    return prisma.carPhoto.delete({ where: { id: parseInt(photoId) } });
  }

  async getPhotos(carId) {
    return prisma.carPhoto.findMany({ where: { carId: parseInt(carId) }, orderBy: { isPrimary: "desc" } });
  }

  // ── Rental Requests ───────────────────────────────────────
  async createRentalRequest({ carId, date, fullName, phone, email, ktpImage, ktpSelfie }) {
    const car = await this.getCarById(carId);
    const totalSales = car ? car.pricePerDay : 0;
    
    return prisma.carRentalRequest.create({
      data: { 
        carId: parseInt(carId), 
        date, 
        fullName, 
        phone, 
        email, 
        ktpImage, 
        ktpSelfie, 
        status: "PENDING_REVIEW",
        transaction: {
          create: {
            serviceType: "CAR_RENTAL",
            bookingCode: `CAR-${Date.now()}`,
            email,
            basePrice: totalSales,
            serviceFee: 0,
            totalSales: totalSales,
            status: "PENDING",
            payment_status: false,
          }
        }
      },
      include: { car: true, transaction: true },
    });
  }

  async getAllRentalRequests() {
    return prisma.carRentalRequest.findMany({ include: { car: true }, orderBy: { createdAt: "desc" } });
  }

  async updateRentalStatus(id, status) {
    return prisma.carRentalRequest.update({ where: { id: parseInt(id) }, data: { status } });
  }
}

module.exports = new CarDAO();
