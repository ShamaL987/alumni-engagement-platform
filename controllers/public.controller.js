const { getFeaturedAlumnusForDate } = require('../services/bid.service');

const getTodaysFeaturedAlumnus = async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const featured = await getFeaturedAlumnusForDate(today);

    if (!featured) {
      return res.status(404).json({
        success: false,
        message: 'No featured alumnus found for today.'
      });
    }

    res.status(200).json({
      success: true,
      data: featured
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodaysFeaturedAlumnus
};
