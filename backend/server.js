require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const data = require('./data');
const authRouter = require('./routes/auth');
const authenticate = require('./middleware/authenticate');
const tasksRouter = require('./routes/tasks');
const messagesRouter = require('./routes/messages');
const prisma = require('./lib/prisma');

const app = express();
const PORT = 3000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // default Vite port, but adjust if needed
app.use(express.json());
app.use(cookieParser());

// Register Auth Router (NOT protected)
app.use('/api/auth', authRouter);

// Protect all other routes
app.use(authenticate);

// Register Protected Routers
app.use('/api/todos', tasksRouter);
app.use('/api/messages', messagesRouter);

// -- USERS --
app.get('/api/users', async (req, res) => {
  const { wgId } = req.query;
  if (wgId) {
    const wId = parseInt(wgId);
    // Check if requester is member of this specific WG
    const membership = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: req.user.userId, wgId: wId } }
    });
    if (!membership) return res.status(403).json({ error: 'Zugriff verweigert' });

    const memberIds = data.memberships.filter(m => m.wgId === wId).map(m => m.userId);
    return res.json(data.users.filter(u => memberIds.includes(u.id)));
  }
  
  // If no wgId, return only users from WGs the requester belongs to (Privacy)
  const myWgIds = (await prisma.membership.findMany({
    where: { userId: req.user.userId },
    select: { wgId: true }
  })).map(m => m.wgId);
  
  const accessibleUserIds = new Set(data.memberships.filter(m => myWgIds.includes(m.wgId)).map(m => m.userId));
  res.json(data.users.filter(u => accessibleUserIds.has(u.id)));
});

app.get('/api/users/:id', (req, res) => {
  const user = data.users.find(u => u.id === parseInt(req.params.id));
  if (user) res.json(user);
  else res.status(404).json({ error: 'User not found' });
});

app.post('/api/users', (req, res) => {
  const newUser = { id: Date.now(), ...req.body };
  data.users.push(newUser);
  res.status(201).json(newUser);
});

// -- WGs --
app.get('/api/wgs', (req, res) => {
  const { userId } = req.query;
  if (userId) {
    const uId = parseInt(userId);
    const wgIds = data.memberships.filter(m => m.userId === uId).map(m => m.wgId);
    return res.json(data.wgs.filter(w => wgIds.includes(w.id)));
  }
  res.json(data.wgs);
});

app.get('/api/wgs/:id', (req, res) => {
  const wg = data.wgs.find(w => w.id === parseInt(req.params.id));
  if (wg) res.json(wg);
  else res.status(404).json({ error: 'WG not found' });
});

app.post('/api/wgs', (req, res) => {
  const newWg = { id: Date.now(), createdAt: new Date().toISOString(), ...req.body };
  data.wgs.push(newWg);
  
  // Implicitly add creating user if userId is provided
  if (req.body.userId) {
    data.memberships.push({ userId: parseInt(req.body.userId), wgId: newWg.id, role: 'admin' });
  }

  res.status(201).json(newWg);
});

// -- SHOPPING --
app.get('/api/shopping/categories', (req, res) => res.json(data.shoppingCategories));

app.post('/api/shopping/categories', (req, res) => {
  const newCat = req.body.name?.trim();
  if (newCat && !data.shoppingCategories.includes(newCat)) {
    data.shoppingCategories.push(newCat);
  }
  res.status(201).json(data.shoppingCategories);
});

app.get('/api/shopping', async (req, res) => {
  const { wgId, category } = req.query;
  if (!wgId) return res.status(400).json({ error: 'wgId parameter is required' });
  
  const isMember = await prisma.membership.findUnique({
    where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
  });
  if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });
  
  let items = data.shopping;
  if (wgId) items = items.filter(i => i.wgId === parseInt(wgId));
  if (category) items = items.filter(i => i.category === category);
  res.json(items);
});

app.post('/api/shopping', (req, res) => {
  const { wgId, name } = req.body;
  if (!wgId) return res.status(400).json({ error: 'wgId parameter is required' });
  if (!name) return res.status(400).json({ error: 'name parameter is required' });
  
  const isMember = await prisma.membership.findUnique({
    where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
  });
  if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });
  
  const newItem = { id: Date.now(), ...req.body, checked: false };
  if (!newItem.category) newItem.category = 'Lebensmittel';
  
  data.shopping.push(newItem);

  // Log to feed
  data.messages.push({
    id: Date.now() + 1,
    wgId: parseInt(wgId),
    type: 'system',
    content: `Neu auf der Liste: "${name}"`,
    timestamp: new Date().toISOString()
  });

  res.status(201).json(newItem);
});

