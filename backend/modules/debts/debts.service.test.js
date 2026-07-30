import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from '../../test/resetDb.js';

const prisma = require('../../lib/prisma');
const debtsService = require('./debts.service.js');

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

async function createWgWithTwoMembers(nameA = 'Anna', nameB = 'Bob') {
  const wg = await prisma.wG.create({ data: { name: 'WG', createdAt: new Date().toISOString() } });
  const userA = await prisma.user.create({ data: { name: nameA, email: `${nameA}${Date.now()}${Math.random()}@test.de`, password: 'x' } });
  const userB = await prisma.user.create({ data: { name: nameB, email: `${nameB}${Date.now()}${Math.random()}@test.de`, password: 'x' } });
  await prisma.membership.create({ data: { userId: userA.id, wgId: wg.id, role: 'member' } });
  await prisma.membership.create({ data: { userId: userB.id, wgId: wg.id, role: 'member' } });
  return { wg, userA, userB };
}

describe('listDebts', () => {
  it('throws ValidationError when wgId is missing', async () => {
    await expect(debtsService.listDebts(1, undefined)).rejects.toThrow('wgId parameter ist erforderlich');
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const { wg } = await createWgWithTwoMembers();
    await expect(debtsService.listDebts(999999, wg.id)).rejects.toThrow();
  });

  it('maps fromUserName/toUserName and orders by createdAt desc', async () => {
    const { wg, userA, userB } = await createWgWithTwoMembers();
    await prisma.debt.create({ data: { wgId: wg.id, fromUserId: userB.id, toUserId: userA.id, amount: 10, description: 'A' } });
    await prisma.debt.create({ data: { wgId: wg.id, fromUserId: userA.id, toUserId: userB.id, amount: 5, description: 'B' } });

    const debts = await debtsService.listDebts(userA.id, wg.id);
    expect(debts).toHaveLength(2);
    expect(debts[0].description).toBe('B');
    expect(debts[0].fromUserName).toBe('Anna');
    expect(debts[0].toUserName).toBe('Bob');
  });
});

describe('createDebt', () => {
  it('throws ValidationError when required fields are missing', async () => {
    await expect(debtsService.createDebt(1, { wgId: 1 })).rejects.toThrow('wgId, fromUserId, toUserId und amount sind erforderlich');
  });

  it('throws ValidationError when fromUserId equals toUserId', async () => {
    const { wg, userA } = await createWgWithTwoMembers();
    await expect(debtsService.createDebt(userA.id, { wgId: wg.id, fromUserId: userA.id, toUserId: userA.id, amount: 5 }))
      .rejects.toThrow('Schuldner und Gläubiger müssen unterschiedlich sein');
  });

  it('throws ValidationError when amount is not positive', async () => {
    const { wg, userA, userB } = await createWgWithTwoMembers();
    await expect(debtsService.createDebt(userA.id, { wgId: wg.id, fromUserId: userA.id, toUserId: userB.id, amount: 0 }))
      .rejects.toThrow('amount muss eine positive Zahl sein');
  });

  it('throws AccessDeniedError when requester is not a WG member', async () => {
    const { wg, userA, userB } = await createWgWithTwoMembers();
    await expect(debtsService.createDebt(999999, { wgId: wg.id, fromUserId: userA.id, toUserId: userB.id, amount: 5 }))
      .rejects.toThrow();
  });

  it('throws ValidationError when fromUserId or toUserId is not a WG member', async () => {
    const { wg, userA } = await createWgWithTwoMembers();
    const outsider = await prisma.user.create({ data: { name: 'Outsider', email: `out${Date.now()}@test.de`, password: 'x' } });
    await expect(debtsService.createDebt(userA.id, { wgId: wg.id, fromUserId: userA.id, toUserId: outsider.id, amount: 5 }))
      .rejects.toThrow('Beide Personen müssen Mitglieder dieser WG sein');
  });

  it('creates a debt and logs an activity entry', async () => {
    const { wg, userA, userB } = await createWgWithTwoMembers();
    const debt = await debtsService.createDebt(userA.id, { wgId: wg.id, fromUserId: userB.id, toUserId: userA.id, amount: 20, description: 'Kino' });

    expect(debt.fromUserName).toBe('Bob');
    expect(debt.toUserName).toBe('Anna');
    expect(debt.amount).toBe(20);

    const activity = await prisma.message.findFirst({ where: { wgId: wg.id, type: 'system' } });
    expect(activity.content).toContain('Kino');
  });
});

