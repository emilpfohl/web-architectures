import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from '../../test/resetDb.js';

const prisma = require('../../lib/prisma');
const messagesService = require('./messages.service.js');

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

describe('listMessages', () => {
  it('throws ValidationError when wgId is missing', async () => {
    await expect(messagesService.listMessages(1, undefined)).rejects.toThrow('wgId parameter ist erforderlich');
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const { wg } = await createWgWithMember();
    await expect(messagesService.listMessages(999999, wg.id)).rejects.toThrow();
  });

  it('labels system messages as "System" and unknown senders as "Unbekannt"', async () => {
    const { user, wg } = await createWgWithMember();
    await prisma.message.create({ data: { wgId: wg.id, type: 'system', content: 'Log', timestamp: new Date().toISOString() } });
    await prisma.message.create({ data: { wgId: wg.id, type: 'user', content: 'Hi', senderId: user.id, timestamp: new Date().toISOString() } });

    const messages = await messagesService.listMessages(user.id, wg.id);
    const system = messages.find(m => m.type === 'system');
    const userMsg = messages.find(m => m.type === 'user');
    expect(system.senderName).toBe('System');
    expect(userMsg.senderName).toBe(user.name);
  });
});

describe('createMessage', () => {
  it('throws ValidationError when wgId or content is missing', async () => {
    await expect(messagesService.createMessage(1, { wgId: 1 })).rejects.toThrow('wgId und content sind erforderlich');
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const { wg } = await createWgWithMember();
    await expect(messagesService.createMessage(999999, { wgId: wg.id, content: 'Hi' })).rejects.toThrow();
  });

  it('creates a message with default type "user" and senderName', async () => {
    const { user, wg } = await createWgWithMember();
    const message = await messagesService.createMessage(user.id, { wgId: wg.id, content: 'Hallo' });
    expect(message.type).toBe('user');
    expect(message.senderName).toBe(user.name);
  });
});

describe('deleteAllForWgOperation', () => {
  it('deletes all messages for a wg', async () => {
    const { wg } = await createWgWithMember();
    await prisma.message.create({ data: { wgId: wg.id, type: 'system', content: 'A', timestamp: new Date().toISOString() } });
    await messagesService.deleteAllForWgOperation(wg.id);
    expect(await prisma.message.count({ where: { wgId: wg.id } })).toBe(0);
  });
});
