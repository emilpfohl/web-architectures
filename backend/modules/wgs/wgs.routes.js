const express = require('express');
const router = express.Router();
const wgsService = require('./wgs.service');
const { handleServiceError } = require('../../lib/errorHandler');

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const wgs = await wgsService.listWgs(userId ? parseInt(userId) : undefined);
    res.json(wgs);
  } catch (error) {
    handleServiceError(error, res, 'Error fetching WGs:');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const wg = await wgsService.getWg(parseInt(req.params.id));
    res.json(wg);
  } catch (error) {
    handleServiceError(error, res, 'Error fetching WG:');
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, userId } = req.body;
    const newWg = await wgsService.createWg({ name, userId });
    res.status(201).json(newWg);
  } catch (error) {
    handleServiceError(error, res, 'Error creating WG:');
  }
});

router.put('/:id', async (req, res) => {
  try {
    const wgId = parseInt(req.params.id);
    const updatedWg = await wgsService.updateWg(parseInt(req.user.userId), wgId, req.body);
    res.json(updatedWg);
  } catch (error) {
    handleServiceError(error, res, 'Error updating WG:');
  }
});

router.get('/:id/members', async (req, res) => {
  try {
    const wgId = parseInt(req.params.id);
    const members = await wgsService.listMembers(parseInt(req.user.userId), wgId);
    res.json(members);
  } catch (error) {
    handleServiceError(error, res, 'Error fetching WG members:');
  }
});

router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const wgId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    const result = await wgsService.removeWgMember(parseInt(req.user.userId), wgId, targetUserId);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Error removing WG member:');
  }
});

router.post('/:id/invitations', async (req, res) => {
  try {
    const wgId = parseInt(req.params.id);
    const { token, role, maxUses } = req.body;
    const newInvite = await wgsService.createInvitation(parseInt(req.user.userId), wgId, { token, role, maxUses });
    res.status(201).json(newInvite);
  } catch (error) {
    handleServiceError(error, res, 'Error creating invitation:');
  }
});

module.exports = router;
