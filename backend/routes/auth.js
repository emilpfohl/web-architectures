const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const { notifyPasswordChanged } = require('../lib/notifications');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not defined in .env');
  process.exit(1);
}

// GET /api/auth/me
// Returns current logged in user based on the cookie
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Nicht authentifiziert' });

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) return res.status(401).json({ error: 'Ungültiger Token' });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) return res.status(401).json({ error: 'Nutzer nicht gefunden' });

    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ error: 'Nicht authentifiziert' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    let { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, Passwort und Name sind erforderlich.' });
    }

    email = email.toLowerCase().trim();

    if (password.length < 8) {
      return res.status(400).json({ error: 'Das Passwort muss mindestens 8 Zeichen lang sein.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'E-Mail ist bereits vergeben.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword
      }
    });

    res.status(201).json({ message: 'Registrierung erfolgreich', userId: newUser.id });
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ error: 'Interner Serverfehler', details: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(401).json({ error: 'E-Mail oder Passwort ungültig.' });
    }

    email = email.toLowerCase().trim();
    console.log('Login attempt for:', email);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('Login failed: User not found:', email);
      return res.status(401).json({ error: 'E-Mail oder Passwort ungültig.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('Login failed: Invalid password for:', email);
      return res.status(401).json({ error: 'E-Mail oder Passwort ungültig.' });
    }

    // Sign JWT valid for 24 hours
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set JWT in HTTPOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    console.log('Login successful for:', email);
    res.status(200).json({
      message: 'Login erfolgreich',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
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
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name ist erforderlich' });
    }

    const uId = parseInt(req.user.userId);
    const updatedUser = await prisma.user.update({
      where: { id: uId },
      data: { name: name.trim() }
    });

    res.json({ id: updatedUser.id, name: updatedUser.name, email: updatedUser.email });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Aktuelles und neues Passwort sind erforderlich' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Das neue Passwort muss mindestens 8 Zeichen lang sein' });
    }

    const uId = parseInt(req.user.userId);
    const user = await prisma.user.findUnique({ where: { id: uId } });
    if (!user) return res.status(401).json({ error: 'Nicht authentifiziert' });

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: uId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Passwort erfolgreich geändert' });

    notifyPasswordChanged({ userEmail: user.email, userName: user.name })
      .catch(err => console.error('Error sending password changed notification:', err));
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

module.exports = router;
