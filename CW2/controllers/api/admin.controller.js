const apiKeyService = require('../../services/apiKey.service');
const usageService = require('../../services/usage.service');

exports.createApiKey = async (req, res) => {
  const permissions = Array.isArray(req.body.permissions) ? req.body.permissions : [];
  const result = await apiKeyService.createApiKey({
    name: req.body.name,
    clientType: req.body.clientType,
    permissions,
    createdByUserId: req.user.id
  });
  res.status(201).json({ success: true, data: { apiKey: result.apiKey, secret: result.secret } });
};

exports.listApiKeys = async (req, res) => {
  const apiKeys = await apiKeyService.listApiKeys();
  res.json({ success: true, data: apiKeys });
};

exports.revokeApiKey = async (req, res) => {
  const apiKey = await apiKeyService.revokeApiKey(req.params.id);
  res.json({ success: true, data: apiKey });
};

exports.usage = async (req, res) => {
  const usage = await usageService.getUsageDashboard();
  res.json({ success: true, data: usage });
};
