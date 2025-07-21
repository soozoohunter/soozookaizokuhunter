const { create } = require('ipfs-http-client');
const logger = require('../utils/logger');

class IpfsService {
  constructor() {
    this.client = null;
    this.init();
  }

  init() {
    try {
      const host = process.env.IPFS_HOST || 'suzoo_ipfs';
      const port = parseInt(process.env.IPFS_PORT || '5001', 10);
      const protocol = process.env.IPFS_PROTOCOL || 'http';
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
      const result = await this.client.add(buffer);
      logger.debug(`[ipfsService.saveFile] raw add result: ${JSON.stringify(result)}`);
      let cidStr = '';
      if (result.cid) {
        cidStr = result.cid.toString ? result.cid.toString() : String(result.cid);
      } else if (result.Hash) {
        cidStr = result.Hash;
      } else if (result.path) {
        cidStr = result.path;
      }
      if (!cidStr) {
        throw new Error('IPFS add returned empty CID');
      }
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
    if (!cid) {
      logger.error('[ipfsService.getFile] CID is missing or undefined.');
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
