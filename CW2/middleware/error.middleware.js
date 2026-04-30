function notFound(req, res, next) {
  const error = new Error('Page not found');
  error.statusCode = 404;
  next(error);
}

function isApiRequest(req) {
  return req.originalUrl.startsWith('/api');
}

function handle(error, req, res, next) {
  const status = error.statusCode || error.status || 500;

  const message = status >= 500
      ? 'Internal server error'
      : error.message || 'Something went wrong';

  res.locals.errorMessage = message;

  if (error.code === 'EBADCSRFTOKEN') {
    req.flash?.('error', 'Security token expired. Please try again.');

    const redirectBack = req.get('Referrer') || '/';
    return res.redirect(redirectBack);
  }

  if (process.env.NODE_ENV === 'development' && status >= 500) {
    console.error(error.stack || error);
  }

  if (isApiRequest(req)) {
    return res.status(status).json({
      success: false,
      message
    });
  }

  return res.status(status).render('error', {
    title: 'Error',
    status,
    message
  });
}

module.exports = {
  notFound,
  handle
};