const express = require('express');
const router = express.Router();
const wgsService = require('./wgs.service');
const { handleServiceError } = require('../../lib/errorHandler');

router.get('/:token', async (req, res) => {
  try {
    const invite = await wgsService.getInvitationByToken(req.params.token);
    res.json(invite);
  } catch (error) {
    handleServiceError(error, res, 'Error fetching invitation:');
  }
});

router.post('/join', async (req, res) => {
  try {
    const { token, userId } = req.body;
    const result = await wgsService.joinViaInvitation(token, userId ? parseInt(userId) : undefined);
    res.status(200).json({ message: 'Erfolgreich beigetreten', wgId: result.wgId });
  } catch (error) {
    handleServiceError(error, res, 'Error joining via invitation:');
  }
});

module.exports = router;
