const prisma = require('./prisma');

async function isWgMember(userId, wgId) {
  const membership = await prisma.membership.findUnique({
    where: { userId_wgId: { userId, wgId } }
  });
  return !!membership;
}

async function resolveMemberByName(wgId, name) {
  const nameLower = name.trim().toLowerCase();
  const memberships = await prisma.membership.findMany({
    where: { wgId },
    include: { user: true }
  });
  const match = memberships.find(m => m.user.name.trim().toLowerCase() === nameLower);
  return match ? match.userId : null;
}

module.exports = { isWgMember, resolveMemberByName };
