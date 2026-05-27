const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function totalWipe() {
  console.log('Starting total database wipe...');
  
  try {
    // The order is important due to foreign keys
    await prisma.message.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.financeItem.deleteMany();
    await prisma.calendarEvent.deleteMany();
    await prisma.todo.deleteMany();
    await prisma.shoppingItem.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.wG.deleteMany();
    
    console.log('Database wiped successfully.');
  } catch (err) {
    console.error('Wipe failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

totalWipe();
