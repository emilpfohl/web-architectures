const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authService = require('./auth.service');
const { handleServiceError } = require('../../lib/errorHandler');

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.cookies?.token);
    res.json(user);
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ error: 'Nicht authentifiziert' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ message: 'Registrierung erfolgreich', userId: result.userId });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    if (error.name === 'ConflictError') return res.status(409).json({ error: error.message });
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Interner Serverfehler', details: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { token, user } = await authService.login(req.body);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({ message: 'Login erfolgreich', user });
  } catch (error) {
    if (error.name === 'AccessDeniedError') return res.status(401).json({ error: error.message });
    console.error('Login error:', error);
    res.status(500).json({ error: 'Interner Serverfehler', details: error.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Erfolgreich abgemeldet' });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const updatedUser = await authService.updateProfile(parseInt(req.user.userId), req.body.name);
    res.json(updatedUser);
  } catch (error) {
    handleServiceError(error, res, 'Error updating profile:');
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, async (req, res) => {
  try {
    await authService.changePassword(parseInt(req.user.userId), req.body);
    res.json({ message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    handleServiceError(error, res, 'Error changing password:');
  }
});

module.exports = router;
