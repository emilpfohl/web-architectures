const prisma = require('../../lib/prisma');
const { isWgMember, resolveMemberByName } = require('../../lib/membership');
const { logActivity } = require('../../lib/activityLog');
const { ValidationError, AccessDeniedError } = require('../../lib/errors');

async function listExpenses(userId, wgId, paidById) {
  if (!wgId) throw new ValidationError('wgId parameter ist erforderlich');
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();

  const expenses = await prisma.financeItem.findMany({
    where: {
      wgId,
      ...(paidById ? { paidById } : {})
    },
    include: {
      paidBy: { select: { name: true } }
    }
  });

  return expenses.map(e => ({
    ...e,
    paidBy: e.paidBy ? e.paidBy.name : 'Unbekannt'
  }));
}

async function createExpense(userId, { wgId, paidById, amount, description, paidBy }) {
  if (!wgId || amount === undefined) throw new ValidationError('wgId und amount sind erforderlich');
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();

  let finalPaidById = paidById || userId;
  if (paidBy) {
    const matchedId = await resolveMemberByName(wgId, paidBy);
    if (matchedId) finalPaidById = matchedId;
  }

  const newExpense = await prisma.financeItem.create({
    data: {
      description: description || 'Unbekannt',
      amount: parseFloat(amount),
      paidById: finalPaidById,
      wgId
    }
  });

  await logActivity(wgId, `Neue Ausgabe: "${description || 'Unbekannt'}" (${amount}€)`);

  return newExpense;
}

async function settleExpenses(userId, wgId) {
  if (!wgId) throw new ValidationError('wgId parameter ist erforderlich');
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();

  await prisma.financeItem.deleteMany({ where: { wgId } });
  await logActivity(wgId, 'Abrechnung abgeschlossen: Alle Konten auf 0 gesetzt.');
}

function deleteAllForWgOperation(wgId) {
  return prisma.financeItem.deleteMany({ where: { wgId } });
}

module.exports = {
  listExpenses,
  createExpense,
  settleExpenses,
  deleteAllForWgOperation
};
