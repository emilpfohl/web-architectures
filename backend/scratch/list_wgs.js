const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listWgs() {
  const wgs = await prisma.wG.findMany({
    include: { memberships: true }
  });
  console.log(JSON.stringify(wgs, null, 2));
  await prisma.$disconnect();
}

listWgs();
