const apiKeyService = require('../services/apiKey.service');

function requireApiPermission(permission) {
  return async function apiKeyGuard(req, res, next) {
    try {
      const rawKey = apiKeyService.extractApiKey(req);
      if (!rawKey) return res.status(401).json({ success: false, message: 'API key required' });

      const apiKey = await apiKeyService.validateApiKey(rawKey);
      if (!apiKey) return res.status(401).json({ success: false, message: 'Invalid API key' });

      const permissions = Array.isArray(apiKey.permissions) ? apiKey.permissions : [];
      if (!permissions.includes(permission)) {
        await apiKeyService.logApiUsage(req, res.statusCode || 403, apiKey, [permission]);
        return res.status(403).json({
          success: false,
          message: `Missing API permission: ${permission}`
        });
      }

      req.apiKey = apiKey;
      req.requiredApiPermission = permission;

      res.on('finish', () => {
        apiKeyService.logApiUsage(req, res.statusCode, apiKey, [permission]).catch((error) => {
          console.warn('[api-usage] failed:', error.message);
        });
      });

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { requireApiPermission };
