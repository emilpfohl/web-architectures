const express = require('express');
const router = express.Router();
const authService = require('./auth.service');
const { handleServiceError } = require('../../lib/errorHandler');

router.get('/', async (req, res) => {
  try {
    const { wgId } = req.query;
    const users = await authService.getAccessibleUsers(
      parseInt(req.user.userId),
      wgId ? parseInt(wgId) : undefined
    );
    res.json(users);
  } catch (error) {
    handleServiceError(error, res, 'Error fetching users:');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await authService.getUserById(parseInt(req.params.id));
    res.json(user);
  } catch (error) {
    handleServiceError(error, res, 'Error fetching user:');
  }
});

module.exports = router;
