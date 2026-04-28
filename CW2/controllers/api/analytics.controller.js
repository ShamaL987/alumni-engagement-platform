const analyticsService = require('../../services/analytics.service');

exports.overview = async (req, res) => {
  const analytics = await analyticsService.getAnalytics(req.query);
  res.json({ success: true, data: analytics });
};

exports.exportCsv = async (req, res) => {
  const analytics = await analyticsService.getAnalytics(req.query);
  const csv = analyticsService.analyticsToCsv(analytics);
  res.header('Content-Type', 'text/csv');
  res.attachment('alumni-analytics-export.csv');
  res.send(csv);
};
