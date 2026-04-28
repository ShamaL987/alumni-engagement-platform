const { User, RequestLog } = require('../models');
const { verifyAccessToken } = require('../utils/jwt');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Bearer token is required');
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findByPk(decoded.sub);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      const error = new Error('Token is no longer valid. Please log in again.');
      error.statusCode = 401;
      throw error;
    }

    req.user = {
      id: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion
    };

    res.on('finish', async () => {
      try {
        await RequestLog.create({
          userId: user.id,
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          tokenSubject: String(decoded.sub)
        });
      } catch (logError) {
        console.error('Request logging failed:', logError.message);
      }
    });

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate
};
