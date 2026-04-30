const bidService = require('../../services/bid.service');

const alumniOfDay = async (req, res, next) => {
  try {
    const cycle = await bidService.getAlumniOfDay();

    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: 'No featured alumnus is available yet.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Featured alumnus retrieved successfully.',
      data: cycle
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  alumniOfDay
};
