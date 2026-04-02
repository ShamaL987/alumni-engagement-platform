const { Op } = require('sequelize');
const { User, AuthToken, Profile, RequestLog } = require('../models');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateAccessToken } = require('../utils/jwt');
const { generateRandomToken, hashToken } = require('../utils/token');
const { isUniversityEmail, isStrongPassword } = require('../utils/validators');
const { sendEmail } = require('./email.service');

const buildPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  isEmailVerified: user.isEmailVerified,
  lastLoginAt: user.lastLoginAt
});

const removeActiveTokens = async (userId, type) => {
  await AuthToken.destroy({
    where: {
      userId,
      type,
      usedAt: null
    }
  });
};

const issueOneTimeToken = async (userId, type, expiresInMinutes) => {
  const plainToken = generateRandomToken();
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await removeActiveTokens(userId, type);

  await AuthToken.create({
    userId,
    type,
    tokenHash,
    expiresAt
  });

  return plainToken;
};

const findUsableToken = async (plainToken, type) => {
  const tokenHash = hashToken(plainToken);

  return AuthToken.findOne({
    where: {
      tokenHash,
      type,
      usedAt: null,
      expiresAt: {
        [Op.gt]: new Date()
      }
    }
  });
};

const register = async ({ email, password }) => {
  if (!isUniversityEmail(email)) {
    const error = new Error('A valid university email is required');
    error.statusCode = 400;
    throw error;
  }

  if (!isStrongPassword(password)) {
    const error = new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and symbol');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error('Email already exists');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email,
    passwordHash,
    isEmailVerified: false
  });

  await Profile.create({ userId: user.id });

  const verificationToken = await issueOneTimeToken(user.id, 'email_verification', 60);

  await sendEmail({
    to: user.email,
    subject: 'Verify your email',
    text: `Your verification token is ${verificationToken}`
  });

  return {
    user: buildPublicUser(user),
    verificationToken: process.env.EXPOSE_DEV_TOKENS === 'true' ? verificationToken : undefined
  };
};

const verifyEmail = async (plainToken) => {
  if (!plainToken) {
    const error = new Error('Verification token is required');
    error.statusCode = 400;
    throw error;
  }

  const authToken = await findUsableToken(plainToken, 'email_verification');
  if (!authToken) {
    const error = new Error('Verification token is invalid or expired');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByPk(authToken.userId);
  user.isEmailVerified = true;
  await user.save();

  authToken.usedAt = new Date();
  await authToken.save();

  return buildPublicUser(user);
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isEmailVerified) {
    const error = new Error('Please verify your email before logging in');
    error.statusCode = 403;
    throw error;
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken(user);

  await RequestLog.create({
    userId: user.id,
    endpoint: '/auth/login',
    method: 'POST',
    statusCode: 200,
    tokenSubject: String(user.id)
  });

  return {
    accessToken,
    user: buildPublicUser(user)
  };
};

const verifyCurrentToken = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ['id', 'email', 'isEmailVerified', 'lastLoginAt'] });
  return user;
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return { resetToken: undefined };
  }

  const resetToken = await issueOneTimeToken(user.id, 'password_reset', 60);

  await sendEmail({
    to: user.email,
    subject: 'Reset your password',
    text: `Your password reset token is ${resetToken}`
  });

  return {
    resetToken: process.env.EXPOSE_DEV_TOKENS === 'true' ? resetToken : undefined
  };
};

const resetPassword = async ({ token, newPassword }) => {
  if (!isStrongPassword(newPassword)) {
    const error = new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and symbol');
    error.statusCode = 400;
    throw error;
  }

  const authToken = await findUsableToken(token, 'password_reset');
  if (!authToken) {
    const error = new Error('Reset token is invalid or expired');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByPk(authToken.userId);
  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion += 1;
  await user.save();

  authToken.usedAt = new Date();
  await authToken.save();

  return true;
};

const logout = async (userId) => {
  const user = await User.findByPk(userId);
  user.tokenVersion += 1;
  await user.save();
  return true;
};

module.exports = {
  register,
  verifyEmail,
  login,
  verifyCurrentToken,
  forgotPassword,
  resetPassword,
  logout
};