describe('settleDebt', () => {
  it('throws NotFoundError for an unknown debt', async () => {
    await expect(debtsService.settleDebt(1, 999999)).rejects.toThrow('Schuld nicht gefunden');
  });

  it('throws AccessDeniedError when requester is neither fromUser nor toUser', async () => {
    const { wg, userA, userB } = await createWgWithTwoMembers();
    const third = await prisma.user.create({ data: { name: 'Clara', email: `clara${Date.now()}@test.de`, password: 'x' } });
    await prisma.membership.create({ data: { userId: third.id, wgId: wg.id, role: 'member' } });
    const debt = await prisma.debt.create({ data: { wgId: wg.id, fromUserId: userB.id, toUserId: userA.id, amount: 10 } });

    await expect(debtsService.settleDebt(third.id, debt.id)).rejects.toThrow('Nur Schuldner oder Gläubiger können diese Schuld begleichen');
  });

  it('sets settledAt and is idempotent', async () => {
    const { wg, userA, userB } = await createWgWithTwoMembers();
    const debt = await prisma.debt.create({ data: { wgId: wg.id, fromUserId: userB.id, toUserId: userA.id, amount: 10 } });

    const settled = await debtsService.settleDebt(userA.id, debt.id);
    expect(settled.settledAt).not.toBeNull();

    const settledAgain = await debtsService.settleDebt(userB.id, debt.id);
    expect(settledAgain.settledAt.getTime()).toBe(settled.settledAt.getTime());
  });
});

describe('deleteDebt', () => {
  it('throws NotFoundError for an unknown debt', async () => {
    await expect(debtsService.deleteDebt(1, 999999)).rejects.toThrow('Schuld nicht gefunden');
  });

  it('throws AccessDeniedError for a third party', async () => {
    const { wg, userA, userB } = await createWgWithTwoMembers();
    const third = await prisma.user.create({ data: { name: 'Clara', email: `clara2${Date.now()}@test.de`, password: 'x' } });
    await prisma.membership.create({ data: { userId: third.id, wgId: wg.id, role: 'member' } });
    const debt = await prisma.debt.create({ data: { wgId: wg.id, fromUserId: userB.id, toUserId: userA.id, amount: 10 } });

    await expect(debtsService.deleteDebt(third.id, debt.id)).rejects.toThrow('Nur Schuldner oder Gläubiger können diese Schuld löschen');
  });

  it('deletes the debt when requested by a participant', async () => {
    const { wg, userA, userB } = await createWgWithTwoMembers();
    const debt = await prisma.debt.create({ data: { wgId: wg.id, fromUserId: userB.id, toUserId: userA.id, amount: 10 } });

    await debtsService.deleteDebt(userA.id, debt.id);
    expect(await prisma.debt.findUnique({ where: { id: debt.id } })).toBeNull();
  });
});

describe('deleteAllForWgOperation', () => {
  it('deletes all debts for a wg', async () => {
    const { wg, userA, userB } = await createWgWithTwoMembers();
    await prisma.debt.create({ data: { wgId: wg.id, fromUserId: userB.id, toUserId: userA.id, amount: 10 } });

    await debtsService.deleteAllForWgOperation(wg.id);
    expect(await prisma.debt.count({ where: { wgId: wg.id } })).toBe(0);
  });
});
