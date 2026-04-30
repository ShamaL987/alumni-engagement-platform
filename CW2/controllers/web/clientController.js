const analyticsService = require('../../services/analytics.service');
const profileService = require('../../services/profile.service');

exports.dashboard = async (req, res) => {
  const analytics = await analyticsService.getAnalytics(req.query);
  const options = await analyticsService.filterOptions();
  const presets = await SavedFilterPreset.findAll({ where: { userId: req.user.id }, order: [['name', 'ASC']] });
  res.render('client/dashboard', { title: 'University Analytics Dashboard', analytics, options, presets, query: req.query });
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

exports.savePreset = async (req, res) => {
  await SavedFilterPreset.upsert({
    userId: req.user.id,
    name: req.body.name,
    filters: {
      programme: req.body.programme || '',
      graduationYear: req.body.graduationYear || '',
      industrySector: req.body.industrySector || ''
    }
  });
  req.flash('success', 'Filter preset saved.');
  res.redirect('/client/dashboard');
};

exports.deletePreset = async (req, res) => {
  await SavedFilterPreset.destroy({ where: { id: req.params.id, userId: req.user.id } });
  req.flash('success', 'Filter preset deleted.');
  res.redirect('/client/dashboard');
};
