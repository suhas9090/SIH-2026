const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message}`, { stack: err.stack, url: req.url, method: req.method });

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with this information already exists.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Firebase auth errors
  if (err.code?.startsWith('auth/')) {
    return res.status(401).json({ error: 'Authentication failed.' });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
