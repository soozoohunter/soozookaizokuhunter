// express/services/ipfsService.js (Final Robust Version)
const { create } = require('ipfs-http-client');
const logger = require('../utils/logger');

class IpfsService {
  constructor() {
    this.client = null;
    this.init();
  }

  init() {
    try {
      // **FIX**: Read separate environment variables for robust configuration.
      const host = process.env.IPFS_HOST || 'suzoo_ipfs';
      const port = parseInt(process.env.IPFS_PORT || '5001', 10);
      const protocol = process.env.IPFS_PROTOCOL || 'http';

      // **FIX**: Initialize the client with a configuration object instead of a URL string.
      // This is the most reliable method and avoids all URL parsing issues.
      this.client = create({ host, port, protocol });

      logger.info(`[ipfsService] IPFS client configured for ${protocol}://${host}:${port}`);
      logger.info('[ipfsService] init => client created.');
    } catch (error) {
      logger.error('[ipfsService] Failed to initialize IPFS client:', error);
      this.client = null;
    }
  }

  async saveFile(buffer) {
    if (!this.client) {
      logger.error('[ipfsService.saveFile] IPFS client not initialized.');
      return null;
    }
    try {
      logger.info(`[ipfsService.saveFile] buffer length=${buffer.length}`);
      const { cid } = await this.client.add(buffer);
      const cidStr = cid.toString();
      logger.info(`[ipfsService.saveFile] => CID=${cidStr}`);
      return cidStr;
    } catch (error) {
      logger.error('[ipfsService.saveFile] Error saving file to IPFS:', error);
      return null;
    }
  }

  async getFile(cid) {
    if (!this.client) {
      logger.error('[ipfsService.getFile] IPFS client not initialized.');
      return null;
    }
    logger.info(`[ipfsService.getFile] Fetching CID: ${cid}`);
    try {
      const chunks = [];
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }

      const fileBuffer = Buffer.concat(chunks);
      logger.info(`[ipfsService.getFile] Successfully fetched ${fileBuffer.length} bytes for CID: ${cid}`);

      return fileBuffer;
    } catch (error) {
      logger.error(`[ipfsService.getFile] Error getting file from IPFS for CID ${cid}:`, error);
      return null;
    }
  }
}

module.exports = new IpfsService();
