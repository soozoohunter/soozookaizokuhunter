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

const DMCA_API_ENDPOINT = process.env.DMCA_API_URL || 'https://www.dmca.com/rest/takedowns/send';

/**
 * Sends a takedown notice to DMCA.com API.
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

  const params = new URLSearchParams();
  params.append('email', DMCA_EMAIL);
  params.append('password', DMCA_PASSWORD);
  params.append('infringingURL', infringingUrl);
  params.append('originalURL', originalUrl);
  if (description) {
    params.append('description', description);
  }

  try {
    logger.info(`[DMCA Service] Sending takedown notice for: ${infringingUrl}`);
    const response = await axios.post(DMCA_API_ENDPOINT, params);

    if (response.data && response.data.status === 'success') {
      logger.info(`[DMCA Service] Takedown request successful for ${infringingUrl}. Response: ${response.data.message}`);
      return { success: true, message: response.data.message, data: response.data };
    }

    const errorMsg = response.data ? response.data.message : 'Unknown error from DMCA API';
    logger.error(`[DMCA Service] Takedown request failed: ${errorMsg}`);
    return { success: false, message: errorMsg, data: response.data };
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
