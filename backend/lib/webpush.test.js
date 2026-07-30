import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { resetDb } from '../test/resetDb.js';

const prisma = require('./prisma');
const { sendPushToUser } = require('./webpush.js');

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe('sendPushToUser', () => {
  it('does nothing and does not throw when the user has no subscriptions', async () => {
    const user = await prisma.user.create({ data: { name: 'U', email: `w1${Date.now()}@test.de`, password: 'x' } });
    await expect(sendPushToUser(user.id, { title: 'Hi' })).resolves.toBeUndefined();
  });

  it('swallows send failures for an existing subscription without throwing', async () => {
    const user = await prisma.user.create({ data: { name: 'U', email: `w2${Date.now()}@test.de`, password: 'x' } });
    await prisma.pushSubscription.create({
      data: { userId: user.id, endpoint: 'https://push.example/dead', p256dh: 'a', auth: 'b' }
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(sendPushToUser(user.id, { title: 'Hi' })).resolves.toBeUndefined();

    errorSpy.mockRestore();
  });
});
