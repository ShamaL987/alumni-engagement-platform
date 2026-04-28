const { User } = require('../models');
const { verifyAccessToken } = require('../utils/jwt');

async function requireJwt(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, message: 'Bearer token required' });
    }

    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.sub);

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function requireApiRole(...roles) {
  return function apiRoleGuard(req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Forbidden' });
    return next();
  };
}

module.exports = { requireJwt, requireApiRole };
