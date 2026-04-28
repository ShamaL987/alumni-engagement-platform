const { Op } = require('sequelize');
const { User, AuthToken, Profile, RequestLog } = require('../models');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateAccessToken } = require('../utils/jwt');
const { generateRandomToken, hashToken } = require('../utils/token');
const { isUniversityEmail, isStrongPassword } = require('../utils/validators');
const {sendVerificationEmail, sendPasswordResetEmail} = require('./mail.service');
const {PASSWORD_RESET_TOKEN_TYPE, TOKEN_EXPIRY_MINUTES, EMAIL_VERIFICATION_TOKEN_TYPE} = require("./helper.service");


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
  const tokenHashValue = hashToken(plainToken);

  return AuthToken.findOne({
    where: {
      tokenHash: tokenHashValue,
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

  const verificationToken = await issueOneTimeToken(
      user.id,
      EMAIL_VERIFICATION_TOKEN_TYPE,
      TOKEN_EXPIRY_MINUTES
  );

  await sendVerificationEmail(user, verificationToken);

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

  const authToken = await findUsableToken(plainToken, EMAIL_VERIFICATION_TOKEN_TYPE);
  if (!authToken) {
    const error = new Error('Verification token is invalid or expired');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByPk(authToken.userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  user.isEmailVerified = true;
  await user.save();

  authToken.usedAt = new Date();
  await authToken.save();

  return buildPublicUser(user);
};

const resendEmailVerification = async (email) => {
  if (!email) {
    const error = new Error('Email is required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ where: { email } });

  if (!user) {
    return {
      message: 'If the account exists, a verification email has been sent.'
    };
  }

  if (user.isEmailVerified) {
    return {
      message: 'Email is already verified.'
    };
  }

  const verificationToken = await issueOneTimeToken(
      user.id,
      EMAIL_VERIFICATION_TOKEN_TYPE,
      TOKEN_EXPIRY_MINUTES
  );

  await sendVerificationEmail(user, verificationToken);

  return {
    message: 'Verification email sent successfully.',
    verificationToken: process.env.EXPOSE_DEV_TOKENS === 'true' ? verificationToken : undefined
  };
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
  return await User.findByPk(userId, {
    attributes: ['id', 'email', 'isEmailVerified', 'lastLoginAt']
  });
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return { resetToken: undefined };
  }

  const resetToken = await issueOneTimeToken(
      user.id,
      PASSWORD_RESET_TOKEN_TYPE,
      TOKEN_EXPIRY_MINUTES
  );

  await sendPasswordResetEmail(user, resetToken);

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

  const authToken = await findUsableToken(token, PASSWORD_RESET_TOKEN_TYPE);
  if (!authToken) {
    const error = new Error('Reset token is invalid or expired');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByPk(authToken.userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion += 1;
  await user.save();

  authToken.usedAt = new Date();
  await authToken.save();

  return true;
};

const logout = async (userId) => {
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  user.tokenVersion += 1;
  await user.save();
  return true;
};

const deleteAccount = async (userId) => {
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  await Profile.destroy({
    where: { userId }
  });

  await user.destroy();
};

module.exports = {
  register,
  verifyEmail,
  resendEmailVerification,
  login,
  verifyCurrentToken,
  forgotPassword,
  resetPassword,
  logout,
  deleteAccount
};