app.put('/api/shopping/:id', async (req, res) => {
  const item = data.shopping.find(i => i.id === parseInt(req.params.id));
  if (item) {
    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: req.user.userId, wgId: item.wgId } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    const wasChecked = item.checked;
    if (req.body.checked !== undefined) item.checked = req.body.checked;
    
    // Log if checked
    if (item.checked && !wasChecked) {
      data.messages.push({
        id: Date.now(),
        wgId: item.wgId,
        type: 'system',
        content: `Eingekauft: "${item.name}"`,
        timestamp: new Date().toISOString()
      });
    }

    res.json(item);
  } else res.status(404).send('Not found');
});

app.delete('/api/shopping/:id', async (req, res) => {
  const item = data.shopping.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });

  const isMember = await prisma.membership.findUnique({
    where: { userId_wgId: { userId: req.user.userId, wgId: item.wgId } }
  });
  if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

  data.shopping = data.shopping.filter(i => i.id !== parseInt(req.params.id));
  res.status(204).send();
});

// -- TODOS --
// Moved to routes/tasks.js

// -- CALENDAR --
app.get('/api/calendar', async (req, res) => {
  const { wgId } = req.query;
  if (!wgId) return res.status(400).json({ error: 'wgId parameter is required' });

  const isMember = await prisma.membership.findUnique({
    where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
  });
  if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

  let items = data.calendar;
  if (wgId) items = items.filter(i => i.wgId === parseInt(wgId));
  res.json(items);
});

app.post('/api/calendar', async (req, res) => {
  const { wgId } = req.body;
  if (!wgId) return res.status(400).json({ error: 'wgId parameter is required' });

  const isMember = await prisma.membership.findUnique({
    where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
  });
  if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

  const newEvent = { id: Date.now(), ...req.body };
  data.calendar.push(newEvent);
  res.status(201).json(newEvent);
});

// -- FINANCES --
app.get('/api/finances', async (req, res) => {
  const { wgId, paidById } = req.query;
  if (!wgId) return res.status(400).json({ error: 'wgId parameter is required' });

  const isMember = await prisma.membership.findUnique({
    where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
  });
  if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

  let items = data.finances;
  if (wgId) items = items.filter(i => i.wgId === parseInt(wgId));
  if (paidById) items = items.filter(i => i.paidById === parseInt(paidById));
  res.json(items);
});

app.post('/api/finances', async (req, res) => {
  const { wgId, paidById, amount, description } = req.body;
  if (!wgId || !paidById || amount === undefined) {
    return res.status(400).json({ error: 'wgId, paidById, and amount are required' });
  }

  const isMember = await prisma.membership.findUnique({
    where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
  });
  if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

  const newExpense = { id: Date.now(), ...req.body };
  data.finances.push(newExpense);

  // Log to feed
  const payer = data.users.find(u => u.id === parseInt(paidById))?.name || 'Jemand';
  data.messages.push({
    id: Date.now() + 2,
    wgId: parseInt(wgId),
    type: 'system',
    content: `${payer} hat ${amount}€ für "${description || 'Unbekannt'}" ausgegeben`,
    timestamp: new Date().toISOString()
  });

  res.status(201).json(newExpense);
});

// -- INVITATIONS --
app.get('/api/invitations/:token', (req, res) => {
  const invite = data.invitations.find(i => i.token === req.params.token);
  if (!invite) return res.status(404).json({ error: 'Invalid or expired invitation token' });
  
  const wg = data.wgs.find(w => w.id === invite.wgId);
  res.json({ ...invite, wgName: wg ? wg.name : 'Unknown WG' });
});

app.post('/api/wgs/:id/invitations', (req, res) => {
  const wgId = parseInt(req.params.id);
  const wg = data.wgs.find(w => w.id === wgId);
  if (!wg) return res.status(404).json({ error: 'WG not found' });

  const newInvite = {
    id: Date.now(),
    wgId: wgId,
    token: req.body.token || Math.random().toString(36).substring(2, 10),
    role: req.body.role || 'member',
    usedCount: 0,
    maxUses: req.body.maxUses || 5
  };
  
  data.invitations.push(newInvite);
  res.status(201).json(newInvite);
});

app.post('/api/invitations/:token/join', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required to join' });

  const inviteIndex = data.invitations.findIndex(i => i.token === req.params.token);
  if (inviteIndex === -1) return res.status(404).json({ error: 'Invitation not found' });
  
  const invite = data.invitations[inviteIndex];
  
  // Check if invitation is still valid
  if (invite.maxUses !== -1 && invite.usedCount >= invite.maxUses) {
    return res.status(410).json({ error: 'Invitation has reached maximum uses' });
  }

  // Check if user is already a member
  const uId = parseInt(userId);
  const alreadyMember = data.memberships.find(m => m.userId === uId && m.wgId === invite.wgId);
  if (alreadyMember) return res.status(409).json({ error: 'User is already a member of this WG' });

  // Add membership
  data.memberships.push({ userId: uId, wgId: invite.wgId, role: invite.role });
  invite.usedCount++;

  res.status(200).json({ message: 'Successfully joined WG', wgId: invite.wgId });
});

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
