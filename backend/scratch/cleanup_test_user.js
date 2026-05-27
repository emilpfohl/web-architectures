const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  const email = 'test@example.com';
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    console.log(`Cleaning up user: ${user.name} (${user.id})`);
    
    // Delete memberships
    const deletedMemberships = await prisma.membership.deleteMany({
      where: { userId: user.id }
    });
    console.log(`Deleted ${deletedMemberships.count} memberships.`);

    // Optionally delete WGs where they were the only member? 
    // No, just deleting memberships is enough for the user to see the "You are in no WG" screen.
  } else {
    console.log('User not found.');
  }
  
  await prisma.$disconnect();
}

cleanup();
