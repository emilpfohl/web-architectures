const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const pushService = require('./push.service');
const { VAPID_PUBLIC_KEY } = require('../../lib/webpush');
const { handleServiceError } = require('../../lib/errorHandler');

// GET /api/push/public-key (public, needed before/without a session)
router.get('/public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY || null });
});

// POST /api/push/subscribe
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    await pushService.upsertSubscription(parseInt(req.user.userId), req.body);
    res.status(201).json({ message: 'Subscription gespeichert' });
  } catch (error) {
    handleServiceError(error, res, 'Error saving push subscription:');
  }
});

module.exports = router;
