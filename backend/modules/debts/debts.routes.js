const express = require('express');
const router = express.Router();
const debtsService = require('./debts.service');
const { handleServiceError } = require('../../lib/errorHandler');

router.get('/', async (req, res) => {
  try {
    const { wgId } = req.query;
    const debts = await debtsService.listDebts(req.user.userId, parseInt(wgId));
    res.json(debts);
  } catch (error) {
    handleServiceError(error, res, 'Error fetching debts:');
  }
});

router.post('/', async (req, res) => {
  try {
    const { wgId, fromUserId, toUserId, amount, description } = req.body;
    const newDebt = await debtsService.createDebt(req.user.userId, {
      wgId: wgId ? parseInt(wgId) : undefined,
      fromUserId: fromUserId ? parseInt(fromUserId) : undefined,
      toUserId: toUserId ? parseInt(toUserId) : undefined,
      amount,
      description
    });
    res.status(201).json(newDebt);
  } catch (error) {
    handleServiceError(error, res, 'Error creating debt:');
  }
});

router.post('/:id/settle', async (req, res) => {
  try {
    const updated = await debtsService.settleDebt(req.user.userId, parseInt(req.params.id));
    res.json(updated);
  } catch (error) {
    handleServiceError(error, res, 'Error settling debt:');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await debtsService.deleteDebt(req.user.userId, parseInt(req.params.id));
    res.json({ message: 'Schuld gelöscht' });
  } catch (error) {
    handleServiceError(error, res, 'Error deleting debt:');
  }
});

module.exports = router;
