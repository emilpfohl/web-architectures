const prisma = require('../lib/prisma');

// Reihenfolge wichtig: erst abhängige Tabellen (Foreign Keys), dann die
// referenzierten Basistabellen (User, WG).
async function resetDb() {
  await prisma.message.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.financeItem.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.shoppingItem.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.wG.deleteMany();
  await prisma.user.deleteMany();
}

module.exports = { resetDb };
