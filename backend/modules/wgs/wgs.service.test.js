import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from '../../test/resetDb.js';

const prisma = require('../../lib/prisma');
const wgsService = require('./wgs.service.js');

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

async function createUser(email = 'user@test.de', name = 'User') {
  return prisma.user.create({ data: { name, email, password: 'hashed' } });
}

async function createWgWithMember(userId, role = 'admin') {
  const wg = await prisma.wG.create({ data: { name: 'Test-WG', createdAt: new Date().toISOString() } });
  await prisma.membership.create({ data: { userId, wgId: wg.id, role } });
  return wg;
}

describe('listWgs', () => {
  it('returns only the wgs the user is a member of when userId is given', async () => {
    const user = await createUser();
    const myWg = await createWgWithMember(user.id);
    await prisma.wG.create({ data: { name: 'Other WG', createdAt: new Date().toISOString() } });

    const result = await wgsService.listWgs(user.id);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(myWg.id);
  });

  it('returns all wgs when no userId is given', async () => {
    await prisma.wG.create({ data: { name: 'A', createdAt: new Date().toISOString() } });
    await prisma.wG.create({ data: { name: 'B', createdAt: new Date().toISOString() } });

    const result = await wgsService.listWgs(undefined);
    expect(result).toHaveLength(2);
  });
});

describe('createWg', () => {
  it('creates a WG and an admin membership for the creator', async () => {
    const user = await createUser();
    const wg = await wgsService.createWg({ name: 'Neue WG', userId: user.id });
    expect(wg.name).toBe('Neue WG');

    const membership = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: user.id, wgId: wg.id } }
    });
    expect(membership.role).toBe('admin');
  });

  it('creates a WG without a membership when no userId is given', async () => {
    const wg = await wgsService.createWg({ name: 'Ownerless WG' });
    const count = await prisma.membership.count({ where: { wgId: wg.id } });
    expect(count).toBe(0);
  });

  it('throws ValidationError when name is missing', async () => {
    await expect(wgsService.createWg({})).rejects.toThrow('Name ist erforderlich');
  });
});

describe('getWg', () => {
  it('returns the wg for an existing id', async () => {
    const wg = await prisma.wG.create({ data: { name: 'X', createdAt: new Date().toISOString() } });
    const result = await wgsService.getWg(wg.id);
    expect(result.id).toBe(wg.id);
  });

  it('throws NotFoundError for a non-existent id', async () => {
    await expect(wgsService.getWg(999999)).rejects.toThrow('WG nicht gefunden');
  });
});

describe('updateWg', () => {
  it('updates name/icon/themeColor for a member', async () => {
    const user = await createUser();
    const wg = await createWgWithMember(user.id);
    const result = await wgsService.updateWg(user.id, wg.id, { name: '  Neuer Name  ', icon: '🎉' });
    expect(result.name).toBe('Neuer Name');
    expect(result.icon).toBe('🎉');
  });

  it('throws ValidationError when name is provided but empty', async () => {
    const user = await createUser();
    const wg = await createWgWithMember(user.id);
    await expect(wgsService.updateWg(user.id, wg.id, { name: '   ' })).rejects.toThrow('Name ist erforderlich');
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const user = await createUser();
    const outsider = await createUser('outsider@test.de', 'Outsider');
    const wg = await createWgWithMember(user.id);
    await expect(wgsService.updateWg(outsider.id, wg.id, { icon: '🎉' })).rejects.toThrow();
  });
});

describe('listMembers', () => {
  it('lists members for a requester who is a member', async () => {
    const user = await createUser();
    const wg = await createWgWithMember(user.id);
    const members = await wgsService.listMembers(user.id, wg.id);
    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe(user.id);
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const user = await createUser();
    const outsider = await createUser('outsider2@test.de', 'Outsider');
    const wg = await createWgWithMember(user.id);
    await expect(wgsService.listMembers(outsider.id, wg.id)).rejects.toThrow();
  });
});

