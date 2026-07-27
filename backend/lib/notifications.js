const React = require('react');
const prisma = require('./prisma');
const { sendMail, FRONTEND_URL } = require('./mailer');
const { enqueueMail } = require('./mailQueue');
const NewMemberEmail = require('../emails/NewMemberEmail');
const NewTaskEmail = require('../emails/NewTaskEmail');
const ShoppingEmail = require('../emails/ShoppingEmail');
const PasswordChangedEmail = require('../emails/PasswordChangedEmail');

const CHAT_URL = `${FRONTEND_URL}/?tab=dashboard`;
const TASKS_URL = `${FRONTEND_URL}/?tab=todos`;
const SHOPPING_URL = `${FRONTEND_URL}/?tab=shopping`;

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
  enqueueMail(() => sendMail({
    to: recipients,
    subject: `${newMemberName} ist der WG "${wgName}" beigetreten`,
    react: React.createElement(NewMemberEmail, { newMemberName, wgName, actionUrl: CHAT_URL })
  }));
}

async function notifyNewTask({ wgId, creatorId, creatorName, taskTitle }) {
  const recipients = await otherMemberEmails(wgId, creatorId);
  if (recipients.length === 0) return;
  const wg = await prisma.wG.findUnique({ where: { id: wgId }, select: { name: true } });
  enqueueMail(() => sendMail({
    to: recipients,
    subject: `Neue Aufgabe: "${taskTitle}"`,
    react: React.createElement(NewTaskEmail, { creatorName, taskTitle, wgName: wg?.name, actionUrl: TASKS_URL })
  }));
}

async function notifyShopping({ wgId, shopperId, shopperName }) {
  const recipients = await otherMemberEmails(wgId, shopperId);
  if (recipients.length === 0) return;
  const wg = await prisma.wG.findUnique({ where: { id: wgId }, select: { name: true } });
  enqueueMail(() => sendMail({
    to: recipients,
    subject: `${shopperName} ist einkaufen`,
    react: React.createElement(ShoppingEmail, { shopperName, wgName: wg?.name, actionUrl: SHOPPING_URL })
  }));
}

async function notifyPasswordChanged({ userEmail, userName }) {
  enqueueMail(() => sendMail({
    to: [userEmail],
    subject: 'Dein Passwort wurde geändert',
    react: React.createElement(PasswordChangedEmail, { userName })
  }));
}

module.exports = {
  notifyNewMember,
  notifyNewTask,
  notifyShopping,
  notifyPasswordChanged
};
