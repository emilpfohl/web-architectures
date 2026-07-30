import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from '../test/resetDb.js';

const prisma = require('./prisma');
const { isWgMember, resolveMemberByName } = require('./membership.js');

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

async function createWgWithMembers(members) {
  const wg = await prisma.wG.create({
    data: { name: 'Test-WG', createdAt: new Date().toISOString() }
  });

  const users = [];
  for (const { name, email } of members) {
    const user = await prisma.user.create({
      data: { name, email, password: 'hashed' }
    });
    await prisma.membership.create({
      data: { userId: user.id, wgId: wg.id, role: 'member' }
    });
    users.push(user);
  }

  return { wg, users };
}

describe('isWgMember', () => {
  it('returns true when a membership exists', async () => {
    const { wg, users } = await createWgWithMembers([{ name: 'Anna', email: 'anna@test.de' }]);
    const result = await isWgMember(users[0].id, wg.id);
    expect(result).toBe(true);
  });

  it('returns false when no membership exists', async () => {
    const { wg } = await createWgWithMembers([{ name: 'Anna', email: 'anna@test.de' }]);
    const otherUser = await prisma.user.create({
      data: { name: 'Bob', email: 'bob@test.de', password: 'hashed' }
    });
    const result = await isWgMember(otherUser.id, wg.id);
    expect(result).toBe(false);
  });

  it('returns false for a non-existent wgId', async () => {
    const { users } = await createWgWithMembers([{ name: 'Anna', email: 'anna@test.de' }]);
    const result = await isWgMember(users[0].id, 999999);
    expect(result).toBe(false);
  });
});

describe('resolveMemberByName', () => {
  it('resolves the userId for a case-insensitive, trimmed name match', async () => {
    const { wg, users } = await createWgWithMembers([
      { name: 'Anna', email: 'anna@test.de' },
      { name: 'Bob', email: 'bob@test.de' }
    ]);
    const result = await resolveMemberByName(wg.id, '  bob  ');
    expect(result).toBe(users[1].id);
  });

  it('returns null when no member matches the name', async () => {
    const { wg } = await createWgWithMembers([{ name: 'Anna', email: 'anna@test.de' }]);
    const result = await resolveMemberByName(wg.id, 'Charlie');
    expect(result).toBeNull();
  });

  it('returns null when the wg has no members', async () => {
    const wg = await prisma.wG.create({
      data: { name: 'Leere WG', createdAt: new Date().toISOString() }
    });
    const result = await resolveMemberByName(wg.id, 'Anna');
    expect(result).toBeNull();
  });
});
