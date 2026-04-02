const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = {
  generateAccessToken,
  verifyAccessToken
};
