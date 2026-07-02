const prisma = require('./prisma');

async function logActivity(wgId, content) {
  await prisma.message.create({
    data: {
      wgId,
      type: 'system',
      content,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = { logActivity };
