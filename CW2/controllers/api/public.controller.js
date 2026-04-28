const bidService = require('../../services/bid.service');

exports.alumniOfDay = async (req, res) => {
  const cycle = await bidService.getAlumniOfDay();
  if (!cycle) {
    return res.status(404).json({ success: false, message: 'No featured alumnus is available yet.' });
  }
  return res.json({ success: true, data: cycle });
};
