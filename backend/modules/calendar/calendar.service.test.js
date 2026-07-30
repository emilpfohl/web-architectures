import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from '../../test/resetDb.js';

const prisma = require('../../lib/prisma');
const calendarService = require('./calendar.service.js');

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

describe('listEvents', () => {
  it('throws ValidationError when wgId is missing', async () => {
    await expect(calendarService.listEvents(1, undefined)).rejects.toThrow('wgId parameter ist erforderlich');
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const { wg } = await createWgWithMember();
    await expect(calendarService.listEvents(999999, wg.id)).rejects.toThrow();
  });

  it('lists events for the wg', async () => {
    const { user, wg } = await createWgWithMember();
    await prisma.calendarEvent.create({ data: { wgId: wg.id, date: '2026-01-01', title: 'Event' } });
    const events = await calendarService.listEvents(user.id, wg.id);
    expect(events).toHaveLength(1);
  });
});

describe('createEvent', () => {
  it('throws ValidationError when wgId, date or title is missing', async () => {
    await expect(calendarService.createEvent(1, { wgId: 1, date: '2026-01-01' }))
      .rejects.toThrow('wgId, date und title sind erforderlich');
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const { wg } = await createWgWithMember();
    await expect(calendarService.createEvent(999999, { wgId: wg.id, date: '2026-01-01', title: 'Event' })).rejects.toThrow();
  });

  it('creates an event for a member', async () => {
    const { user, wg } = await createWgWithMember();
    const event = await calendarService.createEvent(user.id, { wgId: wg.id, date: '2026-01-01', title: 'Party' });
    expect(event.title).toBe('Party');
  });
});

describe('deleteAllForWgOperation', () => {
  it('deletes all calendar events for a wg', async () => {
    const { wg } = await createWgWithMember();
    await prisma.calendarEvent.create({ data: { wgId: wg.id, date: '2026-01-01', title: 'Event' } });
    await calendarService.deleteAllForWgOperation(wg.id);
    expect(await prisma.calendarEvent.count({ where: { wgId: wg.id } })).toBe(0);
  });
});
