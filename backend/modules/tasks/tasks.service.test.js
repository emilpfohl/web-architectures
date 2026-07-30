import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from '../../test/resetDb.js';

const prisma = require('../../lib/prisma');
const tasksService = require('./tasks.service.js');

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

async function createWgWithMember(name = 'User') {
  const user = await prisma.user.create({ data: { name, email: `u${Date.now()}${Math.random()}@test.de`, password: 'x' } });
  const wg = await prisma.wG.create({ data: { name: 'WG', createdAt: new Date().toISOString() } });
  await prisma.membership.create({ data: { userId: user.id, wgId: wg.id, role: 'member' } });
  return { user, wg };
}

describe('listTodos', () => {
  it('throws ValidationError when wgId is missing', async () => {
    await expect(tasksService.listTodos(1, undefined)).rejects.toThrow('wgId parameter is required');
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const { wg } = await createWgWithMember();
    await expect(tasksService.listTodos(999999, wg.id)).rejects.toThrow();
  });

  it('maps missing assignee to "Niemand"', async () => {
    const { user, wg } = await createWgWithMember();
    await prisma.todo.create({ data: { wgId: wg.id, title: 'Müll raus' } });
    const items = await tasksService.listTodos(user.id, wg.id);
    expect(items[0].assignee).toBe('Niemand');
  });

  it('maps assignee to their name and filters by assigneeId', async () => {
    const { user, wg } = await createWgWithMember('Anna');
    const other = await prisma.user.create({ data: { name: 'Bob', email: `bob${Date.now()}@test.de`, password: 'x' } });
    await prisma.membership.create({ data: { userId: other.id, wgId: wg.id, role: 'member' } });

    await prisma.todo.create({ data: { wgId: wg.id, title: 'Task A', assigneeId: user.id } });
    await prisma.todo.create({ data: { wgId: wg.id, title: 'Task B', assigneeId: other.id } });

    const all = await tasksService.listTodos(user.id, wg.id);
    expect(all).toHaveLength(2);

    const filtered = await tasksService.listTodos(user.id, wg.id, other.id);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].assignee).toBe('Bob');
  });
});

describe('createTodo', () => {
  it('throws ValidationError when wgId or title is missing', async () => {
    await expect(tasksService.createTodo(1, { wgId: 1 })).rejects.toThrow('wgId und title sind erforderlich');
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const { wg } = await createWgWithMember();
    await expect(tasksService.createTodo(999999, { wgId: wg.id, title: 'Task' })).rejects.toThrow();
  });

  it('resolves assignee by name over assigneeId', async () => {
    const { user, wg } = await createWgWithMember('Anna');
    const other = await prisma.user.create({ data: { name: 'Bob', email: `bob2${Date.now()}@test.de`, password: 'x' } });
    await prisma.membership.create({ data: { userId: other.id, wgId: wg.id, role: 'member' } });

    const todo = await tasksService.createTodo(user.id, { wgId: wg.id, title: 'Task', assignee: 'bob', assigneeId: 999999 });
    expect(todo.assigneeId).toBe(other.id);
  });

  it('falls back to assigneeId when no assignee name given', async () => {
    const { user, wg } = await createWgWithMember();
    const todo = await tasksService.createTodo(user.id, { wgId: wg.id, title: 'Task', assigneeId: user.id });
    expect(todo.assigneeId).toBe(user.id);
  });

  it('leaves assigneeId null when neither assignee nor assigneeId given', async () => {
    const { user, wg } = await createWgWithMember();
    const todo = await tasksService.createTodo(user.id, { wgId: wg.id, title: 'Task' });
    expect(todo.assigneeId).toBeNull();
  });
});

describe('updateTodo', () => {
  it('throws NotFoundError when the todo does not exist', async () => {
    await expect(tasksService.updateTodo(1, 999999, {})).rejects.toThrow();
  });

  it('throws AccessDeniedError for a non-member', async () => {
    const { wg } = await createWgWithMember();
    const todo = await prisma.todo.create({ data: { wgId: wg.id, title: 'Task' } });
    await expect(tasksService.updateTodo(999999, todo.id, {})).rejects.toThrow();
  });

  it('updates completed and logs activity on false -> true', async () => {
    const { user, wg } = await createWgWithMember();
    const todo = await prisma.todo.create({ data: { wgId: wg.id, title: 'Müll raus', completed: false } });

    const updated = await tasksService.updateTodo(user.id, todo.id, { completed: true });
    expect(updated.completed).toBe(true);

    const activity = await prisma.message.findFirst({ where: { wgId: wg.id, type: 'system' } });
    expect(activity.content).toContain('Müll raus');
  });

  it('does not log activity when completed stays the same', async () => {
    const { user, wg } = await createWgWithMember();
    const todo = await prisma.todo.create({ data: { wgId: wg.id, title: 'Task', completed: true } });
    await tasksService.updateTodo(user.id, todo.id, { completed: true });
    const activityCount = await prisma.message.count({ where: { wgId: wg.id, type: 'system' } });
    expect(activityCount).toBe(0);
  });
});

describe('deleteAllForWgOperation', () => {
  it('deletes all todos for a wg', async () => {
    const { wg } = await createWgWithMember();
    await prisma.todo.create({ data: { wgId: wg.id, title: 'A' } });
    await prisma.todo.create({ data: { wgId: wg.id, title: 'B' } });
    await tasksService.deleteAllForWgOperation(wg.id);
    expect(await prisma.todo.count({ where: { wgId: wg.id } })).toBe(0);
  });
});
