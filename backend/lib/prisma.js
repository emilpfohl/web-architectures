// Im Test-Betrieb (NODE_ENV=test) läuft die Business-Logik gegen eine echte
// SQLite-Testdatenbank statt gegen MySQL, damit Vitest ohne laufende
// MySQL-Instanz und ohne Prisma-Query-Mocking läuft (siehe prisma/schema.test.prisma).
const { PrismaClient } = process.env.NODE_ENV === 'test'
  ? require('.prisma/client-test')
  : require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
