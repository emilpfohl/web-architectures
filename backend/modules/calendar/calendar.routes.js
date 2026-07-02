const express = require('express');
const router = express.Router();
const calendarService = require('./calendar.service');
const { handleServiceError } = require('../../lib/errorHandler');

router.get('/', async (req, res) => {
  try {
    const { wgId } = req.query;
    const events = await calendarService.listEvents(parseInt(req.user.userId), wgId ? parseInt(wgId) : undefined);
    res.json(events);
  } catch (error) {
    handleServiceError(error, res, 'Error fetching calendar:');
  }
});

router.post('/', async (req, res) => {
  try {
    const { wgId, date, title } = req.body;
    const newEvent = await calendarService.createEvent(parseInt(req.user.userId), {
      wgId: wgId ? parseInt(wgId) : undefined,
      date,
      title
    });
    res.status(201).json(newEvent);
  } catch (error) {
    handleServiceError(error, res, 'Error creating calendar event:');
  }
});

module.exports = router;
