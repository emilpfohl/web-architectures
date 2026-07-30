import { describe, it, expect, vi } from 'vitest';

describe('mailer module load without RESEND_API_KEY', () => {
  it('does not throw on require() when RESEND_API_KEY is unset (must not crash server boot)', () => {
    const modulePath = require.resolve('./mailer.js');
    delete require.cache[modulePath];
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    try {
      expect(() => require('./mailer.js')).not.toThrow();
    } finally {
      process.env.RESEND_API_KEY = originalKey;
      delete require.cache[modulePath];
      require('./mailer.js');
    }
  });

  it('skips sending and logs a warning instead of calling Resend when RESEND_API_KEY is unset', async () => {
    const modulePath = require.resolve('./mailer.js');
    delete require.cache[modulePath];
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete require.cache[modulePath];
    const { sendMail } = require('./mailer.js');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await expect(sendMail({ to: 'a@b.de', subject: 'x', react: null })).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
      process.env.RESEND_API_KEY = originalKey;
      delete require.cache[modulePath];
      require('./mailer.js');
    }
  });
});
