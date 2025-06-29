// express/services/ipfsService.js (Final Robust Version)
const { create } = require('ipfs-http-client');
const logger = require('../utils/logger');
const all = require('it-all');
const { concat: uint8ArrayConcat } = require('uint8arrays/concat');

class IpfsService {
    constructor() {
        this.client = null;
        this.init();
    }

    init() {
        try {
            const apiUrl = process.env.IPFS_API_URL || 'suzoo_ipfs';
            let url;

            if (apiUrl.startsWith('http')) {
                url = new URL(apiUrl);
            } else {
                url = new URL(`http://${apiUrl}:5001`);
            }
            
            this.client = create(url);
            logger.info(`[ipfsService] IPFS client configured for ${url.hostname}:${url.port}`);
            // **FIX**: Removed the problematic isOnline() check to avoid startup errors.
            // The first real operation (add or cat) will test the connection anyway.
            logger.info('[ipfsService] init => client created.');

        } catch (error) {
            logger.error('[ipfsService] Failed to initialize IPFS client:', error);
        }
    }

    async saveFile(buffer) {
        if (!this.client) {
            throw new Error('IPFS client not initialized (create() failed)');
        }
        try {
            logger.info(`[ipfsService.saveFile] buffer length=${buffer.length}`);
            const result = await this.client.add(buffer);
            const cid = result.cid.toString();
            logger.info(`[ipfsService.saveFile] => CID= ${cid}`);
            return cid;
        } catch (error) {
            logger.error('[ipfsService.saveFile] Failed to save file:', error);
            throw error;
        }
    }

    async getFile(cid) {
        if (!this.client) {
            throw new Error('IPFS client not initialized (create() failed)');
        }
        try {
            logger.info(`[ipfsService.getFile] Fetching CID: ${cid}`);
            const chunks = await all(this.client.cat(cid));
            const buffer = uint8ArrayConcat(chunks);
            logger.info(`[ipfsService.getFile] Successfully fetched ${buffer.length} bytes for CID: ${cid}`);
            return buffer;
        } catch (error) {
            logger.error(`[ipfsService.getFile] Failed to get file for CID ${cid}:`, error);
            return null;
        }
    }
}

module.exports = new IpfsService();
