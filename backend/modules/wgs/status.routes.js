const express = require('express');
const router = express.Router();
const wgsService = require('./wgs.service');
const { handleServiceError } = require('../../lib/errorHandler');

router.put('/status', async (req, res) => {
  try {
    const updatedMembership = await wgsService.updateMemberStatus(parseInt(req.user.userId), req.body);
    res.json(updatedMembership);
  } catch (error) {
    handleServiceError(error, res, 'Error updating status:');
  }
});

module.exports = router;
