const { ApiUsageLog, ApiKey, RequestLog, User } = require('../models');

async function getUsageDashboard() {
  const apiLogs = await ApiUsageLog.findAll({
    include: [{ model: ApiKey, as: 'apiKey' }],
    order: [['createdAt', 'DESC']],
    limit: 150
  });

  const webLogs = await RequestLog.findAll({
    include: [{ model: User, as: 'user', attributes: ['id', 'email', 'role'] }],
    order: [['createdAt', 'DESC']],
    limit: 150
  });

  const byKey = {};
  for (const log of apiLogs) {
    const key = log.apiKey?.name || 'Unknown key';
    byKey[key] = (byKey[key] || 0) + 1;
  }

  const byEndpoint = {};
  for (const log of apiLogs) {
    byEndpoint[log.endpoint] = (byEndpoint[log.endpoint] || 0) + 1;
  }

  return {
    apiLogs,
    webLogs,
    charts: {
      byKey: Object.entries(byKey).map(([label, value]) => ({ label, value })),
      byEndpoint: Object.entries(byEndpoint).map(([label, value]) => ({ label, value })).slice(0, 10)
    }
  };
}

module.exports = { getUsageDashboard };
