const { RequestLog } = require('../models');

const getUsageStatistics = async (userId) => {
  const logs = await RequestLog.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 100
  });

  return {
    totalRequests: logs.length,
    lastActivityAt: logs[0]?.createdAt || null,
    logs
  };
};

module.exports = {
  getUsageStatistics
};
