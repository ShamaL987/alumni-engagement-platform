const { RequestLog } = require('../models');

module.exports = function requestLogger(req, res, next) {
  res.on('finish', () => {
    if (req.path.startsWith('/public') || req.path.startsWith('/css') || req.path.startsWith('/js') || req.path.startsWith('/uploads')) {
      return;
    }

    RequestLog.create({
      userId: req.user?.id || null,
      endpoint: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      tokenSubject: req.apiKey ? `api-key:${req.apiKey.keyPrefix}` : (req.user ? `user:${req.user.id}` : null),
      ipAddress: req.ip
    }).catch(() => {});
  });

  next();
};
