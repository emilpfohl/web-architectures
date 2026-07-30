import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from '../../test/resetDb.js';

const prisma = require('../../lib/prisma');
const financesService = require('./finances.service.js');

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

async function createWgWithMember(name = 'User') {
  const user = await prisma.user.create({ data: { name, email: `u${Date.now()}${Math.random()}@test.de`, password: 'x' } });
  const wg = await prisma.wG.create({ data: { name: 'WG', createdAt: new Date().toISOString() } });
  await prisma.membership.create({ data: { userId: user.id, wgId: wg.id, role: 'member' } });
  return { user, wg };
}

describe('listExpenses', () => {
  it('throws ValidationError when wgId is missing', async () => {
    await expect(financesService.listExpenses(1, undefined)).rejects.toThrow('wgId parameter ist erforderlich');
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const { wg } = await createWgWithMember();
    await expect(financesService.listExpenses(999999, wg.id)).rejects.toThrow();
  });

  it('maps paidBy to name and filters by paidById', async () => {
    const { user, wg } = await createWgWithMember('Anna');
    const other = await prisma.user.create({ data: { name: 'Bob', email: `bob3${Date.now()}@test.de`, password: 'x' } });
    await prisma.membership.create({ data: { userId: other.id, wgId: wg.id, role: 'member' } });

    await prisma.financeItem.create({ data: { wgId: wg.id, amount: 10, description: 'A', paidById: user.id } });
    await prisma.financeItem.create({ data: { wgId: wg.id, amount: 20, description: 'B', paidById: other.id } });

    const all = await financesService.listExpenses(user.id, wg.id);
    expect(all).toHaveLength(2);
    expect(all.find(e => e.description === 'A').paidBy).toBe('Anna');

    const filtered = await financesService.listExpenses(user.id, wg.id, other.id);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].paidBy).toBe('Bob');
  });
});

describe('createExpense', () => {
  it('throws ValidationError when wgId or amount is missing', async () => {
    await expect(financesService.createExpense(1, { wgId: 1 })).rejects.toThrow('wgId und amount sind erforderlich');
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const { wg } = await createWgWithMember();
    await expect(financesService.createExpense(999999, { wgId: wg.id, amount: 5 })).rejects.toThrow();
  });

  it('defaults paidById to the creator and description to "Unbekannt"', async () => {
    const { user, wg } = await createWgWithMember();
    const expense = await financesService.createExpense(user.id, { wgId: wg.id, amount: 12.5 });
    expect(expense.paidById).toBe(user.id);
    expect(expense.description).toBe('Unbekannt');
  });

  it('resolves paidBy name to a matching member id', async () => {
    const { user, wg } = await createWgWithMember('Anna');
    const other = await prisma.user.create({ data: { name: 'Bob', email: `bob4${Date.now()}@test.de`, password: 'x' } });
    await prisma.membership.create({ data: { userId: other.id, wgId: wg.id, role: 'member' } });

    const expense = await financesService.createExpense(user.id, { wgId: wg.id, amount: 5, paidBy: 'bob' });
    expect(expense.paidById).toBe(other.id);
  });

  it('falls back to explicit paidById when paidBy name does not resolve', async () => {
    const { user, wg } = await createWgWithMember();
    const expense = await financesService.createExpense(user.id, { wgId: wg.id, amount: 5, paidBy: 'Nobody', paidById: user.id });
    expect(expense.paidById).toBe(user.id);
  });

  it('logs an activity entry', async () => {
    const { user, wg } = await createWgWithMember();
    await financesService.createExpense(user.id, { wgId: wg.id, amount: 7, description: 'Pizza' });
    const activity = await prisma.message.findFirst({ where: { wgId: wg.id, type: 'system' } });
    expect(activity.content).toContain('Pizza');
  });
});

describe('settleExpenses', () => {
  it('throws ValidationError when wgId is missing', async () => {
    await expect(financesService.settleExpenses(1, undefined)).rejects.toThrow('wgId parameter ist erforderlich');
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const { wg } = await createWgWithMember();
    await expect(financesService.settleExpenses(999999, wg.id)).rejects.toThrow();
  });

  it('deletes all expenses and logs a settlement activity', async () => {
    const { user, wg } = await createWgWithMember();
    await prisma.financeItem.create({ data: { wgId: wg.id, amount: 10, description: 'A', paidById: user.id } });
    await financesService.settleExpenses(user.id, wg.id);

    expect(await prisma.financeItem.count({ where: { wgId: wg.id } })).toBe(0);
    const activity = await prisma.message.findFirst({ where: { wgId: wg.id, type: 'system' } });
    expect(activity.content).toContain('Abrechnung abgeschlossen');
  });
});

describe('deleteAllForWgOperation', () => {
  it('deletes all finance items for a wg', async () => {
    const { user, wg } = await createWgWithMember();
    await prisma.financeItem.create({ data: { wgId: wg.id, amount: 10, description: 'A', paidById: user.id } });
    await financesService.deleteAllForWgOperation(wg.id);
    expect(await prisma.financeItem.count({ where: { wgId: wg.id } })).toBe(0);
  });
});
