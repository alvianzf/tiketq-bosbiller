const { prisma } = require("../index");

class TransactionDAO {
  async findById(id) {
    return await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        flightBooking: { include: { passengers: true } },
        ferryBooking: { include: { passengers: true, origin: true, destination: true } },
        carRentalRequest: { include: { car: true } },
      },
    });
  }

  async updateStatus(id, status) {
    return await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: { status },
    });
  }
}

module.exports = new TransactionDAO();
