const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.js'],
    // Alle Testdateien teilen sich dieselbe SQLite-Testdatenbank (siehe
    // prisma/schema.test.prisma) - parallele Testdateien würden sich
    // gegenseitig die Tabellen wegräumen. Sequenziell ausführen statt
    // pro Datei eine eigene DB zu verwalten.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['modules/**/*.service.js', 'lib/**/*.js'],
      exclude: ['**/*.routes.js', 'prisma/**', 'test/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70
      }
    }
  }
});
