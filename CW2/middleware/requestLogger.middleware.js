function formatTimestamp(date = new Date()) {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

function getRequestType(req) {
  if (req.originalUrl.startsWith('/api')) {
    return 'API';
  }

  return 'WEB';
}

function getOutcome(statusCode) {
  if (statusCode >= 500) {
    return 'ERROR';
  }

  if (statusCode >= 400) {
    return 'FAIL';
  }

  return 'SUCCESS';
}

function requestLogger(req, res, next) {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    const timestamp = formatTimestamp();
    const requestType = getRequestType(req);
    const method = req.method;
    const path = req.originalUrl;
    const statusCode = res.statusCode;
    const outcome = getOutcome(statusCode);

    const errorMessage = res.locals.errorMessage
        ? ` | ${res.locals.errorMessage}`
        : '';

    console.log(
        `[${timestamp}] ${requestType} ${method} ${path} ${statusCode} ${outcome} ${durationMs.toFixed(1)}ms${errorMessage}`
    );
  });

  next();
}

module.exports = requestLogger;