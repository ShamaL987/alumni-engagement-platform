const authService = require('../../services/auth.service');
const { User, RequestLog } = require('../../models');

exports.register = async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
};

exports.verifyEmail = async (req, res) => {
  const user = await authService.verifyEmail(req.body.token || req.query.token);
  res.json({ success: true, data: user });
};

exports.login = async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ success: true, data: result });
};

exports.verifyToken = async (req, res) => {
  res.json({ success: true, data: authService.publicUser(req.user) });
};

exports.logout = async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (user) await user.update({ tokenVersion: user.tokenVersion + 1 });
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.usage = async (req, res) => {
  const logs = await RequestLog.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 50
  });
  res.json({ success: true, data: logs });
};

exports.forgotPassword = async (req, res) => {
  const result = await authService.requestPasswordReset(req.body.email);
  res.json({ success: true, data: result });
};

exports.resetPassword = async (req, res) => {
  await authService.resetPassword(req.body);
  res.json({ success: true, message: 'Password reset successful' });
};
