const express = require('express');
const router = express.Router();
const { listTodos, createTodo, updateTodo } = require('./tasks.service');
const { handleServiceError } = require('../../lib/errorHandler');

// GET /api/todos
router.get('/', async (req, res) => {
  try {
    const { wgId, assigneeId } = req.query;
    const items = await listTodos(
      parseInt(req.user.userId),
      parseInt(wgId),
      assigneeId ? parseInt(assigneeId) : undefined
    );
    res.json(items);
  } catch (error) {
    handleServiceError(error, res, 'Error fetching todos:');
  }
});

// POST /api/todos
router.post('/', async (req, res) => {
  try {
    const { wgId, title, assigneeId, assignee } = req.body;
    const newTodo = await createTodo(parseInt(req.user.userId), {
      wgId: wgId ? parseInt(wgId) : undefined,
      title,
      assigneeId: assigneeId ? parseInt(assigneeId) : undefined,
      assignee
    });
    res.status(201).json(newTodo);
  } catch (error) {
    handleServiceError(error, res, 'Error creating todo:');
  }
});

// PUT /api/todos/:id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedTodo = await updateTodo(parseInt(req.user.userId), id, {
      completed: req.body.completed,
      assigneeId: req.body.assigneeId !== undefined
        ? (req.body.assigneeId ? parseInt(req.body.assigneeId) : null)
        : undefined
    });
    res.json(updatedTodo);
  } catch (error) {
    handleServiceError(error, res, 'Error updating todo:');
  }
});

module.exports = router;
