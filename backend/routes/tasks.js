const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { notifyNewTask } = require('../lib/notifications');

// -- TODOS --
// GET /api/todos
router.get('/', async (req, res) => {
  try {
    const { wgId, assigneeId } = req.query;
    if (!wgId) return res.status(400).json({ error: 'wgId parameter is required' });

    const uId = parseInt(req.user.userId);
    const wId = parseInt(wgId);

    // Validate if the requesting user is part of the requested WG
    const membership = await prisma.membership.findUnique({
      where: {
        userId_wgId: { userId: uId, wgId: wId }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Zugriff verweigert: Du bist kein Mitglied dieser WG' });
    }

    const where = { wgId: wId };
    if (assigneeId) {
      where.assigneeId = parseInt(assigneeId);
    }

    const items = await prisma.todo.findMany({
      where,
      include: { assignee: { select: { name: true } } }
    });

    res.json(items.map(t => ({
      ...t,
      assignee: t.assignee ? t.assignee.name : 'Niemand'
    })));
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/todos
router.post('/', async (req, res) => {
  try {
    const { wgId, title, assigneeId } = req.body;
    if (!wgId || !title) return res.status(400).json({ error: 'wgId und title sind erforderlich' });

    const uId = parseInt(req.user.userId);
    const wId = parseInt(wgId);

    // Ownership Check
    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: uId, wgId: wId } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    let finalAssigneeId = null;
    if (req.body.assignee) {
      const nameLower = req.body.assignee.trim().toLowerCase();
      const memberships = await prisma.membership.findMany({
        where: { wgId: wId },
        include: { user: true }
      });
      const match = memberships.find(m => m.user.name.trim().toLowerCase() === nameLower);
      if (match) {
        finalAssigneeId = match.userId;
      }
    } else if (assigneeId) {
      finalAssigneeId = parseInt(assigneeId);
    }

    const newTodo = await prisma.todo.create({
      data: {
        wgId: wId,
        title,
        assigneeId: finalAssigneeId,
        completed: false
      }
    });

    res.status(201).json(newTodo);

    const creator = await prisma.user.findUnique({ where: { id: uId }, select: { name: true } });
    notifyNewTask({ wgId: wId, creatorId: uId, creatorName: creator?.name || 'Jemand', taskTitle: title })
      .catch(err => console.error('Error sending new task notification:', err));
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/todos/:id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo) return res.status(404).json({ error: 'Aufgabe nicht gefunden' });

    const uId = parseInt(req.user.userId);
    
    // Ownership Check
    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: uId, wgId: todo.wgId } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: {
        completed: req.body.completed !== undefined ? req.body.completed : todo.completed,
        assigneeId: req.body.assigneeId !== undefined ? (req.body.assigneeId ? parseInt(req.body.assigneeId) : null) : todo.assigneeId
      }
    });

    // Log to messages if just completed
    if (updatedTodo.completed && !todo.completed) {
      await prisma.message.create({
        data: {
          wgId: todo.wgId,
          type: 'system',
          content: `Aufgabe abgeschlossen: "${todo.title}"`,
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
