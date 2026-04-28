const { Op } = require('sequelize');
const { User, AuthToken, Profile } = require('../models');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateAccessToken } = require('../utils/jwt');
const { generateRandomToken, hashToken, timingSafeEqualHash } = require('../utils/token');
const { isStrongPassword, isUniversityEmail } = require('../utils/validators');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./mail.service');

const TOKEN_TTL_MINUTES = 60;

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    lastLoginAt: user.lastLoginAt
  };
}

async function issueToken(userId, type) {
  await AuthToken.destroy({ where: { userId, type, usedAt: null } });

  const token = generateRandomToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await AuthToken.create({ userId, type, tokenHash, expiresAt });
  return token;
}

async function register({ email, password, role = 'alumni' }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!isUniversityEmail(normalizedEmail)) {
    const error = new Error('Registration requires an approved university email domain.');
    error.statusCode = 400;
    throw error;
  }

  if (!isStrongPassword(password)) {
    const error = new Error('Password must be at least 8 characters and include uppercase, lowercase, number and symbol.');
    error.statusCode = 400;
    throw error;
  }

  const allowedRoles = ['alumni', 'client'];
  const safeRole = allowedRoles.includes(role) ? role : 'alumni';
  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role: safeRole,
    isEmailVerified: false
  });

  if (safeRole === 'alumni') {
    await Profile.create({ userId: user.id });
  }

  const verificationToken = await issueToken(user.id, 'email_verification');
  await sendVerificationEmail(user, verificationToken);

  return { user: publicUser(user), verificationToken };
}

async function verifyEmail(token) {
  const incomingHash = hashToken(token || '');
  const authTokens = await AuthToken.findAll({
    where: {
      type: 'email_verification',
      usedAt: null,
      expiresAt: { [Op.gt]: new Date() }
    },
    include: [{ model: User, as: 'user' }]
  });

  const authToken = authTokens.find((item) => timingSafeEqualHash(item.tokenHash, incomingHash));
  if (!authToken) {
    const error = new Error('Invalid or expired verification token.');
    error.statusCode = 400;
    throw error;
  }

  await authToken.user.update({ isEmailVerified: true });
  await authToken.update({ usedAt: new Date() });
  return publicUser(authToken.user);
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email: String(email || '').trim().toLowerCase() } });
  if (!user || !(await comparePassword(password || '', user.passwordHash))) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const requireVerification = String(process.env.REQUIRE_EMAIL_VERIFICATION || 'false').toLowerCase() === 'true';
  if (requireVerification && !user.isEmailVerified) {
    const error = new Error('Please verify your email before logging in.');
    error.statusCode = 403;
    throw error;
  }

  await user.update({ lastLoginAt: new Date() });

  return {
    user: publicUser(user),
    accessToken: generateAccessToken(user)
  };
}

async function requestPasswordReset(email) {
  const user = await User.findOne({ where: { email: String(email || '').trim().toLowerCase() } });
  if (!user) return { sent: true };

  const token = await issueToken(user.id, 'password_reset');
  await sendPasswordResetEmail(user, token);
  return { sent: true, resetToken: token };
}

async function resetPassword({ token, password, newPassword }) {
  const safePassword = password || newPassword;
  if (!isStrongPassword(safePassword)) {
    const error = new Error('Password must be at least 8 characters and include uppercase, lowercase, number and symbol.');
    error.statusCode = 400;
    throw error;
  }

  const incomingHash = hashToken(token || '');
  const authTokens = await AuthToken.findAll({
    where: {
      type: 'password_reset',
      usedAt: null,
      expiresAt: { [Op.gt]: new Date() }
    },
    include: [{ model: User, as: 'user' }]
  });

  const authToken = authTokens.find((item) => timingSafeEqualHash(item.tokenHash, incomingHash));
  if (!authToken) {
    const error = new Error('Invalid or expired password reset token.');
    error.statusCode = 400;
    throw error;
  }

  await authToken.user.update({
    passwordHash: await hashPassword(safePassword),
    tokenVersion: authToken.user.tokenVersion + 1
  });
  await authToken.update({ usedAt: new Date() });

  return { success: true };
}

module.exports = {
  publicUser,
  register,
  verifyEmail,
  login,
  requestPasswordReset,
  resetPassword,
  issueToken
};
