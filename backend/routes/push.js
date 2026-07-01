const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const { VAPID_PUBLIC_KEY } = require('../lib/webpush');

// GET /api/push/public-key (public, needed before/without a session)
router.get('/public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY || null });
});

// POST /api/push/subscribe
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'endpoint und keys sind erforderlich' });
    }

    const uId = parseInt(req.user.userId);
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: uId, p256dh: keys.p256dh, auth: keys.auth },
      create: { userId: uId, endpoint, p256dh: keys.p256dh, auth: keys.auth }
    });

    res.status(201).json({ message: 'Subscription gespeichert' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

module.exports = router;
