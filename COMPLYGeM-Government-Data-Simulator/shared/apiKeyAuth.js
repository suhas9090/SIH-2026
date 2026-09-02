/**
 * API Key and Security Middleware for Government Data Simulator
 */

function apiKeyAuth(req, res, next) {
  const configuredKey = process.env.SIMULATOR_API_KEY;
  
  // If no API key is enforced in environment, permit open access for local dev
  if (!configuredKey || configuredKey === 'none' || configuredKey === '') {
    return next();
  }

  const incomingKey = req.headers['x-gov-simulator-key'] || req.headers['x-api-key'] || req.query.api_key;

  if (!incomingKey || incomingKey !== configuredKey) {
    return res.status(401).json({
      found: false,
      verification_status: 'UNAUTHORIZED',
      error: 'Invalid or missing API key. Pass X-Gov-Simulator-Key in header.',
      is_simulated: true,
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

module.exports = {
  apiKeyAuth,
};
