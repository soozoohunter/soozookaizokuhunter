// express/services/ipfsService.js (Final, Robust Version)
const { create } = require('ipfs-http-client');
const logger = require('../utils/logger');

class IpfsService {
  constructor() {
    this.client = null;
    this.init();
  }

  init() {
    try {
      const url = process.env.IPFS_API_URL || 'http://suzoo_ipfs:5001';
      // The URL needs to be parsed for the ipfs-http-client v56+
      const urlObject = new URL(url);

      this.client = create({
        host: urlObject.hostname,
        port: urlObject.port,
        protocol: urlObject.protocol.replace(':', ''),
      });

      logger.info(`[ipfsService] IPFS client configured for ${urlObject.hostname}:${urlObject.port}`);
      logger.info('[ipfsService] init => client created.');
    } catch (error) {
      logger.error('[ipfsService] Failed to initialize IPFS client:', error);
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
      logger.info('[ipfsService.saveFile] => CID=', cid.toString());
      return cid.toString();
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
      // The 'cat' method returns an async iterator. We need to collect all chunks.
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }

      // Concatenate all chunks into a single, standard Node.js Buffer.
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
