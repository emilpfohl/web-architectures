const express = require('express');
const router = express.Router();
const financesService = require('./finances.service');
const { handleServiceError } = require('../../lib/errorHandler');

router.get('/', async (req, res) => {
  try {
    const { wgId, paidById } = req.query;
    const expenses = await financesService.listExpenses(
      req.user.userId,
      parseInt(wgId),
      paidById ? parseInt(paidById) : undefined
    );
    res.json(expenses);
  } catch (error) {
    handleServiceError(error, res, 'Error fetching expenses:');
  }
});

router.post('/', async (req, res) => {
  try {
    const { wgId, paidById, amount, description, paidBy } = req.body;
    const newExpense = await financesService.createExpense(req.user.userId, {
      wgId: wgId ? parseInt(wgId) : undefined,
      paidById: paidById ? parseInt(paidById) : undefined,
      amount,
      description,
      paidBy
    });
    res.status(201).json(newExpense);
  } catch (error) {
    handleServiceError(error, res, 'Error creating expense:');
  }
});

router.post('/settle', async (req, res) => {
  try {
    const { wgId } = req.query;
    await financesService.settleExpenses(req.user.userId, parseInt(wgId));
    res.json({ message: 'Erfolgreich abgerechnet' });
  } catch (error) {
    handleServiceError(error, res, 'Error settling finances:');
  }
});

module.exports = router;
