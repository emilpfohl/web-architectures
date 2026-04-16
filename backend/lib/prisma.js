const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSQLite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

// The adapter factory will create the better-sqlite3 instance internally.
// We just need to provide the correct configuration.
const dbPath = path.join(__dirname, '../prisma/dev.db');

const adapter = new PrismaBetterSQLite3({ 
  url: `file:${dbPath}`
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
