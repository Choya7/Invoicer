import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const pos = await prisma.purchaseOrder.findMany({ include: { items: true } });
  console.log(JSON.stringify(pos, null, 2));
  await prisma.$disconnect();
}

check();
