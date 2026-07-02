require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const authRouter = require('./routes/auth');
const authenticate = require('./middleware/authenticate');
const tasksRouter = require('./routes/tasks');
const messagesRouter = require('./routes/messages');
const pushRouter = require('./routes/push');
const prisma = require('./lib/prisma');
const { notifyNewMember, notifyShopping } = require('./lib/notifications');
const { sendPushToUser } = require('./lib/webpush');

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

// -- USERS --
app.get('/api/users', async (req, res) => {
  try {
    const { wgId } = req.query;
    if (wgId) {
      const uId = parseInt(req.user.userId);
      const wId = parseInt(wgId);
      // Check if requester is member of this specific WG
      const membership = await prisma.membership.findUnique({
        where: { userId_wgId: { userId: uId, wgId: wId } }
      });
      if (!membership) return res.status(403).json({ error: 'Zugriff verweigert' });

      const memberships = await prisma.membership.findMany({
        where: { wgId: wId },
        include: { user: true }
      });
      return res.json(memberships.map(m => ({ 
        id: m.user.id, 
        name: m.user.name, 
        email: m.user.email,
        isHome: m.isHome,
        mood: m.mood
      })));
    }

    // If no wgId, return only users from WGs the requester belongs to (Privacy)
    const uId = parseInt(req.user.userId);
    const myMemberships = await prisma.membership.findMany({
      where: { userId: uId },
      include: { 
        wg: { 
          include: { 
            memberships: { 
              include: { user: true } 
            } 
          } 
        } 
      }
    });

    const accessibleUsers = new Map();
    myMemberships.forEach(m => {
      m.wg.memberships.forEach(member => {
        accessibleUsers.set(member.user.id, { 
          id: member.user.id, 
          name: member.user.name, 
          email: member.user.email,
          isHome: member.isHome,
          mood: member.mood
        });
      });
    });

    res.json(Array.from(accessibleUsers.values()));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.put('/api/users/status', async (req, res) => {
  try {
    const { wgId, isHome, mood, isShopping } = req.body;
    if (!wgId) return res.status(400).json({ error: 'wgId ist erforderlich' });

    const uId = parseInt(req.user.userId);
    const wId = parseInt(wgId);

    const previousMembership = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: uId, wgId: wId } }
    });

    const updatedMembership = await prisma.membership.update({
      where: { userId_wgId: { userId: uId, wgId: wId } },
      data: {
        ...(isHome !== undefined ? { isHome } : {}),
        ...(mood !== undefined ? { mood } : {}),
        ...(isShopping !== undefined ? { isShopping } : {})
      }
    });

    res.json(updatedMembership);

    if (isShopping === true && previousMembership && !previousMembership.isShopping) {
      const shopper = await prisma.user.findUnique({ where: { id: uId }, select: { name: true } });
      const shopperName = shopper?.name || 'Jemand';

      notifyShopping({ wgId: wId, shopperId: uId, shopperName })
        .catch(err => console.error('Error sending shopping notification:', err));

      prisma.membership.findMany({ where: { wgId: wId, userId: { not: uId } } })
        .then(otherMemberships => {
          const pushPayload = {
            title: `${shopperName} ist einkaufen`,
            body: 'Sag Bescheid, falls dir noch etwas fehlt.',
            url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?tab=shopping`
          };
          otherMemberships.forEach(m => {
            sendPushToUser(m.userId, pushPayload)
              .catch(err => console.error('Error sending shopping push notification:', err));
          });
        })
        .catch(err => console.error('Error loading WG members for push notification:', err));
    }
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// User by ID lookup using Prisma
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (user) {
      res.json({ id: user.id, name: user.name, email: user.email });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// -- WGs --
app.get('/api/wgs', async (req, res) => {
  try {
    const { userId } = req.query;
    if (userId) {
      const uId = parseInt(userId);
      const memberships = await prisma.membership.findMany({
        where: { userId: uId },
        include: { wg: true }
      });
      return res.json(memberships.map(m => m.wg));
    }
    const wgs = await prisma.wG.findMany();
    res.json(wgs);
  } catch (error) {
    console.error('Error fetching WGs:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.get('/api/wgs/:id', async (req, res) => {
  try {
    const wg = await prisma.wG.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (wg) res.json(wg);
    else res.status(404).json({ error: 'WG nicht gefunden' });
  } catch (error) {
    console.error('Error fetching WG:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.post('/api/wgs', async (req, res) => {
  try {
    const { name, userId } = req.body;
    if (!name) return res.status(400).json({ error: 'Name ist erforderlich' });

    const newWg = await prisma.wG.create({
      data: {
        name,
        createdAt: new Date().toISOString()
      }
    });

    // Implicitly add creating user if userId is provided
    if (userId) {
      await prisma.membership.create({
        data: {
          userId: parseInt(userId),
          wgId: newWg.id,
          role: 'admin'
        }
      });
    }

    res.status(201).json(newWg);
  } catch (error) {
    console.error('Error creating WG:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.put('/api/wgs/:id', async (req, res) => {
  try {
    const wgId = parseInt(req.params.id);
    const { name, icon, themeColor } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: 'Name ist erforderlich' });
    }

    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: parseInt(req.user.userId), wgId } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    const updatedWg = await prisma.wG.update({
      where: { id: wgId },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(icon !== undefined ? { icon } : {}),
        ...(themeColor !== undefined ? { themeColor } : {})
      }
    });

    res.json(updatedWg);
  } catch (error) {
    console.error('Error updating WG:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// GET /api/wgs/:id/members
app.get('/api/wgs/:id/members', async (req, res) => {
  try {
    const wgId = parseInt(req.params.id);
    const uId = parseInt(req.user.userId);

    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: uId, wgId } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    const memberships = await prisma.membership.findMany({
      where: { wgId },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    res.json(memberships.map(m => ({
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role
    })));
  } catch (error) {
    console.error('Error fetching WG members:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// DELETE /api/wgs/:id/members/:userId (auch für "WG verlassen" via eigene userId)
app.delete('/api/wgs/:id/members/:userId', async (req, res) => {
  try {
    const wgId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    const requesterId = parseInt(req.user.userId);

    const requesterMembership = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: requesterId, wgId } }
    });
    if (!requesterMembership) return res.status(403).json({ error: 'Zugriff verweigert' });

    const targetMembership = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: targetUserId, wgId } }
    });
    if (!targetMembership) return res.status(404).json({ error: 'Mitgliedschaft nicht gefunden' });

    const remainingCount = await prisma.membership.count({ where: { wgId } });

    if (remainingCount <= 1) {
      await prisma.$transaction([
        prisma.shoppingItem.deleteMany({ where: { wgId } }),
        prisma.todo.deleteMany({ where: { wgId } }),
        prisma.calendarEvent.deleteMany({ where: { wgId } }),
        prisma.financeItem.deleteMany({ where: { wgId } }),
        prisma.invitation.deleteMany({ where: { wgId } }),
        prisma.message.deleteMany({ where: { wgId } }),
        prisma.membership.deleteMany({ where: { wgId } }),
        prisma.wG.delete({ where: { id: wgId } })
      ]);
      return res.json({ message: 'Mitglied entfernt, WG war leer und wurde gelöscht', wgDeleted: true });
    }

    await prisma.membership.delete({
      where: { userId_wgId: { userId: targetUserId, wgId } }
    });

    res.json({ message: 'Mitglied entfernt', wgDeleted: false });
  } catch (error) {
    console.error('Error removing WG member:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// -- SHOPPING --
app.get('/api/shopping/categories', (req, res) => res.json(['Lebensmittel', 'Haushalt', 'Wishlist']));

app.get('/api/shopping', async (req, res) => {
  try {
    const { wgId, category } = req.query;
    if (!wgId) return res.status(400).json({ error: 'wgId parameter ist erforderlich' });

    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    const items = await prisma.shoppingItem.findMany({
      where: { 
        wgId: parseInt(wgId),
        ...(category ? { category: category } : {})
      }
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching shopping items:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.post('/api/shopping', async (req, res) => {
  try {
    const { wgId, name, category } = req.body;
    if (!wgId || !name) return res.status(400).json({ error: 'wgId und name sind erforderlich' });

    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    const newItem = await prisma.shoppingItem.create({
      data: {
        name,
        category: category || 'Lebensmittel',
        wgId: parseInt(wgId),
        checked: false
      }
    });

    // Log to feed (Messages)
    await prisma.message.create({
      data: {
        wgId: parseInt(wgId),
        type: 'system',
        content: `Neu auf der Liste: "${name}"`,
        timestamp: new Date().toISOString()
      }
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating shopping item:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.put('/api/shopping/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.shoppingItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Nicht gefunden' });

    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: req.user.userId, wgId: item.wgId } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    const updatedItem = await prisma.shoppingItem.update({
      where: { id },
      data: { checked: req.body.checked !== undefined ? req.body.checked : item.checked }
    });

    // Log if checked
    if (updatedItem.checked && !item.checked) {
      await prisma.message.create({
        data: {
          wgId: item.wgId,
          type: 'system',
          content: `Eingekauft: "${item.name}"`,
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating shopping item:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.delete('/api/shopping/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.shoppingItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Nicht gefunden' });

    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: req.user.userId, wgId: item.wgId } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    await prisma.shoppingItem.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting shopping item:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// -- TODOS --
// Moved to routes/tasks.js

// -- CALENDAR --
app.get('/api/calendar', async (req, res) => {
  try {
    const { wgId } = req.query;
    if (!wgId) return res.status(400).json({ error: 'wgId parameter ist erforderlich' });

    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    const events = await prisma.calendarEvent.findMany({
      where: { wgId: parseInt(wgId) }
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.post('/api/calendar', async (req, res) => {
  try {
    const { wgId, date, title } = req.body;
    if (!wgId || !date || !title) return res.status(400).json({ error: 'wgId, date und title sind erforderlich' });

    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    const newEvent = await prisma.calendarEvent.create({
      data: {
        wgId: parseInt(wgId),
        date,
        title
      }
    });

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// -- FINANCES --
app.get('/api/finances', async (req, res) => {
  try {
    const { wgId, paidById } = req.query;
    if (!wgId) return res.status(400).json({ error: 'wgId parameter ist erforderlich' });

    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    const expenses = await prisma.financeItem.findMany({
      where: { 
        wgId: parseInt(wgId),
        ...(paidById ? { paidById: parseInt(paidById) } : {})
      },
      include: {
        paidBy: {
          select: { name: true }
        }
      }
    });

    res.json(expenses.map(e => ({
      ...e,
      paidBy: e.paidBy ? e.paidBy.name : 'Unbekannt'
    })));
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.post('/api/finances', async (req, res) => {
  try {
    const { wgId, paidById, amount, description } = req.body;
    if (!wgId || amount === undefined) {
      return res.status(400).json({ error: 'wgId und amount sind erforderlich' });
    }

    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    let finalPaidById = paidById ? parseInt(paidById) : req.user.userId;
    if (req.body.paidBy) {
      const nameLower = req.body.paidBy.trim().toLowerCase();
      const memberships = await prisma.membership.findMany({
        where: { wgId: parseInt(wgId) },
        include: { user: true }
      });
      const match = memberships.find(m => m.user.name.trim().toLowerCase() === nameLower);
      if (match) {
        finalPaidById = match.userId;
      }
    }

    const newExpense = await prisma.financeItem.create({
      data: {
        description: description || 'Unbekannt',
        amount: parseFloat(amount),
        paidById: finalPaidById,
        wgId: parseInt(wgId)
      }
    });

    // Log to feed
    await prisma.message.create({
      data: {
        wgId: parseInt(wgId),
        type: 'system',
        content: `Neue Ausgabe: "${description || 'Unbekannt'}" (${amount}€)`,
        timestamp: new Date().toISOString()
      }
    });

    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.post('/api/finances/settle', async (req, res) => {
  try {
    const { wgId } = req.query;
    if (!wgId) return res.status(400).json({ error: 'wgId parameter ist erforderlich' });

    const isMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: req.user.userId, wgId: parseInt(wgId) } }
    });
    if (!isMember) return res.status(403).json({ error: 'Zugriff verweigert' });

    // Mark current expenses as settled by deleting them (simplified settlement)
    await prisma.financeItem.deleteMany({
      where: { wgId: parseInt(wgId) }
    });

    // Log to feed
    await prisma.message.create({
      data: {
        wgId: parseInt(wgId),
        type: 'system',
        content: `Abrechnung abgeschlossen: Alle Konten auf 0 gesetzt.`,
        timestamp: new Date().toISOString()
      }
    });

    res.json({ message: 'Erfolgreich abgerechnet' });
  } catch (error) {
    console.error('Error settling finances:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// -- INVITATIONS --
app.get('/api/invitations/:token', async (req, res) => {
  try {
    const invite = await prisma.invitation.findUnique({
      where: { token: req.params.token },
      include: { wg: true }
    });
    if (!invite) return res.status(404).json({ error: 'Ungültiger oder abgelaufener Einladungs-Token' });

    res.json({ ...invite, wgName: invite.wg.name });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.post('/api/wgs/:id/invitations', async (req, res) => {
  try {
    const wgId = parseInt(req.params.id);
    const wg = await prisma.wG.findUnique({ where: { id: wgId } });
    if (!wg) return res.status(404).json({ error: 'WG nicht gefunden' });

    const uId = parseInt(req.user.userId);
    const membership = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: uId, wgId: wgId } }
    });
    if (!membership) return res.status(403).json({ error: 'Du bist kein Mitglied dieser WG' });

    const newInvite = await prisma.invitation.create({
      data: {
        wgId: wgId,
        token: req.body.token || Math.random().toString(36).substring(2, 10),
        role: req.body.role || 'member',
        usedCount: 0,
        maxUses: req.body.maxUses || 5
      }
    });

    res.status(201).json(newInvite);
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.post('/api/invitations/join', async (req, res) => {
  try {
    const { token, userId } = req.body;
    if (!token || !userId) return res.status(400).json({ error: 'Token und userId sind erforderlich' });

    const invite = await prisma.invitation.findUnique({
      where: { token: token },
      include: { wg: true }
    });
    if (!invite) return res.status(404).json({ error: 'Einladung nicht gefunden' });

    // Check if invitation is still valid
    if (invite.maxUses !== -1 && invite.usedCount >= invite.maxUses) {
      return res.status(410).json({ error: 'Diese Einladung ist bereits abgelaufen' });
    }

    // Check if user is already a member
    const uId = parseInt(userId);
    const alreadyMember = await prisma.membership.findUnique({
      where: { userId_wgId: { userId: uId, wgId: invite.wgId } }
    });
    if (alreadyMember) return res.status(409).json({ error: 'Du bist bereits Mitglied dieser WG' });

    // Add membership
    await prisma.membership.create({
      data: {
        userId: uId,
        wgId: invite.wgId,
        role: invite.role
      }
    });

    // Update used count
    await prisma.invitation.update({
      where: { id: invite.id },
      data: { usedCount: invite.usedCount + 1 }
    });

    res.status(200).json({ message: 'Erfolgreich beigetreten', wgId: invite.wgId });

    const newMember = await prisma.user.findUnique({ where: { id: uId }, select: { name: true } });
    notifyNewMember({
      wgId: invite.wgId,
      wgName: invite.wg.name,
      newMemberId: uId,
      newMemberName: newMember?.name || 'Ein neues Mitglied'
    }).catch(err => console.error('Error sending new member notification:', err));
  } catch (error) {
    console.error('Error joining via invitation:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

server.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
