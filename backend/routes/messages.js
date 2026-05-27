const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// -- MESSAGES / CHAT --

// GET /api/messages
router.get('/', async (req, res) => {
  try {
    const { wgId } = req.query;
    if (!wgId) return res.status(400).json({ error: 'wgId parameter ist erforderlich' });

    const uId = parseInt(req.user.userId);
    const wId = parseInt(wgId);

    // Ownership Check
    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: uId, wgId: wId } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    const messages = await prisma.message.findMany({
      where: { wgId: parseInt(wgId) },
      include: { sender: { select: { name: true } } },
      orderBy: { timestamp: 'asc' }
    });

    res.json(messages.map(m => ({
      ...m,
      senderName: m.sender ? m.sender.name : (m.type === 'system' ? 'System' : 'Unbekannt')
    })));
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// POST /api/messages
router.post('/', async (req, res) => {
  try {
    const { wgId, content, type } = req.body;

    if (!wgId || !content) {
      return res.status(400).json({ error: 'wgId und content sind erforderlich' });
    }

    const uId = parseInt(req.user.userId);
    const wId = parseInt(wgId);

    // Ownership Check
    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: uId, wgId: wId } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    const newMessage = await prisma.message.create({
      data: {
        wgId: parseInt(wgId),
        type: type || 'user',
        senderId: uId,
        content,
        timestamp: new Date().toISOString()
      },
      include: { sender: { select: { name: true } } }
    });

    res.status(201).json({
      ...newMessage,
      senderName: newMessage.sender ? newMessage.sender.name : 'Unbekannt'
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

module.exports = router;
