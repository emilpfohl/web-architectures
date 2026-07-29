require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const authenticate = require('./middleware/authenticate');

const authRouter = require('./modules/auth/auth.routes');
const usersRouter = require('./modules/auth/users.routes');
const pushRouter = require('./modules/push/push.routes');
const tasksRouter = require('./modules/tasks/tasks.routes');
const messagesRouter = require('./modules/messages/messages.routes');
const wgsRouter = require('./modules/wgs/wgs.routes');
const wgsStatusRouter = require('./modules/wgs/status.routes');
const invitationsRouter = require('./modules/wgs/invitations.routes');
const shoppingRouter = require('./modules/shopping/shopping.routes');
const calendarRouter = require('./modules/calendar/calendar.routes');
const financesRouter = require('./modules/finances/finances.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:5174'];

// Läuft hinter dem Apache-Reverse-Proxy (Hetzner) - dadurch erkennt Express
// HTTPS und die echte Client-IP korrekt (req.secure, req.ip, secure cookies).
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true
  }
});

io.on('connection', (socket) => {
  socket.on('chat eintrag', (entryData) => {
    socket.broadcast.emit('chat eintrag', entryData);
  });
});

// Security-Header (Helmet) - setzt u.a. HSTS, X-Content-Type-Options,
// X-Frame-Options und eine CSP. connect-src erlaubt 'self' + ws/wss für
// den Socket.io-Client (gleicher Origin, aber ws-Scheme unterscheidet sich).
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// --- 1) API-Routen ZUERST, bevor Static/SPA-Fallback etwas verschlucken kann ---

// Register Auth Router (NOT protected)
app.use('/api/auth', authRouter);
app.use('/api/push', pushRouter);

// Register Protected Routers (authenticate läuft nur, wenn die Route
// tatsächlich existiert - unbekannte /api-Pfade fallen sonst zum 404
// weiter unten durch, statt vorher pauschal mit 401 geblockt zu werden)
app.use('/api/todos', authenticate, tasksRouter);
app.use('/api/messages', authenticate, messagesRouter);
app.use('/api/users', authenticate, wgsStatusRouter);
app.use('/api/users', authenticate, usersRouter);
app.use('/api/wgs', authenticate, wgsRouter);
app.use('/api/invitations', authenticate, invitationsRouter);
app.use('/api/shopping', authenticate, shoppingRouter);
app.use('/api/calendar', authenticate, calendarRouter);
app.use('/api/finances', authenticate, financesRouter);

// Unbekannte /api-Pfade sauber als JSON-404 beantworten, statt sie in den
// SPA-Fallback laufen zu lassen (der würde HTML statt JSON liefern).
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// --- 2) Statische Assets aus dem Vite-Build ausliefern ---
// Erwartet den Build-Inhalt (dist/*) kopiert nach backend/public/,
// damit Backend + Frontend-Build als ein einziges Verzeichnis deploybar sind.
const FRONTEND_DIST = path.join(__dirname, 'public');
app.use(express.static(FRONTEND_DIST, {
  setHeaders: (res, filePath) => {
    // Gehashte Assets (Vite-Build) dürfen sehr lange gecacht werden.
    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// --- 3) SPA-Fallback: alles übrige -> index.html, NIE cachen ---
// Express 5 wirft bei app.get('*', ...) einen Fehler (geänderte
// path-to-regexp-Syntax). Eine abschließende Middleware ohne Pfad ist die
// robusteste Lösung (funktioniert in Express 4 und 5 gleichermaßen).
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
