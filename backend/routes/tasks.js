const express = require('express');
const router = express.Router();
const data = require('../data');
const prisma = require('../lib/prisma');

// -- TODOS --
// GET /api/todos
router.get('/', async (req, res) => {
  try {
    const { wgId, assigneeId } = req.query;
    if (!wgId) return res.status(400).json({ error: 'wgId parameter is required' });

    // Validate if the requesting user is part of the requested WG
    const membership = await prisma.membership.findUnique({
      where: {
        userId_wgId: {
          userId: req.user.userId,
          wgId: parseInt(wgId)
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Zugriff verweigert: Du bist kein Mitglied dieser WG' });
    }

    const where = {
      wgId: parseInt(wgId)
    };

    if (assigneeId) {
      where.assigneeId = parseInt(assigneeId);
    }

    const items = await prisma.todo.findMany({
      where
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/todos
router.post('/', async (req, res) => {
  const { wgId, title } = req.body;
  if (!wgId) return res.status(400).json({ error: 'wgId parameter is required' });
  if (!title) return res.status(400).json({ error: 'title parameter is required' });

  // Ownership Check
  const isMember = await prisma.membership.findUnique({
    where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
  });
  if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

  const newTodo = { id: Date.now(), ...req.body, completed: false };
  data.todos.push(newTodo);
  res.status(201).json(newTodo);
});

// PUT /api/todos/:id
router.put('/:id', async (req, res) => {
  const item = data.todos.find(i => i.id === parseInt(req.params.id));
  if (item) {
    // Ownership Check
    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: req.user.userId, wgId: item.wgId } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });
    const wasCompleted = item.completed;
    if (req.body.completed !== undefined) item.completed = req.body.completed;
    if (req.body.assigneeId !== undefined) item.assigneeId = req.body.assigneeId;

    // Log to messages if just completed
    if (item.completed && !wasCompleted) {
      data.messages.push({
        id: Date.now(),
        wgId: item.wgId,
        type: 'system',
        content: `Aufgabe abgeschlossen: "${item.title}"`,
        timestamp: new Date().toISOString()
      });
    }

    res.json(item);
  } else res.status(404).send('Not found');
});

module.exports = router;