describe('updateMemberStatus', () => {
  it('throws ValidationError when wgId is missing', async () => {
    await expect(wgsService.updateMemberStatus(1, {})).rejects.toThrow('wgId ist erforderlich');
  });

  it('updates isHome/mood without firing a shopping notification', async () => {
    const user = await createUser();
    const wg = await createWgWithMember(user.id);
    const result = await wgsService.updateMemberStatus(user.id, { wgId: wg.id, isHome: false, mood: 'Busy' });
    expect(result.isHome).toBe(false);
    expect(result.mood).toBe('Busy');
  });

  it('fires the shopping notification path when isShopping flips false -> true', async () => {
    const user = await createUser();
    const wg = await createWgWithMember(user.id);
    // sollte nicht werfen - notifyShopping/sendPushToUser laufen fire-and-forget
    // und fangen ihre eigenen Fehler ab (kein RESEND/VAPID in Testumgebung).
    const result = await wgsService.updateMemberStatus(user.id, { wgId: wg.id, isShopping: true });
    expect(result.isShopping).toBe(true);
  });

  it('does not treat isShopping staying true as a new event', async () => {
    const user = await createUser();
    const wg = await createWgWithMember(user.id);
    await wgsService.updateMemberStatus(user.id, { wgId: wg.id, isShopping: true });
    const result = await wgsService.updateMemberStatus(user.id, { wgId: wg.id, isShopping: true, mood: 'Chill' });
    expect(result.isShopping).toBe(true);
    expect(result.mood).toBe('Chill');
  });
});

describe('removeWgMember', () => {
  it('throws AccessDeniedError when requester is not a member', async () => {
    const user = await createUser();
    const outsider = await createUser('outsider3@test.de', 'Outsider');
    const wg = await createWgWithMember(user.id);
    await expect(wgsService.removeWgMember(outsider.id, wg.id, user.id)).rejects.toThrow();
  });

  it('throws NotFoundError when the target membership does not exist', async () => {
    const user = await createUser();
    const other = await createUser('other@test.de', 'Other');
    const wg = await createWgWithMember(user.id);
    await expect(wgsService.removeWgMember(user.id, wg.id, other.id)).rejects.toThrow('Mitgliedschaft nicht gefunden');
  });

  it('removes a member without deleting the WG when others remain', async () => {
    const user = await createUser();
    const other = await createUser('other2@test.de', 'Other2');
    const wg = await createWgWithMember(user.id);
    await prisma.membership.create({ data: { userId: other.id, wgId: wg.id, role: 'member' } });

    const result = await wgsService.removeWgMember(user.id, wg.id, other.id);
    expect(result.wgDeleted).toBe(false);

    const stillExists = await prisma.wG.findUnique({ where: { id: wg.id } });
    expect(stillExists).not.toBeNull();
  });

  it('cascades and deletes the WG when the last member leaves', async () => {
    const user = await createUser();
    const wg = await createWgWithMember(user.id);

    await prisma.shoppingItem.create({ data: { wgId: wg.id, name: 'Milch', category: 'Essen' } });
    await prisma.todo.create({ data: { wgId: wg.id, title: 'Müll raus' } });
    await prisma.calendarEvent.create({ data: { wgId: wg.id, date: '2026-01-01', title: 'Event' } });
    await prisma.financeItem.create({ data: { wgId: wg.id, amount: 10, description: 'Kauf', paidById: user.id } });
    await prisma.message.create({ data: { wgId: wg.id, type: 'text', content: 'hi', timestamp: new Date().toISOString() } });
    await prisma.invitation.create({ data: { wgId: wg.id, token: 'tok123', role: 'member', maxUses: 5 } });

    const result = await wgsService.removeWgMember(user.id, wg.id, user.id);
    expect(result.wgDeleted).toBe(true);

    expect(await prisma.wG.findUnique({ where: { id: wg.id } })).toBeNull();
    expect(await prisma.shoppingItem.count({ where: { wgId: wg.id } })).toBe(0);
    expect(await prisma.todo.count({ where: { wgId: wg.id } })).toBe(0);
    expect(await prisma.calendarEvent.count({ where: { wgId: wg.id } })).toBe(0);
    expect(await prisma.financeItem.count({ where: { wgId: wg.id } })).toBe(0);
    expect(await prisma.message.count({ where: { wgId: wg.id } })).toBe(0);
    expect(await prisma.invitation.count({ where: { wgId: wg.id } })).toBe(0);
    expect(await prisma.membership.count({ where: { wgId: wg.id } })).toBe(0);
  });
});

describe('getInvitationByToken', () => {
  it('returns the invitation with wgName for a valid token', async () => {
    const wg = await prisma.wG.create({ data: { name: 'Invite-WG', createdAt: new Date().toISOString() } });
    await prisma.invitation.create({ data: { wgId: wg.id, token: 'valid-token', role: 'member', maxUses: 5 } });
    const result = await wgsService.getInvitationByToken('valid-token');
    expect(result.wgName).toBe('Invite-WG');
  });

  it('throws NotFoundError for an unknown token', async () => {
    await expect(wgsService.getInvitationByToken('nope')).rejects.toThrow('Ungültiger oder abgelaufener Einladungs-Token');
  });
});

