const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const data = require('../data.js');
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Clean the database before seeding
  // The order is important due to foreign key constraints
  await prisma.message.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.financeItem.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.shoppingItem.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.wG.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database cleaned.');

  // 1. Users
  console.log('Seeding users...');
  for (const u of data.users) {
    await prisma.user.create({ 
      data: {
        ...u,
        password: hashedPassword
      } 
    });
  }

  // Create a dedicated test user if not already present
  const testUserEmail = 'test@example.com';
  const existingTestUser = await prisma.user.findUnique({ where: { email: testUserEmail } });
  if (!existingTestUser) {
    await prisma.user.create({
      data: {
        name: 'Test User',
        email: testUserEmail,
        password: hashedPassword
      }
    });
    console.log('Dedicated test user created (test@example.com / password123)');
  }

  // 2. WGs
  console.log('Seeding WGs...');
  for (const w of data.wgs) {
    await prisma.wG.create({ data: w });
  }

  // 3. Memberships
  console.log('Seeding memberships...');
  for (const m of data.memberships) {
    await prisma.membership.create({ data: m });
  }

  // 4. Shopping
  console.log('Seeding shopping items...');
  for (const s of data.shopping) {
    await prisma.shoppingItem.create({ data: s });
  }

  // 5. Todos
  console.log('Seeding todos...');
  for (const t of data.todos) {
    await prisma.todo.create({ data: t });
  }

  // 6. Calendar
  console.log('Seeding calendar events...');
  for (const c of data.calendar) {
    await prisma.calendarEvent.create({ data: c });
  }

  // 7. Finances
  console.log('Seeding finances...');
  for (const f of data.finances) {
    await prisma.financeItem.create({ data: f });
  }

  // 8. Invitations
  console.log('Seeding invitations...');
  for (const i of data.invitations) {
    await prisma.invitation.create({ data: i });
  }

  // 9. Messages
  console.log('Seeding messages...');
  for (const m of data.messages) {
    await prisma.message.create({ data: m });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
