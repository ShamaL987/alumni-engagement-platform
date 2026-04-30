const apiKeyService = require('../../services/apiKey.service');
const usageService = require('../../services/usage.service');

const normalizePermissions = (permissions) => {
  if (!permissions) return [];
  return Array.isArray(permissions) ? permissions : [permissions];
};

const createApiKey = async (req, res, next) => {
  try {
    const result = await apiKeyService.createApiKey({
      name: req.body.name,
      clientType: req.body.clientType,
      permissions: normalizePermissions(req.body.permissions),
      createdByUserId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'API key created successfully. Copy the secret now because only the hash is stored.',
      data: {
        apiKey: result.apiKey,
        secret: result.secret
      }
    });
  } catch (error) {
    next(error);
  }
};

const listApiKeys = async (req, res, next) => {
  try {
    const apiKeys = await apiKeyService.listApiKeys();
    res.status(200).json({
      success: true,
      message: 'API keys retrieved successfully.',
      data: apiKeys
    });
  } catch (error) {
    next(error);
  }
};

const revokeApiKey = async (req, res, next) => {
  try {
    const apiKey = await apiKeyService.revokeApiKey(req.params.id);
    res.status(200).json({
      success: true,
      message: 'API key revoked successfully.',
      data: apiKey
    });
  } catch (error) {
    next(error);
  }
};

const usage = async (req, res, next) => {
  try {
    const result = await usageService.getUsageDashboard();
    res.status(200).json({
      success: true,
      message: 'Usage statistics retrieved successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  usage
};
