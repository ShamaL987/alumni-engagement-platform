const analyticsService = require('../../services/analytics.service');
const profileService = require('../../services/profile.service');

exports.dashboard = async (req, res) => {
  const analytics = await analyticsService.getAnalytics(req.query);
  const options = await analyticsService.filterOptions();
  res.render('client/dashboard', { title: 'University Analytics Dashboard', analytics, options, query: req.query });
};

exports.alumni = async (req, res) => {
  const alumni = await profileService.listAlumni(req.query);
  const options = await analyticsService.filterOptions();
  res.render('client/alumni', { title: 'View Alumni', alumni, options, query: req.query });
};

exports.exportCsv = async (req, res) => {
  const analytics = await analyticsService.getAnalytics(req.query);
  const csv = analyticsService.analyticsToCsv(analytics);
  res.header('Content-Type', 'text/csv');
  res.attachment('alumni-analytics-export.csv');
  res.send(csv);
};
