const ipfsClient = require('ipfs-http-client');
const logger = require('../utils/logger');

let ipfs = null;
let isInitialized = false;
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // milliseconds

async function init() {
  if (isInitialized) return ipfs;

  const ipfsUrl = process.env.IPFS_API_URL || 'http://suzoo_ipfs:5001';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`[ipfsService] Attempt ${attempt}/${MAX_RETRIES} connecting to IPFS at ${ipfsUrl}`);
      ipfs = ipfsClient(ipfsUrl);
      const version = await ipfs.version();
      logger.info(`[ipfsService] Connected to IPFS node, version: ${version.version}`);
      isInitialized = true;
      return ipfs;
    } catch (err) {
      logger.warn(`[ipfsService] Connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  throw new Error('IPFS initialization failed after all retries');
}

function getClient() {
  if (!isInitialized) {
    throw new Error('IPFS client not initialized. Call init() first.');
  }
  return ipfs;
}

module.exports = {
  init,
  getClient,
};
