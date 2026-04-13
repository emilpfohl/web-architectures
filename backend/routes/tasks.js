const express = require('express');
const router = express.Router();
const data = require('../data');

// -- TODOS --
// GET /api/todos
router.get('/', (req, res) => {
  const { wgId, assigneeId } = req.query;
  if (!wgId) return res.status(400).json({ error: 'wgId parameter is required' });

  let items = data.todos;
  if (wgId) items = items.filter(i => i.wgId === parseInt(wgId));
  if (assigneeId) items = items.filter(i => i.assigneeId === parseInt(assigneeId));
  res.json(items);
});

// POST /api/todos
router.post('/', (req, res) => {
  const { wgId, title } = req.body;
  if (!wgId) return res.status(400).json({ error: 'wgId parameter is required' });
  if (!title) return res.status(400).json({ error: 'title parameter is required' });

  const newTodo = { id: Date.now(), ...req.body, completed: false };
  data.todos.push(newTodo);
  res.status(201).json(newTodo);
});

// PUT /api/todos/:id
router.put('/:id', (req, res) => {
  const item = data.todos.find(i => i.id === parseInt(req.params.id));
  if (item) {
    if (req.body.completed !== undefined) item.completed = req.body.completed;
    if (req.body.assigneeId !== undefined) item.assigneeId = req.body.assigneeId;
    res.json(item);
  } else res.status(404).send('Not found');
});

module.exports = router;
