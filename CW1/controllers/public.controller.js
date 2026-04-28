const { getFeaturedAlumnusForDate } = require('../services/bid.service');

const getTodaysFeaturedAlumnus = async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const featuredCycle = await getFeaturedAlumnusForDate(today);

    if (!featuredCycle || !featuredCycle.winnerUser) {
      return res.status(404).json({
        success: false,
        message: 'No featured alumnus found for today.'
      });
    }

    return res.status(200).json({
      success: true,
      data: featuredCycle
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getTodaysFeaturedAlumnus
};
