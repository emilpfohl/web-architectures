const express = require('express');
const router = express.Router();
const shoppingService = require('./shopping.service');
const { handleServiceError } = require('../../lib/errorHandler');

router.get('/categories', (req, res) => res.json(['Lebensmittel', 'Haushalt', 'Wishlist']));

router.get('/', async (req, res) => {
  try {
    const { wgId, category } = req.query;
    const items = await shoppingService.listShoppingItems(req.user.userId, parseInt(wgId), category);
    res.json(items);
  } catch (error) {
    handleServiceError(error, res, 'Error fetching shopping items:');
  }
});

router.post('/', async (req, res) => {
  try {
    const { wgId, name, category } = req.body;
    const newItem = await shoppingService.createShoppingItem(req.user.userId, {
      wgId: wgId ? parseInt(wgId) : undefined,
      name,
      category
    });
    res.status(201).json(newItem);
  } catch (error) {
    handleServiceError(error, res, 'Error creating shopping item:');
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedItem = await shoppingService.updateShoppingItem(req.user.userId, id, req.body.checked);
    res.json(updatedItem);
  } catch (error) {
    handleServiceError(error, res, 'Error updating shopping item:');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await shoppingService.deleteShoppingItem(req.user.userId, id);
    res.status(204).send();
  } catch (error) {
    handleServiceError(error, res, 'Error deleting shopping item:');
  }
});

module.exports = router;
