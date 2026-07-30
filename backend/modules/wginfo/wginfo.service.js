const prisma = require('../../lib/prisma');
const { isWgMember } = require('../../lib/membership');
const { ValidationError, AccessDeniedError } = require('../../lib/errors');

function parseCustomFields(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeInfo(info) {
  return { ...info, customFields: parseCustomFields(info.customFields) };
}

async function getWgInfo(userId, wgId) {
  if (!wgId) throw new ValidationError('wgId parameter required');
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();

  const info = await prisma.wgInfo.findUnique({ where: { wgId } });
  if (!info) {
    return {
      wgId,
      address: '',
      landlordName: '',
      landlordPhone: '',
      janitorName: '',
      janitorPhone: '',
      wifiName: '',
      wifiPassword: '',
      notes: '',
      customFields: []
    };
  }
  return serializeInfo(info);
}

async function upsertWgInfo(userId, wgId, data) {
  if (!wgId) throw new ValidationError('wgId ist erforderlich');
  if (!(await isWgMember(userId, wgId))) throw new AccessDeniedError();

  const {
    address = '',
    landlordName = '',
    landlordPhone = '',
    janitorName = '',
    janitorPhone = '',
    wifiName = '',
    wifiPassword = '',
    notes = '',
    customFields = []
  } = data;

  const cleanCustomFields = Array.isArray(customFields)
    ? customFields
        .filter(f => f && typeof f === 'object' && (f.label || f.value))
        .map(f => ({ label: String(f.label || '').slice(0, 100), value: String(f.value || '').slice(0, 500) }))
    : [];

  const fields = {
    address,
    landlordName,
    landlordPhone,
    janitorName,
    janitorPhone,
    wifiName,
    wifiPassword,
    notes,
    customFields: JSON.stringify(cleanCustomFields)
  };

  const info = await prisma.wgInfo.upsert({
    where: { wgId },
    update: fields,
    create: { wgId, ...fields }
  });

  return serializeInfo(info);
}

module.exports = {
  getWgInfo,
  upsertWgInfo
};
