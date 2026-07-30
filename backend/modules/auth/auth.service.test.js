import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { resetDb } from '../../test/resetDb.js';

const prisma = require('../../lib/prisma');
const authService = require('./auth.service.js');

const JWT_SECRET = process.env.JWT_SECRET;

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe('register', () => {
  it('creates a user and returns the new userId', async () => {
    const result = await authService.register({
      email: 'anna@test.de',
      password: 'password123',
      name: 'Anna'
    });
    expect(result.userId).toBeTypeOf('number');

    const stored = await prisma.user.findUnique({ where: { id: result.userId } });
    expect(stored.email).toBe('anna@test.de');
    expect(stored.password).not.toBe('password123');
  });

  it('lowercases and trims the email', async () => {
    const result = await authService.register({
      email: '  Anna@Test.DE  ',
      password: 'password123',
      name: 'Anna'
    });
    const stored = await prisma.user.findUnique({ where: { id: result.userId } });
    expect(stored.email).toBe('  anna@test.de  '.trim());
  });

  it('throws ValidationError when a required field is missing', async () => {
    await expect(authService.register({ email: 'a@test.de', password: 'password123' }))
      .rejects.toThrow('Email, Passwort und Name sind erforderlich.');
  });

  it('throws ValidationError when the password is too short', async () => {
    await expect(authService.register({ email: 'a@test.de', password: 'short', name: 'A' }))
      .rejects.toThrow('mindestens 8 Zeichen');
  });

  it('throws ConflictError on duplicate email', async () => {
    await authService.register({ email: 'dup@test.de', password: 'password123', name: 'A' });
    await expect(authService.register({ email: 'dup@test.de', password: 'password123', name: 'B' }))
      .rejects.toThrow('bereits vergeben');
  });
});

describe('login', () => {
  beforeEach(async () => {
    await authService.register({ email: 'login@test.de', password: 'password123', name: 'Login User' });
  });

  it('returns a token and user on valid credentials', async () => {
    const result = await authService.login({ email: 'login@test.de', password: 'password123' });
    expect(result.token).toBeTypeOf('string');
    expect(result.user.email).toBe('login@test.de');

    const decoded = jwt.verify(result.token, JWT_SECRET);
    expect(decoded.email).toBe('login@test.de');
  });

  it('throws AccessDeniedError for an unknown email', async () => {
    await expect(authService.login({ email: 'nobody@test.de', password: 'password123' }))
      .rejects.toThrow('E-Mail oder Passwort ungültig.');
  });

  it('throws AccessDeniedError for a wrong password, without leaking which field was wrong', async () => {
    await expect(authService.login({ email: 'login@test.de', password: 'wrongpassword' }))
      .rejects.toThrow('E-Mail oder Passwort ungültig.');
  });

  it('throws AccessDeniedError when email or password is missing', async () => {
    await expect(authService.login({ email: 'login@test.de' }))
      .rejects.toThrow('E-Mail oder Passwort ungültig.');
  });
});

describe('getCurrentUser', () => {
  it('throws AccessDeniedError when no token is provided', async () => {
    await expect(authService.getCurrentUser(undefined)).rejects.toThrow('Nicht authentifiziert');
  });

  it('throws AccessDeniedError for an invalid token', async () => {
    await expect(authService.getCurrentUser('not-a-real-token')).rejects.toThrow('Ungültiger Token');
  });

  it('throws AccessDeniedError for an expired token', async () => {
    const expiredToken = jwt.sign({ userId: 1 }, JWT_SECRET, { expiresIn: -10 });
    await expect(authService.getCurrentUser(expiredToken)).rejects.toThrow('Ungültiger Token');
  });

  it('throws AccessDeniedError when the token user no longer exists', async () => {
    const token = jwt.sign({ userId: 999999 }, JWT_SECRET, { expiresIn: '1h' });
    await expect(authService.getCurrentUser(token)).rejects.toThrow('Nutzer nicht gefunden');
  });

  it('returns the user for a valid token', async () => {
    const { userId } = await authService.register({ email: 'me@test.de', password: 'password123', name: 'Me' });
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
    const user = await authService.getCurrentUser(token);
    expect(user).toEqual({ id: userId, name: 'Me', email: 'me@test.de' });
  });
});

describe('updateProfile', () => {
  it('updates and trims the name', async () => {
    const { userId } = await authService.register({ email: 'p@test.de', password: 'password123', name: 'Old' });
    const result = await authService.updateProfile(userId, '  New Name  ');
    expect(result.name).toBe('New Name');
  });

  it('throws ValidationError when the name is empty or whitespace', async () => {
    const { userId } = await authService.register({ email: 'p2@test.de', password: 'password123', name: 'Old' });
    await expect(authService.updateProfile(userId, '   ')).rejects.toThrow('Name ist erforderlich');
  });
});

