const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPhotos() {
  const photos = await prisma.carPhoto.findMany();
  console.log(JSON.stringify(photos, null, 2));
  await prisma.$disconnect();
}

checkPhotos();
