/**
 * Standardized Response Formatter for Government Data Simulator
 * Guarantees uniform JSON structure across all simulated government APIs.
 */

function formatSuccessResponse({ data, authority, source, registryId, identifier, verificationStatus = 'VERIFIED' }) {
  return {
    found: true,
    verification_status: verificationStatus,
    registry_id: registryId,
    authority: authority,
    identifier: identifier,
    source: source || 'SIMULATED_GOVERNMENT_GATEWAY',
    is_simulated: true,
    data: data,
    timestamp: new Date().toISOString(),
  };
}

function formatNotFoundResponse({ authority, registryId, identifier, message }) {
  return {
    found: false,
    verification_status: 'NOT_FOUND',
    registry_id: registryId,
    authority: authority,
    identifier: identifier,
    source: 'SIMULATED_GOVERNMENT_GATEWAY',
    is_simulated: true,
    data: null,
    message: message || `Record for identifier "${identifier}" not found in simulated ${authority} registry.`,
    timestamp: new Date().toISOString(),
  };
}

function formatErrorResponse({ message, status = 500, error = null }) {
  return {
    found: false,
    verification_status: 'ERROR',
    error: error ? String(error) : null,
    message: message || 'An error occurred while querying the simulated government gateway.',
    is_simulated: true,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  formatSuccessResponse,
  formatNotFoundResponse,
  formatErrorResponse,
};
