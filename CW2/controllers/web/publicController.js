const bidService = require('../../services/bid.service');

exports.home = async (req, res) => {
  const cycle = await bidService.getAlumniOfDay();
  res.render('public/alumni-of-day', { title: 'Alumni of the Day', cycle });
};

exports.alumniOfDay = async (req, res) => {
  const cycle = await bidService.getAlumniOfDay();
  res.render('public/alumni-of-day', { title: 'Alumni of the Day', cycle });
};
