const webpush = require('web-push');
const prisma = require('./prisma');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.error('VAPID keys are not configured in .env - web push is disabled.');
}

async function sendPushToUser(userId, payload) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });

    await Promise.all(subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          JSON.stringify(payload)
        );
      } catch (error) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error('Error sending push notification:', error.message || error);
        }
      }
    }));
  } catch (error) {
    console.error('Unexpected error in sendPushToUser:', error);
  }
}

module.exports = { sendPushToUser, VAPID_PUBLIC_KEY };
