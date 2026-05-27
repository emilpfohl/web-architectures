const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
    console.log('Prisma connection successful');
  } catch (error) {
    console.error('Prisma connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
