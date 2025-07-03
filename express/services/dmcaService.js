const axios = require('axios');
const logger = require('../utils/logger');

const DMCA_EMAIL = process.env.DMCA_API_EMAIL;
const DMCA_PASSWORD = process.env.DMCA_API_PASSWORD;

// Check if DMCA service is enabled via environment variables
const isDmcaEnabled = DMCA_EMAIL && DMCA_PASSWORD;

if (isDmcaEnabled) {
  logger.info('[DMCA Service] Service is ENABLED.');
} else {
  logger.warn('[DMCA Service] Service is DISABLED due to missing DMCA_API_EMAIL or DMCA_API_PASSWORD environment variables.');
}

const DMCA_API_BASE = process.env.DMCA_API_URL || 'https://api.dmca.com';

/**
 * Authenticate with DMCA API and return a token
 * @returns {Promise<string>}
 */
async function login() {
  const loginData = { email: DMCA_EMAIL, password: DMCA_PASSWORD };
  const response = await axios.post(`${DMCA_API_BASE}/login`, loginData, {
    headers: { 'Content-Type': 'application/json' },
  });

  let token = response.data;
  // API may wrap token in quotes or return JSON
  if (typeof token === 'object' && token.Token) {
    token = token.Token;
  }
  return typeof token === 'string' ? token.replace(/"/g, '') : '';
}

/**
 * Call DMCA createCase API with provided token
 * @param {string} token
 * @param {object} caseData
 * @returns {Promise<object>}
 */
async function createCase(token, caseData) {
  const response = await axios.post(`${DMCA_API_BASE}/createCase`, caseData, {
    headers: {
      'Content-Type': 'application/json',
      Token: token,
    },
  });
  return response.data;
}

/**
 * Sends a takedown notice via DMCA.com API using login/createCase workflow.
 * @param {object} takedownDetails
 * @param {string} takedownDetails.infringingUrl - The URL of the infringing content.
 * @param {string} takedownDetails.originalUrl - The URL of the original content.
 * @param {string} [takedownDetails.description] - Description of the infringement.
 * @returns {Promise<{success: boolean, message: string, data: object|null}>}
 */
async function sendTakedownRequest(takedownDetails) {
  if (!isDmcaEnabled) {
    const errorMsg = 'DMCA Takedown request failed: Service is not configured.';
    logger.error(errorMsg);
    return { success: false, message: errorMsg, data: null };
  }

  const { infringingUrl, originalUrl, description } = takedownDetails;

  if (!infringingUrl || !originalUrl) {
    throw new Error('Infringing URL and Original URL are required for a takedown request.');
  }

  try {
    logger.info(`[DMCA Service] Logging in to DMCA API for takedown of: ${infringingUrl}`);
    const token = await login();
    if (!token) throw new Error('Failed to obtain DMCA API token');

    const caseData = {
      Subject: 'Automated Takedown Request',
      Description: description || 'Automated takedown request',
      CopiedFromURL: originalUrl,
      InfringingURL: infringingUrl,
    };

    const response = await createCase(token, caseData);

    if (response && (response.status === 'success' || response.caseID)) {
      logger.info(`[DMCA Service] Takedown request successful for ${infringingUrl}.`);
      return { success: true, message: 'Case created', data: response };
    }

    const errorMsg = response && response.message ? response.message : 'Unknown error from DMCA API';
    logger.error(`[DMCA Service] Takedown request failed: ${errorMsg}`);
    return { success: false, message: errorMsg, data: response };
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    logger.error(`[DMCA Service] An exception occurred during takedown request: ${errorMsg}`);
    return { success: false, message: `An exception occurred: ${error.message}`, data: null };
  }
}

module.exports = {
  sendTakedownRequest,
  isDmcaEnabled,
};
