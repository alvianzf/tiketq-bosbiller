const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected via Prisma");
  } catch (err) {
    console.error("PostgreSQL connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.prisma = prisma;
