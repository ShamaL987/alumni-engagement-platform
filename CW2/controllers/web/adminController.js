const apiKeyService = require('../../services/apiKey.service');
const usageService = require('../../services/usage.service');
const { CLIENT_PERMISSION_PRESETS, PERMISSIONS } = require('../../config/permissions');

exports.apiKeys = async (req, res) => {
  const apiKeys = await apiKeyService.listApiKeys();
  res.render('admin/api-keys', {
    title: 'API Keys',
    apiKeys,
    presets: CLIENT_PERMISSION_PRESETS,
    permissions: Object.values(PERMISSIONS),
    createdSecret: req.session.createdApiSecret || null
  });
  req.session.createdApiSecret = null;
};

exports.createApiKey = async (req, res) => {
  const permissions = Array.isArray(req.body.permissions)
    ? req.body.permissions
    : req.body.permissions
      ? [req.body.permissions]
      : [];

  const result = await apiKeyService.createApiKey({
    name: req.body.name,
    clientType: req.body.clientType,
    permissions,
    createdByUserId: req.user.id
  });

  req.session.createdApiSecret = result.secret;
  req.flash('success', 'API key created. Copy the key now because only its hash is stored.');
  res.redirect('/admin/api-keys');
};

exports.revokeApiKey = async (req, res) => {
  await apiKeyService.revokeApiKey(req.params.id);
  req.flash('success', 'API key revoked.');
  res.redirect('/admin/api-keys');
};

exports.usage = async (req, res) => {
  const usage = await usageService.getUsageDashboard();
  res.render('admin/usage', { title: 'Usage Statistics', usage });
};
