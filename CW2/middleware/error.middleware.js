function notFound(req, res, next) {
  const error = new Error('Page not found');
  error.statusCode = 404;
  next(error);
}

function handle(error, req, res, next) {
  const status = error.statusCode || error.status || 500;

  if (error.code === 'EBADCSRFTOKEN') {
    req.flash?.('error', 'Security token expired. Please try again.');
    return res.redirect('back');
  }

  if (req.isApiRequest || req.originalUrl.startsWith('/api')) {
    return res.status(status).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }

  console.error(error);
  return res.status(status).render('error', {
    title: 'Error',
    status,
    message: error.message || 'Something went wrong'
  });
}

module.exports = { notFound, handle };
