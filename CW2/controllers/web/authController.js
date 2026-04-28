const authService = require('../../services/auth.service');

exports.showLogin = (req, res) => res.render('auth/login', { title: 'Login' });

exports.showRegister = (req, res) => res.render('auth/register', { title: 'Register' });

exports.register = async (req, res) => {
  const result = await authService.register(req.body);
  req.flash('success', 'Account created. Check the terminal/email for the verification link.');
  if (process.env.MAIL_MODE === 'console') {
    req.flash('info', `Development verification token: ${result.verificationToken}`);
  }
  res.redirect('/login');
};

exports.login = async (req, res) => {
  const result = await authService.login(req.body);
  req.session.userId = result.user.id;
  req.flash('success', 'Logged in successfully.');
  res.redirect('/dashboard');
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('alumni.sid');
    res.redirect('/login');
  });
};

exports.verifyEmail = async (req, res) => {
  if (!req.query.token && req.method === 'GET') {
    return res.render('auth/verify-email', { title: 'Verify Email', token: '' });
  }
  const token = req.query.token || req.body.token;
  await authService.verifyEmail(token);
  req.flash('success', 'Email verified successfully.');
  return res.redirect('/login');
};

exports.showForgotPassword = (req, res) => res.render('auth/forgot-password', { title: 'Forgot Password' });

exports.requestPasswordReset = async (req, res) => {
  const result = await authService.requestPasswordReset(req.body.email);
  req.flash('success', 'If an account exists, a password reset link has been sent.');
  if (process.env.MAIL_MODE === 'console' && result.resetToken) {
    req.flash('info', `Development reset token: ${result.resetToken}`);
  }
  res.redirect('/login');
};

exports.showResetPassword = (req, res) => {
  res.render('auth/reset-password', { title: 'Reset Password', token: req.query.token || '' });
};

exports.resetPassword = async (req, res) => {
  await authService.resetPassword(req.body);
  req.flash('success', 'Password reset successfully. Login with the new password.');
  res.redirect('/login');
};
