/**
 * Firebase Admin Authentication Service
 * Manages authoritative custom claims, token validation, and user lifecycle.
 */

const admin = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * Assign authoritative role custom claims to a Firebase User
 * @param {string} firebaseUid - The user's Firebase UID
 * @param {string} role - 'admin' | 'procurement_officer' | 'reviewer' | 'bidder'
 * @param {string} status - 'approved' | 'pending' | 'suspended'
 */
async function setUserRoleAndStatusClaim(firebaseUid, role, status = 'approved') {
  try {
    const claims = {
      role: role.toLowerCase(),
      status: status.toLowerCase(),
      updatedAt: Date.now(),
    };

    await admin.auth().setCustomUserClaims(firebaseUid, claims);
    logger.info(`Assigned custom claims to user ${firebaseUid}: role=${claims.role}, status=${claims.status}`);
    return { success: true, claims };
  } catch (error) {
    logger.error(`Failed to assign custom claims to ${firebaseUid}:`, error.message);
    throw error;
  }
}

/**
 * Verify ID Token and return decoded token with custom claims
 */
async function verifyIdToken(idToken) {
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role || 'bidder',
      status: decoded.status || 'pending',
      emailVerified: decoded.email_verified || false,
    };
  } catch (error) {
    logger.error('Firebase ID token verification failed:', error.message);
    throw error;
  }
}

module.exports = {
  setUserRoleAndStatusClaim,
  verifyIdToken,
};
