const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected via Prisma");
  } catch (err) {
    // Don't exit: a DB that is down at boot would otherwise crash-loop the whole
    // API (2026-08-11 outage). Prisma connects lazily per query, so the server
    // stays up on non-DB routes and recovers on its own once the DB is back.
    console.error("PostgreSQL connection error (starting anyway):", err);
  }
};

module.exports = connectDB;
module.exports.prisma = prisma;
