const requestLogger = (req, res, next) => {
    const startedAt = Date.now();

    res.on('finish', () => {
        const durationMs = Date.now() - startedAt;
        console.log(`[REQUEST] ${req.method} ${req.originalUrl} | [STATUS] ${res.statusCode} | [DURATION] ${durationMs} ms`);
    });

    next();
};

module.exports = requestLogger;