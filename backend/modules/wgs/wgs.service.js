const prisma = require('../../lib/prisma');
const { isWgMember } = require('../../lib/membership');
const { notifyNewMember, notifyShopping } = require('../../lib/notifications');
const { sendPushToUser } = require('../../lib/webpush');
const { ValidationError, AccessDeniedError, NotFoundError, ConflictError, GoneError } = require('../../lib/errors');
const { getUserById } = require('../auth/auth.service');
const { deleteAllForWgOperation: deleteAllShoppingItemsForWg } = require('../shopping/shopping.service');
const { deleteAllForWgOperation: deleteAllTodosForWg } = require('../tasks/tasks.service');
const { deleteAllForWgOperation: deleteAllCalendarEventsForWg } = require('../calendar/calendar.service');
const { deleteAllForWgOperation: deleteAllFinanceItemsForWg } = require('../finances/finances.service');
const { deleteAllForWgOperation: deleteAllMessagesForWg } = require('../messages/messages.service');

async function listWgs(userId) {
  if (userId) {
    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: { wg: true }
    });
    return memberships.map(m => m.wg);
  }
  return prisma.wG.findMany();
}

async function getWg(wgId) {
  const wg = await prisma.wG.findUnique({ where: { id: wgId } });
  if (!wg) throw new NotFoundError('WG nicht gefunden');
  return wg;
}

async function createWg({ name, userId }) {
  if (!name) throw new ValidationError('Name ist erforderlich');

  const newWg = await prisma.wG.create({
    data: { name, createdAt: new Date().toISOString() }
  });

  if (userId) {
    await prisma.membership.create({
      data: { userId: parseInt(userId), wgId: newWg.id, role: 'admin' }
    });
  }

  return newWg;
}

async function updateWg(requesterId, wgId, { name, icon, themeColor }) {
  if (name !== undefined && !name.trim()) throw new ValidationError('Name ist erforderlich');

  if (!(await isWgMember(requesterId, wgId))) throw new AccessDeniedError();

  return prisma.wG.update({
    where: { id: wgId },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(icon !== undefined ? { icon } : {}),
      ...(themeColor !== undefined ? { themeColor } : {})
    }
  });
}

async function listMembers(requesterId, wgId) {
  if (!(await isWgMember(requesterId, wgId))) throw new AccessDeniedError();

  const memberships = await prisma.membership.findMany({
    where: { wgId },
    include: { user: { select: { id: true, name: true, email: true } } }
  });

  return memberships.map(m => ({
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role
  }));
}

