const express = require('express');
const router = express.Router();
const messagesService = require('./messages.service');
const { handleServiceError } = require('../../lib/errorHandler');

router.get('/', async (req, res) => {
  try {
    const { wgId } = req.query;
    const messages = await messagesService.listMessages(parseInt(req.user.userId), wgId ? parseInt(wgId) : undefined);
    res.json(messages);
  } catch (error) {
    handleServiceError(error, res, 'Error fetching messages:');
  }
});

router.post('/', async (req, res) => {
  try {
    const { wgId, content, type } = req.body;
    const newMessage = await messagesService.createMessage(parseInt(req.user.userId), {
      wgId: wgId ? parseInt(wgId) : undefined,
      content,
      type
    });
    res.status(201).json(newMessage);
  } catch (error) {
    handleServiceError(error, res, 'Error creating message:');
  }
});

module.exports = router;
