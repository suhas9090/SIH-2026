const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const requestLogger = async (req, res, next) => {
  const start = Date.now();
  res.on('finish', async () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous'
    };
    logger.info(JSON.stringify(logData));

    // Log significant actions to audit log
    if (req.user && req.method !== 'GET' && res.statusCode < 400) {
      try {
        const entityInfo = extractEntityInfo(req);
        if (entityInfo.shouldLog) {
          await prisma.auditLog.create({
            data: {
              userId: req.user.id,
              action: `${req.method} ${req.route?.path || req.url}`,
              entityType: entityInfo.type,
              entityId: entityInfo.id,
              tenderId: entityInfo.tenderId,
              bidderId: entityInfo.bidderId,
              details: {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration
              },
              ipAddress: req.ip,
              userAgent: req.headers['user-agent']
            }
          });
        }
      } catch (err) {
        logger.error('Audit log error:', err.message);
      }
    }
  });
  next();
};

const extractEntityInfo = (req) => {
  const url = req.url;
  if (url.includes('/tenders')) {
    return { shouldLog: true, type: 'TENDER', id: req.params?.id, tenderId: req.params?.id };
  }
  if (url.includes('/bidders')) {
    return { shouldLog: true, type: 'BIDDER', id: req.params?.bidderId || req.params?.id, bidderId: req.params?.bidderId };
  }
  if (url.includes('/documents')) {
    return { shouldLog: true, type: 'DOCUMENT', id: req.params?.id };
  }
  if (url.includes('/compliance')) {
    return { shouldLog: true, type: 'COMPLIANCE', id: req.params?.id };
  }
  return { shouldLog: false };
};

module.exports = { requestLogger };
