const prisma = require('../../lib/prisma');
const { isWgMember } = require('../../lib/membership');
const { logActivity } = require('../../lib/activityLog');
const { ValidationError, AccessDeniedError, NotFoundError } = require('../../lib/errors');

async function listDebts(userId, wgId) {
  if (!wgId) throw new ValidationError('wgId parameter ist erforderlich');
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();

  const debts = await prisma.debt.findMany({
    where: { wgId },
    include: {
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return debts.map(d => ({
    ...d,
    fromUserName: d.fromUser.name,
    toUserName: d.toUser.name
  }));
}

async function createDebt(userId, { wgId, fromUserId, toUserId, amount, description }) {
  if (!wgId || !fromUserId || !toUserId || amount === undefined) {
    throw new ValidationError('wgId, fromUserId, toUserId und amount sind erforderlich');
  }
  if (fromUserId === toUserId) {
    throw new ValidationError('Schuldner und Gläubiger müssen unterschiedlich sein');
  }
  const parsedAmount = parseFloat(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new ValidationError('amount muss eine positive Zahl sein');
  }
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();
  if (!(await isWgMember(fromUserId, wgId)) || !(await isWgMember(toUserId, wgId))) {
    throw new ValidationError('Beide Personen müssen Mitglieder dieser WG sein');
  }

  const newDebt = await prisma.debt.create({
    data: {
      wgId,
      fromUserId,
      toUserId,
      amount: parsedAmount,
      description: description || ''
    },
    include: {
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } }
    }
  });

  await logActivity(wgId, `Neue Schuld: ${newDebt.fromUser.name} schuldet ${newDebt.toUser.name} ${parsedAmount.toFixed(2)}€${description ? ` (${description})` : ''}`);

  return { ...newDebt, fromUserName: newDebt.fromUser.name, toUserName: newDebt.toUser.name };
}

async function settleDebt(userId, debtId) {
  const debt = await prisma.debt.findUnique({ where: { id: debtId } });
  if (!debt) throw new NotFoundError('Schuld nicht gefunden');
  if (!(await isWgMember(userId, debt.wgId))) throw new AccessDeniedError();
  if (userId !== debt.fromUserId && userId !== debt.toUserId) {
    throw new AccessDeniedError('Nur Schuldner oder Gläubiger können diese Schuld begleichen');
  }
  if (debt.settledAt) return debt;

  const updated = await prisma.debt.update({
    where: { id: debtId },
    data: { settledAt: new Date() }
  });

  await logActivity(debt.wgId, `Schuld beglichen (${debt.amount.toFixed(2)}€)`);

  return updated;
}

async function deleteDebt(userId, debtId) {
  const debt = await prisma.debt.findUnique({ where: { id: debtId } });
  if (!debt) throw new NotFoundError('Schuld nicht gefunden');
  if (!(await isWgMember(userId, debt.wgId))) throw new AccessDeniedError();
  if (userId !== debt.fromUserId && userId !== debt.toUserId) {
    throw new AccessDeniedError('Nur Schuldner oder Gläubiger können diese Schuld löschen');
  }

  await prisma.debt.delete({ where: { id: debtId } });
  await logActivity(debt.wgId, `Direkte Schuld gelöscht (${debt.amount.toFixed(2)}€)`);
}

function deleteAllForWgOperation(wgId) {
  return prisma.debt.deleteMany({ where: { wgId } });
}

module.exports = {
  listDebts,
  createDebt,
  settleDebt,
  deleteDebt,
  deleteAllForWgOperation
};
