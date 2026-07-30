const express = require('express');
const router = express.Router();
const { getWgInfo, upsertWgInfo } = require('./wginfo.service');
const { handleServiceError } = require('../../lib/errorHandler');

// GET /api/wginfo?wgId=
router.get('/', async (req, res) => {
  try {
    const info = await getWgInfo(parseInt(req.user.userId), parseInt(req.query.wgId));
    res.json(info);
  } catch (error) {
    handleServiceError(error, res, 'Error fetching wg info:');
  }
});

// PUT /api/wginfo
router.put('/', async (req, res) => {
  try {
    const { wgId, ...data } = req.body;
    const info = await upsertWgInfo(parseInt(req.user.userId), parseInt(wgId), data);
    res.json(info);
  } catch (error) {
    handleServiceError(error, res, 'Error updating wg info:');
  }
});

module.exports = router;
