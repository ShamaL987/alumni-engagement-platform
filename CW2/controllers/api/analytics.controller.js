const analyticsService = require('../../services/analytics.service');

const overview = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getAnalytics(req.query);
    res.status(200).json({
      success: true,
      message: 'Analytics overview retrieved successfully.',
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

const exportCsv = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getAnalytics(req.query);
    const csv = analyticsService.analyticsToCsv(analytics);

    res.status(200);
    res.header('Content-Type', 'text/csv');
    res.attachment('alumni-analytics-export.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  overview,
  exportCsv
};
