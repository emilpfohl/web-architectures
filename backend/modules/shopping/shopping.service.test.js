import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from '../../test/resetDb.js';

const prisma = require('../../lib/prisma');
const shoppingService = require('./shopping.service.js');
const { NotFoundError } = require('../../lib/errors');

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

async function createWgWithMember() {
  const user = await prisma.user.create({ data: { name: 'User', email: `u${Date.now()}${Math.random()}@test.de`, password: 'x' } });
  const wg = await prisma.wG.create({ data: { name: 'WG', createdAt: new Date().toISOString() } });
  await prisma.membership.create({ data: { userId: user.id, wgId: wg.id, role: 'member' } });
  return { user, wg };
}

describe('listShoppingItems', () => {
  it('throws ValidationError when wgId is missing', async () => {
    await expect(shoppingService.listShoppingItems(1, undefined)).rejects.toThrow('wgId parameter ist erforderlich');
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const { wg } = await createWgWithMember();
    await expect(shoppingService.listShoppingItems(999999, wg.id)).rejects.toThrow();
  });

  it('lists items and filters by category', async () => {
    const { user, wg } = await createWgWithMember();
    await prisma.shoppingItem.create({ data: { wgId: wg.id, name: 'Milch', category: 'Essen' } });
    await prisma.shoppingItem.create({ data: { wgId: wg.id, name: 'Seife', category: 'Haushalt' } });

    const all = await shoppingService.listShoppingItems(user.id, wg.id);
    expect(all).toHaveLength(2);

    const filtered = await shoppingService.listShoppingItems(user.id, wg.id, 'Essen');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Milch');
  });
});

describe('createShoppingItem', () => {
  it('throws ValidationError when wgId or name is missing', async () => {
    await expect(shoppingService.createShoppingItem(1, { wgId: 1 })).rejects.toThrow('wgId und name sind erforderlich');
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const { wg } = await createWgWithMember();
    await expect(shoppingService.createShoppingItem(999999, { wgId: wg.id, name: 'Milch' })).rejects.toThrow();
  });

  it('creates an item with default category and logs activity', async () => {
    const { user, wg } = await createWgWithMember();
    const item = await shoppingService.createShoppingItem(user.id, { wgId: wg.id, name: 'Milch' });
    expect(item.category).toBe('Lebensmittel');

    const activity = await prisma.message.findFirst({ where: { wgId: wg.id, type: 'system' } });
    expect(activity.content).toContain('Milch');
  });
});

describe('updateShoppingItem', () => {
  it('throws NotFoundError when the item does not exist', async () => {
    await expect(shoppingService.updateShoppingItem(1, 999999, true)).rejects.toThrow();
  });

  it('throws NotFoundError (not AccessDeniedError) for a non-member of the item\'s wg, to avoid leaking item existence', async () => {
    const { wg } = await createWgWithMember();
    const item = await prisma.shoppingItem.create({ data: { wgId: wg.id, name: 'Milch', category: 'Essen' } });
    await expect(shoppingService.updateShoppingItem(999999, item.id, true)).rejects.toThrow(NotFoundError);
  });

  it('updates checked and logs activity only on false -> true transition', async () => {
    const { user, wg } = await createWgWithMember();
    const item = await prisma.shoppingItem.create({ data: { wgId: wg.id, name: 'Milch', category: 'Essen', checked: false } });

    const updated = await shoppingService.updateShoppingItem(user.id, item.id, true);
    expect(updated.checked).toBe(true);

    const activity = await prisma.message.findFirst({ where: { wgId: wg.id, type: 'system' } });
    expect(activity.content).toContain('Eingekauft');
  });

  it('does not log activity when checked stays the same', async () => {
    const { user, wg } = await createWgWithMember();
    const item = await prisma.shoppingItem.create({ data: { wgId: wg.id, name: 'Milch', category: 'Essen', checked: true } });

    await shoppingService.updateShoppingItem(user.id, item.id, true);
    const activityCount = await prisma.message.count({ where: { wgId: wg.id, type: 'system' } });
    expect(activityCount).toBe(0);
  });

  it('keeps the previous checked value when checked is undefined', async () => {
    const { user, wg } = await createWgWithMember();
    const item = await prisma.shoppingItem.create({ data: { wgId: wg.id, name: 'Milch', category: 'Essen', checked: true } });
    const updated = await shoppingService.updateShoppingItem(user.id, item.id, undefined);
    expect(updated.checked).toBe(true);
  });
});

describe('deleteShoppingItem', () => {
  it('throws NotFoundError when the item does not exist', async () => {
    await expect(shoppingService.deleteShoppingItem(1, 999999)).rejects.toThrow();
  });

  it('deletes the item for a member', async () => {
    const { user, wg } = await createWgWithMember();
    const item = await prisma.shoppingItem.create({ data: { wgId: wg.id, name: 'Milch', category: 'Essen' } });
    await shoppingService.deleteShoppingItem(user.id, item.id);
    expect(await prisma.shoppingItem.findUnique({ where: { id: item.id } })).toBeNull();
  });

  it('throws NotFoundError (not AccessDeniedError) for a non-member of the item\'s wg, to avoid leaking item existence', async () => {
    const { wg } = await createWgWithMember();
    const item = await prisma.shoppingItem.create({ data: { wgId: wg.id, name: 'Milch', category: 'Essen' } });
    await expect(shoppingService.deleteShoppingItem(999999, item.id)).rejects.toThrow(NotFoundError);
  });
});

describe('deleteAllForWgOperation', () => {
  it('deletes all shopping items for a wg', async () => {
    const { wg } = await createWgWithMember();
    await prisma.shoppingItem.create({ data: { wgId: wg.id, name: 'Milch', category: 'Essen' } });
    await prisma.shoppingItem.create({ data: { wgId: wg.id, name: 'Brot', category: 'Essen' } });
    await shoppingService.deleteAllForWgOperation(wg.id);
    expect(await prisma.shoppingItem.count({ where: { wgId: wg.id } })).toBe(0);
  });
});
