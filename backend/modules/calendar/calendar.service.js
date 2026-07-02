const prisma = require('../../lib/prisma');
const { isWgMember } = require('../../lib/membership');
const { ValidationError, AccessDeniedError } = require('../../lib/errors');

async function listEvents(userId, wgId) {
  if (!wgId) throw new ValidationError('wgId parameter ist erforderlich');
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();

  return prisma.calendarEvent.findMany({ where: { wgId } });
}

async function createEvent(userId, { wgId, date, title }) {
  if (!wgId || !date || !title) throw new ValidationError('wgId, date und title sind erforderlich');
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();

  return prisma.calendarEvent.create({ data: { wgId, date, title } });
}

function deleteAllForWgOperation(wgId) {
  return prisma.calendarEvent.deleteMany({ where: { wgId } });
}

module.exports = { listEvents, createEvent, deleteAllForWgOperation };