async function updateMemberStatus(userId, { wgId, isHome, mood, isShopping }) {
  if (!wgId) throw new ValidationError('wgId ist erforderlich');

  const wId = parseInt(wgId);

  const previousMembership = await prisma.membership.findUnique({
    where: { userId_wgId: { userId, wgId: wId } }
  });

  const updatedMembership = await prisma.membership.update({
    where: { userId_wgId: { userId, wgId: wId } },
    data: {
      ...(isHome !== undefined ? { isHome } : {}),
      ...(mood !== undefined ? { mood } : {}),
      ...(isShopping !== undefined ? { isShopping } : {})
    }
  });

  if (isShopping === true && previousMembership && !previousMembership.isShopping) {
    const shopper = await getUserById(userId).catch(() => null);
    const shopperName = shopper?.name || 'Jemand';

    notifyShopping({ wgId: wId, shopperId: userId, shopperName })
      .catch(err => console.error('Error sending shopping notification:', err));

    prisma.membership.findMany({ where: { wgId: wId, userId: { not: userId } } })
      .then(otherMemberships => {
        const pushPayload = {
          title: `${shopperName} ist einkaufen`,
          body: 'Sag Bescheid, falls dir noch etwas fehlt.',
          url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?tab=shopping`
        };
        otherMemberships.forEach(m => {
          sendPushToUser(m.userId, pushPayload)
            .catch(err => console.error('Error sending shopping push notification:', err));
        });
      })
      .catch(err => console.error('Error loading WG members for push notification:', err));
  }

  return updatedMembership;
}

async function removeWgMember(requesterId, wgId, targetUserId) {
  if (!(await isWgMember(requesterId, wgId))) throw new AccessDeniedError();

  const targetMembership = await prisma.membership.findUnique({
    where: { userId_wgId: { userId: targetUserId, wgId } }
  });
  if (!targetMembership) throw new NotFoundError('Mitgliedschaft nicht gefunden');

  const remainingCount = await prisma.membership.count({ where: { wgId } });

  if (remainingCount <= 1) {
    await prisma.$transaction([
      deleteAllShoppingItemsForWg(wgId),
      deleteAllTodosForWg(wgId),
      deleteAllCalendarEventsForWg(wgId),
      deleteAllFinanceItemsForWg(wgId),
      prisma.invitation.deleteMany({ where: { wgId } }),
      deleteAllMessagesForWg(wgId),
      prisma.membership.deleteMany({ where: { wgId } }),
      prisma.wG.delete({ where: { id: wgId } })
    ]);
    return { message: 'Mitglied entfernt, WG war leer und wurde gelöscht', wgDeleted: true };
  }

  await prisma.membership.delete({
    where: { userId_wgId: { userId: targetUserId, wgId } }
  });

  return { message: 'Mitglied entfernt', wgDeleted: false };
}

async function getInvitationByToken(token) {
  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { wg: true }
  });
  if (!invite) throw new NotFoundError('Ungültiger oder abgelaufener Einladungs-Token');

  return { ...invite, wgName: invite.wg.name };
}

async function createInvitation(userId, wgId, { token, role, maxUses }) {
  const wg = await prisma.wG.findUnique({ where: { id: wgId } });
  if (!wg) throw new NotFoundError('WG nicht gefunden');

  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError('Du bist kein Mitglied dieser WG');

  return prisma.invitation.create({
    data: {
      wgId,
      token: token || Math.random().toString(36).substring(2, 10),
      role: role || 'member',
      usedCount: 0,
      maxUses: maxUses || 5
    }
  });
}

async function joinViaInvitation(token, userId) {
  if (!token || !userId) throw new ValidationError('Token und userId sind erforderlich');

  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { wg: true }
  });
  if (!invite) throw new NotFoundError('Einladung nicht gefunden');

  if (invite.maxUses !== -1 && invite.usedCount >= invite.maxUses) {
    throw new GoneError('Diese Einladung ist bereits abgelaufen');
  }

  const alreadyMember = await prisma.membership.findUnique({
    where: { userId_wgId: { userId, wgId: invite.wgId } }
  });
  if (alreadyMember) throw new ConflictError('Du bist bereits Mitglied dieser WG');

  await prisma.membership.create({
    data: {
      userId,
      wgId: invite.wgId,
      role: invite.role
    }
  });

  await prisma.invitation.update({
    where: { id: invite.id },
    data: { usedCount: invite.usedCount + 1 }
  });

  const newMember = await getUserById(userId).catch(() => null);
  notifyNewMember({
    wgId: invite.wgId,
    wgName: invite.wg.name,
    newMemberId: userId,
    newMemberName: newMember?.name || 'Ein neues Mitglied'
  }).catch(err => console.error('Error sending new member notification:', err));

  return { wgId: invite.wgId };
}

async function getMembership(userId, wgId) {
  return prisma.membership.findUnique({ where: { userId_wgId: { userId, wgId } } });
}

async function getMembershipsForWg(wgId) {
  return prisma.membership.findMany({ where: { wgId }, include: { user: true } });
}

async function getMembershipsForUser(userId) {
  return prisma.membership.findMany({
    where: { userId },
    include: {
      wg: {
        include: {
          memberships: { include: { user: true } }
        }
      }
    }
  });
}

module.exports = {
  listWgs,
  getWg,
  createWg,
  updateWg,
  listMembers,
  updateMemberStatus,
  removeWgMember,
  getInvitationByToken,
  createInvitation,
  joinViaInvitation,
  getMembership,
  getMembershipsForWg,
  getMembershipsForUser
};