describe('createInvitation', () => {
  it('creates an invitation for a member', async () => {
    const user = await createUser();
    const wg = await createWgWithMember(user.id);
    const invite = await wgsService.createInvitation(user.id, wg.id, { role: 'member', maxUses: 3 });
    expect(invite.wgId).toBe(wg.id);
    expect(invite.maxUses).toBe(3);
  });

  it('throws NotFoundError for a non-existent WG', async () => {
    const user = await createUser();
    await expect(wgsService.createInvitation(user.id, 999999, {})).rejects.toThrow('WG nicht gefunden');
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const user = await createUser();
    const outsider = await createUser('outsider4@test.de', 'Outsider');
    const wg = await createWgWithMember(user.id);
    await expect(wgsService.createInvitation(outsider.id, wg.id, {})).rejects.toThrow('Du bist kein Mitglied dieser WG');
  });
});

describe('joinViaInvitation', () => {
  it('throws ValidationError when token or userId is missing', async () => {
    await expect(wgsService.joinViaInvitation(null, 1)).rejects.toThrow('Token und userId sind erforderlich');
  });

  it('throws NotFoundError for an unknown token', async () => {
    const user = await createUser();
    await expect(wgsService.joinViaInvitation('nope', user.id)).rejects.toThrow('Einladung nicht gefunden');
  });

  it('throws GoneError when maxUses is exhausted', async () => {
    const wg = await prisma.wG.create({ data: { name: 'Full WG', createdAt: new Date().toISOString() } });
    await prisma.invitation.create({ data: { wgId: wg.id, token: 'used-up', role: 'member', usedCount: 2, maxUses: 2 } });
    const user = await createUser();
    await expect(wgsService.joinViaInvitation('used-up', user.id)).rejects.toThrow('bereits abgelaufen');
  });

  it('never expires when maxUses is -1 (unlimited)', async () => {
    const wg = await prisma.wG.create({ data: { name: 'Unlimited WG', createdAt: new Date().toISOString() } });
    await prisma.invitation.create({ data: { wgId: wg.id, token: 'unlimited', role: 'member', usedCount: 50, maxUses: -1 } });
    const user = await createUser();
    const result = await wgsService.joinViaInvitation('unlimited', user.id);
    expect(result.wgId).toBe(wg.id);
  });

  it('throws ConflictError when the user is already a member', async () => {
    const user = await createUser();
    const wg = await createWgWithMember(user.id);
    await prisma.invitation.create({ data: { wgId: wg.id, token: 'dup-join', role: 'member', maxUses: 5 } });
    await expect(wgsService.joinViaInvitation('dup-join', user.id)).rejects.toThrow('bereits Mitglied dieser WG');
  });

  it('creates a membership and increments usedCount on success', async () => {
    const wg = await prisma.wG.create({ data: { name: 'Join WG', createdAt: new Date().toISOString() } });
    await prisma.invitation.create({ data: { wgId: wg.id, token: 'join-me', role: 'member', usedCount: 0, maxUses: 5 } });
    const user = await createUser();

    const result = await wgsService.joinViaInvitation('join-me', user.id);
    expect(result.wgId).toBe(wg.id);

    const membership = await prisma.membership.findUnique({ where: { userId_wgId: { userId: user.id, wgId: wg.id } } });
    expect(membership).not.toBeNull();

    const invite = await prisma.invitation.findUnique({ where: { token: 'join-me' } });
    expect(invite.usedCount).toBe(1);
  });
});

describe('getMembership / getMembershipsForWg / getMembershipsForUser', () => {
  it('getMembership returns null when there is no membership', async () => {
    const user = await createUser();
    const result = await wgsService.getMembership(user.id, 999999);
    expect(result).toBeNull();
  });

  it('getMembershipsForWg includes user data', async () => {
    const user = await createUser();
    const wg = await createWgWithMember(user.id);
    const memberships = await wgsService.getMembershipsForWg(wg.id);
    expect(memberships[0].user.email).toBe(user.email);
  });

  it('getMembershipsForUser includes nested wg + sibling memberships', async () => {
    const user = await createUser();
    const wg = await createWgWithMember(user.id);
    const memberships = await wgsService.getMembershipsForUser(user.id);
    expect(memberships[0].wg.id).toBe(wg.id);
    expect(memberships[0].wg.memberships).toHaveLength(1);
  });
});
