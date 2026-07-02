const prisma = require('../../lib/prisma');
const { isWgMember } = require('../../lib/membership');
const { ValidationError, AccessDeniedError } = require('../../lib/errors');

async function listMessages(userId, wgId) {
  if (!wgId) throw new ValidationError('wgId parameter ist erforderlich');
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();

  const messages = await prisma.message.findMany({
    where: { wgId },
    include: { sender: { select: { name: true } } },
    orderBy: { timestamp: 'asc' }
  });

  return messages.map(m => ({
    ...m,
    senderName: m.sender ? m.sender.name : (m.type === 'system' ? 'System' : 'Unbekannt')
  }));
}

async function createMessage(userId, { wgId, content, type }) {
  if (!wgId || !content) throw new ValidationError('wgId und content sind erforderlich');
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();

  const newMessage = await prisma.message.create({
    data: {
      wgId,
      type: type || 'user',
      senderId: userId,
      content,
      timestamp: new Date().toISOString()
    },
    include: { sender: { select: { name: true } } }
  });

  return {
    ...newMessage,
    senderName: newMessage.sender ? newMessage.sender.name : 'Unbekannt'
  };
}

function deleteAllForWgOperation(wgId) {
  return prisma.message.deleteMany({ where: { wgId } });
}

module.exports = { listMessages, createMessage, deleteAllForWgOperation };
