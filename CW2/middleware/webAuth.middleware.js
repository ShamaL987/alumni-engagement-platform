const { User } = require('../models');

async function attachUserToViews(req, res, next) {
  res.locals.currentUser = null;
  res.locals.flash = {
    success: req.flash ? req.flash('success') : [],
    error: req.flash ? req.flash('error') : [],
    info: req.flash ? req.flash('info') : []
  };

  if (!req.session?.userId) return next();

  try {
    const user = await User.findByPk(req.session.userId, {
      attributes: ['id', 'email', 'role', 'isEmailVerified', 'lastLoginAt']
    });

    if (!user) {
      req.session.destroy(() => {});
      return next();
    }

    req.user = user;
    res.locals.currentUser = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireWebAuth(req, res, next) {
  if (!req.user) {
    req.flash('error', 'Please login to continue.');
    return res.redirect('/login');
  }
  return next();
}

function redirectIfAuthenticated(req, res, next) {
  if (req.user) return res.redirect('/dashboard');
  return next();
}

function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      req.flash('error', 'Please login to continue.');
      return res.redirect('/login');
    }

    if (!roles.includes(req.user.role)) {
      req.flash('error', 'You do not have permission to access that page.');
      return res.redirect('/dashboard');
    }

    return next();
  };
}

module.exports = { attachUserToViews, requireWebAuth, redirectIfAuthenticated, requireRole };
