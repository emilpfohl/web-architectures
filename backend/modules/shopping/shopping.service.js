const prisma = require('../../lib/prisma');
const { isWgMember } = require('../../lib/membership');
const { logActivity } = require('../../lib/activityLog');
const { ValidationError, AccessDeniedError, NotFoundError } = require('../../lib/errors');

async function listShoppingItems(userId, wgId, category) {
  if (!wgId) throw new ValidationError('wgId parameter ist erforderlich');
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();

  return prisma.shoppingItem.findMany({
    where: {
      wgId,
      ...(category ? { category } : {})
    }
  });
}

async function createShoppingItem(userId, { wgId, name, category }) {
  if (!wgId || !name) throw new ValidationError('wgId und name sind erforderlich');
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();

  const newItem = await prisma.shoppingItem.create({
    data: {
      name,
      category: category || 'Lebensmittel',
      wgId,
      checked: false
    }
  });

  await logActivity(wgId, `Neu auf der Liste: "${name}"`);

  return newItem;
}

async function updateShoppingItem(userId, id, checked) {
  const item = await prisma.shoppingItem.findUnique({ where: { id } });
  if (!item) throw new NotFoundError();

  if (!(await isWgMember(userId, item.wgId))) throw new AccessDeniedError();

  const updatedItem = await prisma.shoppingItem.update({
    where: { id },
    data: { checked: checked !== undefined ? checked : item.checked }
  });

  if (updatedItem.checked && !item.checked) {
    await logActivity(item.wgId, `Eingekauft: "${item.name}"`);
  }

  return updatedItem;
}

async function deleteShoppingItem(userId, id) {
  const item = await prisma.shoppingItem.findUnique({ where: { id } });
  if (!item) throw new NotFoundError();

  if (!(await isWgMember(userId, item.wgId))) throw new AccessDeniedError();

  await prisma.shoppingItem.delete({ where: { id } });
}

function deleteAllForWgOperation(wgId) {
  return prisma.shoppingItem.deleteMany({ where: { wgId } });
}

module.exports = {
  listShoppingItems,
  createShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  deleteAllForWgOperation
};
