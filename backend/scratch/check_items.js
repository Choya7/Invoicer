import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const items = await prisma.itemMaster.findMany();
  console.log(JSON.stringify(items, null, 2));
  await prisma.$disconnect();
}

check();
