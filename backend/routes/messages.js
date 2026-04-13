const express = require('express');
const router = express.Router();
const data = require('../data');

// -- MESSAGES / CHAT --

// GET /api/messages
router.get('/', (req, res) => {
  const { wgId } = req.query;
  if (!wgId) return res.status(400).json({ error: 'wgId parameter is required' });

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
