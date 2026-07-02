const prisma = require('../../lib/prisma');
const { isWgMember, resolveMemberByName } = require('../../lib/membership');
const { logActivity } = require('../../lib/activityLog');
const { notifyNewTask } = require('../../lib/notifications');
const { ValidationError, AccessDeniedError, NotFoundError } = require('../../lib/errors');
const { getUserById } = require('../auth/auth.service');

async function listTodos(userId, wgId, assigneeId) {
  if (!wgId) throw new ValidationError('wgId parameter is required');
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();

  const where = { wgId };
  if (assigneeId) where.assigneeId = assigneeId;

  const items = await prisma.todo.findMany({
    where,
    include: { assignee: { select: { name: true } } }
  });

  return items.map(t => ({
    ...t,
    assignee: t.assignee ? t.assignee.name : 'Niemand'
  }));
}

async function createTodo(userId, { wgId, title, assigneeId, assignee }) {
  if (!wgId || !title) throw new ValidationError('wgId und title sind erforderlich');
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();

  let finalAssigneeId = null;
  if (assignee) {
    finalAssigneeId = await resolveMemberByName(wgId, assignee);
  } else if (assigneeId) {
    finalAssigneeId = assigneeId;
  }

  const newTodo = await prisma.todo.create({
    data: {
      wgId,
      title,
      assigneeId: finalAssigneeId,
      completed: false
    }
  });

  const creator = await getUserById(userId).catch(() => null);
  notifyNewTask({ wgId, creatorId: userId, creatorName: creator?.name || 'Jemand', taskTitle: title })
    .catch(err => console.error('Error sending new task notification:', err));

  return newTodo;
}

async function updateTodo(userId, id, { completed, assigneeId }) {
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) throw new NotFoundError('Aufgabe nicht gefunden');

  if (!(await isWgMember(userId, todo.wgId))) throw new AccessDeniedError();

  const updatedTodo = await prisma.todo.update({
    where: { id },
    data: {
      completed: completed !== undefined ? completed : todo.completed,
      assigneeId: assigneeId !== undefined ? (assigneeId ? assigneeId : null) : todo.assigneeId
    }
  });

  if (updatedTodo.completed && !todo.completed) {
    await logActivity(todo.wgId, `Aufgabe abgeschlossen: "${todo.title}"`);
  }

  return updatedTodo;
}

function deleteAllForWgOperation(wgId) {
  return prisma.todo.deleteMany({ where: { wgId } });
}

module.exports = {
  listTodos,
  createTodo,
  updateTodo,
  deleteAllForWgOperation
};
