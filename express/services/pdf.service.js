const logger = require('../utils/logger');

/**
 * Temporary placeholder for certificate PDF generation.
 * This implementation only logs and returns a fake path.
 * Replace with real PDF generation logic when ready.
 * @param {object} data
 * @returns {Promise<string>} absolute file path of generated PDF
 */
async function generateCertificatePDF(data) {
  logger.warn('[PDF Service] Using temporary generateCertificatePDF implementation');
  await new Promise(res => setTimeout(res, 50));
  return '/tmp/fake-certificate.pdf';
}

module.exports = { generateCertificatePDF };
