const { ApiKey, ApiUsageLog } = require('../models');
const { generateRandomToken, hashToken, timingSafeEqualHash } = require('../utils/token');
const { CLIENT_PERMISSION_PRESETS } = require('../config/permissions');

function extractApiKey(req) {
  const authorization = req.headers.authorization || '';
  if (authorization.startsWith('Bearer ')) return authorization.slice(7).trim();
  return req.headers['x-api-key'];
}

function normalizePermissions(clientType, permissions) {
  if (Array.isArray(permissions) && permissions.length) return permissions;
  return CLIENT_PERMISSION_PRESETS[clientType] || [];
}

async function createApiKey({ name, clientType = 'custom', permissions = [], createdByUserId = null }) {
  const secret = `ak_${clientType}_${generateRandomToken(24)}`;
  const keyHash = hashToken(secret);
  const keyPrefix = secret.slice(0, 22);
  const normalizedPermissions = normalizePermissions(clientType, permissions);

  const apiKey = await ApiKey.create({
    name,
    clientType,
    keyPrefix,
    keyHash,
    permissions: normalizedPermissions,
    createdByUserId
  });

  return { apiKey, secret };
}

async function validateApiKey(secret) {
  const incomingHash = hashToken(secret || '');
  const candidates = await ApiKey.findAll({ where: { isActive: true } });
  const apiKey = candidates.find((candidate) => timingSafeEqualHash(candidate.keyHash, incomingHash));

  if (!apiKey) return null;

  await apiKey.update({ lastUsedAt: new Date() });
  return apiKey;
}

async function revokeApiKey(id) {
  const apiKey = await ApiKey.findByPk(id);
  if (!apiKey) return null;
  await apiKey.update({ isActive: false, revokedAt: new Date() });
  return apiKey;
}

async function logApiUsage(req, statusCode, apiKey = null, permissionsUsed = []) {
  return ApiUsageLog.create({
    apiKeyId: apiKey?.id || null,
    userId: req.user?.id || null,
    endpoint: req.originalUrl,
    method: req.method,
    statusCode,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || null,
    permissionsUsed
  });
}

async function listApiKeys() {
  return ApiKey.findAll({ order: [['createdAt', 'DESC']] });
}

module.exports = {
  extractApiKey,
  createApiKey,
  validateApiKey,
  revokeApiKey,
  logApiUsage,
  listApiKeys
};
