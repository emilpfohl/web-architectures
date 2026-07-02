const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../lib/prisma');
const { notifyPasswordChanged } = require('../../lib/notifications');
const { ValidationError, AccessDeniedError, NotFoundError, ConflictError } = require('../../lib/errors');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not defined in .env');
  process.exit(1);
}

async function getCurrentUser(token) {
  if (!token) throw new AccessDeniedError('Nicht authentifiziert');

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new AccessDeniedError('Ungültiger Token');
  }
  if (!decoded || !decoded.userId) throw new AccessDeniedError('Ungültiger Token');

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) throw new AccessDeniedError('Nutzer nicht gefunden');

  return { id: user.id, name: user.name, email: user.email };
}

async function register({ email, password, name }) {
  if (!email || !password || !name) {
    throw new ValidationError('Email, Passwort und Name sind erforderlich.');
  }

  email = email.toLowerCase().trim();

  if (password.length < 8) {
    throw new ValidationError('Das Passwort muss mindestens 8 Zeichen lang sein.');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ConflictError('E-Mail ist bereits vergeben.');

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: { email, name, password: hashedPassword }
  });

  return { userId: newUser.id };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new AccessDeniedError('E-Mail oder Passwort ungültig.');
  }

  email = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AccessDeniedError('E-Mail oder Passwort ungültig.');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new AccessDeniedError('E-Mail oder Passwort ungültig.');

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email } };
}

async function updateProfile(userId, name) {
  if (!name || !name.trim()) throw new ValidationError('Name ist erforderlich');

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name: name.trim() }
  });

  return { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    throw new ValidationError('Aktuelles und neues Passwort sind erforderlich');
  }
  if (newPassword.length < 8) {
    throw new ValidationError('Das neue Passwort muss mindestens 8 Zeichen lang sein');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AccessDeniedError('Nicht authentifiziert');

  const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentValid) throw new AccessDeniedError('Aktuelles Passwort ist falsch');

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  notifyPasswordChanged({ userEmail: user.email, userName: user.name })
    .catch(err => console.error('Error sending password changed notification:', err));
}

async function getUserById(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  return { id: user.id, name: user.name, email: user.email };
}

async function getAccessibleUsers(requesterId, wgId) {
  // Lazy require: Mitgliedschaften gehören zum WG-Modul, nicht zu Auth.
  const wgsService = require('../wgs/wgs.service');

  if (wgId) {
    const membership = await wgsService.getMembership(requesterId, wgId);
    if (!membership) throw new AccessDeniedError();

    const memberships = await wgsService.getMembershipsForWg(wgId);
    return memberships.map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      isHome: m.isHome,
      mood: m.mood
    }));
  }

  // Ohne wgId: nur Nutzer aus WGs, denen der Requester selbst angehört (Privacy)
  const myMemberships = await wgsService.getMembershipsForUser(requesterId);

  const accessibleUsers = new Map();
  myMemberships.forEach(m => {
    m.wg.memberships.forEach(member => {
      accessibleUsers.set(member.user.id, {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        isHome: member.isHome,
        mood: member.mood
      });
    });
  });

  return Array.from(accessibleUsers.values());
}

module.exports = {
  getCurrentUser,
  register,
  login,
  updateProfile,
  changePassword,
  getUserById,
  getAccessibleUsers
};