describe('changePassword', () => {
  it('updates the password on valid current password', async () => {
    const { userId } = await authService.register({ email: 'cp@test.de', password: 'password123', name: 'CP' });
    await authService.changePassword(userId, { currentPassword: 'password123', newPassword: 'newpassword456' });

    const result = await authService.login({ email: 'cp@test.de', password: 'newpassword456' });
    expect(result.token).toBeTypeOf('string');
  });

  it('throws ValidationError when a field is missing', async () => {
    const { userId } = await authService.register({ email: 'cp2@test.de', password: 'password123', name: 'CP' });
    await expect(authService.changePassword(userId, { currentPassword: 'password123' }))
      .rejects.toThrow('erforderlich');
  });

  it('throws ValidationError when the new password is too short', async () => {
    const { userId } = await authService.register({ email: 'cp3@test.de', password: 'password123', name: 'CP' });
    await expect(authService.changePassword(userId, { currentPassword: 'password123', newPassword: 'short' }))
      .rejects.toThrow('mindestens 8 Zeichen');
  });

  it('throws AccessDeniedError when the current password is wrong', async () => {
    const { userId } = await authService.register({ email: 'cp4@test.de', password: 'password123', name: 'CP' });
    await expect(authService.changePassword(userId, { currentPassword: 'wrongpass', newPassword: 'newpassword456' }))
      .rejects.toThrow('Aktuelles Passwort ist falsch');
  });

  it('throws AccessDeniedError when the user does not exist', async () => {
    await expect(authService.changePassword(999999, { currentPassword: 'x', newPassword: 'newpassword456' }))
      .rejects.toThrow('Nicht authentifiziert');
  });
});

describe('getUserById', () => {
  it('returns the user for an existing id', async () => {
    const { userId } = await authService.register({ email: 'gid@test.de', password: 'password123', name: 'GID' });
    const user = await authService.getUserById(userId);
    expect(user).toEqual({ id: userId, name: 'GID', email: 'gid@test.de' });
  });

  it('throws NotFoundError for a non-existent id', async () => {
    await expect(authService.getUserById(999999)).rejects.toThrow('User not found');
  });
});

describe('getAccessibleUsers', () => {
  it('returns members of a given wgId when the requester is a member', async () => {
    const { userId: requesterId } = await authService.register({ email: 'ga1@test.de', password: 'password123', name: 'Requester' });
    const { userId: otherId } = await authService.register({ email: 'ga2@test.de', password: 'password123', name: 'Other' });

    const wg = await prisma.wG.create({ data: { name: 'WG', createdAt: new Date().toISOString() } });
    await prisma.membership.create({ data: { userId: requesterId, wgId: wg.id, role: 'admin' } });
    await prisma.membership.create({ data: { userId: otherId, wgId: wg.id, role: 'member' } });

    const users = await authService.getAccessibleUsers(requesterId, wg.id);
    expect(users).toHaveLength(2);
    expect(users.map(u => u.id).sort()).toEqual([requesterId, otherId].sort());
  });

  it('throws AccessDeniedError when requester is not a member of the given wgId', async () => {
    const { userId: requesterId } = await authService.register({ email: 'ga3@test.de', password: 'password123', name: 'Requester' });
    const wg = await prisma.wG.create({ data: { name: 'WG', createdAt: new Date().toISOString() } });
    await expect(authService.getAccessibleUsers(requesterId, wg.id)).rejects.toThrow();
  });

  it('without wgId, returns only users sharing a wg with the requester (privacy)', async () => {
    const { userId: requesterId } = await authService.register({ email: 'ga4@test.de', password: 'password123', name: 'Requester' });
    const { userId: sharedId } = await authService.register({ email: 'ga5@test.de', password: 'password123', name: 'Shared' });
    const { userId: strangerId } = await authService.register({ email: 'ga6@test.de', password: 'password123', name: 'Stranger' });

    const sharedWg = await prisma.wG.create({ data: { name: 'Shared WG', createdAt: new Date().toISOString() } });
    await prisma.membership.create({ data: { userId: requesterId, wgId: sharedWg.id, role: 'admin' } });
    await prisma.membership.create({ data: { userId: sharedId, wgId: sharedWg.id, role: 'member' } });

    const strangerWg = await prisma.wG.create({ data: { name: 'Stranger WG', createdAt: new Date().toISOString() } });
    await prisma.membership.create({ data: { userId: strangerId, wgId: strangerWg.id, role: 'admin' } });

    const users = await authService.getAccessibleUsers(requesterId, undefined);
    const ids = users.map(u => u.id);
    expect(ids).toContain(requesterId);
    expect(ids).toContain(sharedId);
    expect(ids).not.toContain(strangerId);
  });
});

describe('module load guard: missing JWT_SECRET', () => {
  it('exits the process when JWT_SECRET is not set', async () => {
    const modulePath = require.resolve('./auth.service.js');
    delete require.cache[modulePath];
    const originalSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      expect(() => require('./auth.service.js')).toThrow('process.exit called');
      expect(exitSpy).toHaveBeenCalledWith(1);
    } finally {
      process.env.JWT_SECRET = originalSecret;
      exitSpy.mockRestore();
      errorSpy.mockRestore();
      delete require.cache[modulePath];
      require('./auth.service.js');
    }
  });
});
