const { Resend } = require('resend');

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

let resend = null;
function getResendClient() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_mail_disabled');
  }
  return resend;
}

async function sendMail({ to, subject, react }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping mail send to', to);
    return;
  }
  try {
    const { error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react
    });
    if (error) {
      console.error('Resend error sending mail:', error);
    }
  } catch (error) {
    console.error('Unexpected error sending mail:', error);
  }
}

module.exports = { sendMail, FRONTEND_URL };
