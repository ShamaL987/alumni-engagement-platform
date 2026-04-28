const jwt = require('jsonwebtoken');

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET || 'dev_only_change_me',
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'dev_only_change_me');
}

module.exports = { generateAccessToken, verifyAccessToken };
