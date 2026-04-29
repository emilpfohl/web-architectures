const express = require('express');
const router = express.Router();
const data = require('../data');
const prisma = require('../lib/prisma');

// -- MESSAGES / CHAT --

// GET /api/messages
router.get('/', (req, res) => {
  const { wgId } = req.query;
  if (!wgId) return res.status(400).json({ error: 'wgId parameter is required' });

  // Ownership Check
  const isMember = await prisma.membership.findUnique({
    where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
  });
  if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

  const items = data.messages
    .filter(m => m.wgId === parseInt(wgId))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Chronological
  
  res.json(items);
});

// POST /api/messages
router.post('/', (req, res) => {
  const { wgId, content, senderId, type } = req.body;
  
  if (!wgId || !content) {
    return res.status(400).json({ error: 'wgId and content are required' });
  }

  // Ownership Check
  const isMember = await prisma.membership.findUnique({
    where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
  });
  if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

  const newMessage = {
    id: Date.now(),
    wgId: parseInt(wgId),
    type: type || 'user',
    senderId: senderId ? parseInt(senderId) : null,
    content,
    timestamp: new Date().toISOString()
  };

  data.messages.push(newMessage);
  res.status(201).json(newMessage);
});

module.exports = router;
