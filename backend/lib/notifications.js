const React = require('react');
const prisma = require('./prisma');
const { sendMail, FRONTEND_URL } = require('./mailer');
const NewMemberEmail = require('../emails/NewMemberEmail');
const NewTaskEmail = require('../emails/NewTaskEmail');
const ShoppingEmail = require('../emails/ShoppingEmail');
const PasswordChangedEmail = require('../emails/PasswordChangedEmail');

const CHAT_URL = `${FRONTEND_URL}/?tab=dashboard`;

async function otherMemberEmails(wgId, excludeUserId) {
  const memberships = await prisma.membership.findMany({
    where: { wgId, userId: { not: excludeUserId } },
    include: { user: { select: { email: true } } }
  });
  return memberships.map(m => m.user.email).filter(Boolean);
}

async function notifyNewMember({ wgId, wgName, newMemberId, newMemberName }) {
  const recipients = await otherMemberEmails(wgId, newMemberId);
  if (recipients.length === 0) return;
  await sendMail({
    to: recipients,
    subject: `${newMemberName} ist der WG "${wgName}" beigetreten`,
    react: React.createElement(NewMemberEmail, { newMemberName, wgName, chatUrl: CHAT_URL })
  });
}

async function notifyNewTask({ wgId, creatorId, creatorName, taskTitle }) {
  const recipients = await otherMemberEmails(wgId, creatorId);
  if (recipients.length === 0) return;
  await sendMail({
    to: recipients,
    subject: `Neue Aufgabe: "${taskTitle}"`,
    react: React.createElement(NewTaskEmail, { creatorName, taskTitle, chatUrl: CHAT_URL })
  });
}

async function notifyShopping({ wgId, shopperId, shopperName }) {
  const recipients = await otherMemberEmails(wgId, shopperId);
  if (recipients.length === 0) return;
  await sendMail({
    to: recipients,
    subject: `${shopperName} ist einkaufen`,
    react: React.createElement(ShoppingEmail, { shopperName, chatUrl: CHAT_URL })
  });
}

async function notifyPasswordChanged({ userEmail, userName }) {
  await sendMail({
    to: [userEmail],
    subject: 'Dein Passwort wurde geändert',
    react: React.createElement(PasswordChangedEmail, { userName })
  });
}

module.exports = {
  notifyNewMember,
  notifyNewTask,
  notifyShopping,
  notifyPasswordChanged
};
