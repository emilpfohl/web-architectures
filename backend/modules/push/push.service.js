const prisma = require('../../lib/prisma');
const { ValidationError } = require('../../lib/errors');

async function upsertSubscription(userId, { endpoint, keys }) {
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new ValidationError('endpoint und keys sind erforderlich');
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId, p256dh: keys.p256dh, auth: keys.auth },
    create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth }
  });
}

module.exports = { upsertSubscription };
