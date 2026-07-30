import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from '../../test/resetDb.js';

const prisma = require('../../lib/prisma');
const pushService = require('./push.service.js');

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

async function createUser() {
  return prisma.user.create({ data: { name: 'User', email: `u${Date.now()}${Math.random()}@test.de`, password: 'x' } });
}

describe('upsertSubscription', () => {
  it('throws ValidationError when endpoint is missing', async () => {
    const user = await createUser();
    await expect(pushService.upsertSubscription(user.id, { keys: { p256dh: 'a', auth: 'b' } }))
      .rejects.toThrow('endpoint und keys sind erforderlich');
  });

  it('throws ValidationError when keys.p256dh is missing', async () => {
    const user = await createUser();
    await expect(pushService.upsertSubscription(user.id, { endpoint: 'e', keys: { auth: 'b' } }))
      .rejects.toThrow('endpoint und keys sind erforderlich');
  });

  it('throws ValidationError when keys.auth is missing', async () => {
    const user = await createUser();
    await expect(pushService.upsertSubscription(user.id, { endpoint: 'e', keys: { p256dh: 'a' } }))
      .rejects.toThrow('endpoint und keys sind erforderlich');
  });

  it('creates a new subscription', async () => {
    const user = await createUser();
    await pushService.upsertSubscription(user.id, { endpoint: 'https://push.example/1', keys: { p256dh: 'a', auth: 'b' } });
    const stored = await prisma.pushSubscription.findUnique({ where: { endpoint: 'https://push.example/1' } });
    expect(stored.userId).toBe(user.id);
  });

  it('updates an existing subscription for the same endpoint', async () => {
    const user = await createUser();
    const other = await createUser();
    await pushService.upsertSubscription(user.id, { endpoint: 'https://push.example/2', keys: { p256dh: 'a', auth: 'b' } });
    await pushService.upsertSubscription(other.id, { endpoint: 'https://push.example/2', keys: { p256dh: 'c', auth: 'd' } });

    const stored = await prisma.pushSubscription.findUnique({ where: { endpoint: 'https://push.example/2' } });
    expect(stored.userId).toBe(other.id);
    expect(stored.p256dh).toBe('c');

    const count = await prisma.pushSubscription.count();
    expect(count).toBe(1);
  });
});
