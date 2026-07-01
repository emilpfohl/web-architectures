const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

async function sendMail({ to, subject, react }) {
  try {
    const { error } = await resend.emails.send({
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
