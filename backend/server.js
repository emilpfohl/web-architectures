require('dotenv').config();
const http = require('http');
const express = require('express');
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
const PORT = 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  socket.on('chat eintrag', (entryData) => {
    socket.broadcast.emit('chat eintrag', entryData);
  });
});

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true })); // allow dev vite ports
app.use(express.json());
app.use(cookieParser());

// Register Auth Router (NOT protected)
app.use('/api/auth', authRouter);
app.use('/api/push', pushRouter);

// Protect all other routes
app.use(authenticate);

// Register Protected Routers
app.use('/api/todos', tasksRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/users', wgsStatusRouter);
app.use('/api/users', usersRouter);
app.use('/api/wgs', wgsRouter);
app.use('/api/invitations', invitationsRouter);
app.use('/api/shopping', shoppingRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/finances', financesRouter);

server.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
