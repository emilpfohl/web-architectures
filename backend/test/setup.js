// Muss vor jedem Import von middleware/authenticate.js oder
// modules/auth/auth.service.js laufen - beide rufen beim Modul-Load
// process.exit(1) auf, falls JWT_SECRET fehlt.
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_URL = 'file:./test.db';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

// Fire-and-forget Mail-Versand (z.B. notifyPasswordChanged) läuft in Tests
// weiter, aber ohne echten Resend-Key schlägt der Send intern fehl und wird
// von sendMail() abgefangen (kein Absturz, kein echter Netzwerk-Call-Erfolg).
process.env.RESEND_API_KEY = 'test-dummy-key';
process.env.RESEND_FROM_EMAIL = 'test@example.com';
process.env.FRONTEND_URL = 'http://localhost:3000';
