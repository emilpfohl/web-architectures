// In-Memory Data Store Simulation (Relational style)
const data = {
  users: [
    { id: 1, name: 'Sarah', email: 'sarah@example.com' },
    { id: 2, name: 'Marco', email: 'marco@example.com' },
    { id: 3, name: 'Lila', email: 'lila@example.com' },
    { id: 4, name: 'Felix', email: 'felix@example.com' } // from another WG
  ],
  wgs: [
    { id: 1, name: 'Sanctuary Main', createdAt: '2026-03-01' },
    { id: 2, name: 'Uni Squad', createdAt: '2026-03-15' }
  ],
  memberships: [
    { userId: 1, wgId: 1, role: 'admin' },
    { userId: 2, wgId: 1, role: 'member' },
    { userId: 3, wgId: 1, role: 'member' },
    { userId: 4, wgId: 2, role: 'admin' },
    { userId: 3, wgId: 2, role: 'member' } // Lila is in both!
  ],
  shoppingCategories: ['Lebensmittel', 'Haushalt', 'Wishlist'],
  shopping: [
    { id: 1, wgId: 1, name: 'Milch', checked: false, category: 'Lebensmittel' },
    { id: 2, wgId: 1, name: 'Toilettenpapier', checked: true, category: 'Haushalt' },
    { id: 3, wgId: 2, name: 'Kaffee', checked: false, category: 'Lebensmittel' }
  ],
  todos: [
    { id: 1, wgId: 1, title: 'Küche putzen', assigneeId: 2, completed: false }, 
    { id: 2, wgId: 1, title: 'Müll runterbringen', assigneeId: 1, completed: true },
    { id: 3, wgId: 2, title: 'Bad putzen', assigneeId: 3, completed: false } // assigned to Lila in another WG
  ],
  calendar: [
    { id: 1, wgId: 1, date: '2026-03-20', title: 'WG Party' }
  ],
  finances: [
    { id: 1, wgId: 1, amount: 25.50, description: 'Einkauf', paidById: 1 },
    { id: 2, wgId: 2, amount: 15.00, description: 'Putzmittel', paidById: 4 }
  ],
  invitations: [
    { id: 1, wgId: 1, token: "sanctuary-invite-2026", role: "member", usedCount: 0, maxUses: 10 }
  ],
  messages: [
    { id: 1, wgId: 1, type: 'system', content: 'Willkommen im neuen WG-Feed!', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, wgId: 1, type: 'user', senderId: 1, content: 'Hey Leute, hab den Kühlschrank geputzt! 🧊', timestamp: new Date(Date.now() - 720000).toISOString() }
  ]
};

module.exports = data;
