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

            // **FIX**: Make the service smarter. If the ENV var is not a full URL, build one.
            // This allows using 'suzoo_ipfs' for Python and still works for Node.js.
            if (apiUrl.startsWith('http')) {
                url = new URL(apiUrl);
            } else {
                // Assuming default port 5001 if only a hostname is provided
                url = new URL(`http://${apiUrl}:5001`);
            }

            this.client = create(url);
            logger.info(`[ipfsService] IPFS client configured for ${url.href}`);
            logger.info('[ipfsService] init =>');
            this.client.isOnline().then(isOnline => {
                if (isOnline) {
                    logger.info('[ipfsService] connected to IPFS =>');
                } else {
                    logger.warn('[ipfsService] IPFS client created but node is not online.');
                }
            });

        } catch (error) {
            logger.error('[ipfsService] Failed to initialize IPFS client:', error);
            // The client remains null, subsequent calls will fail with a clear error.
        }
    }

    async saveFile(buffer) {
        if (!this.client) {
            // This error is thrown if init() failed
            throw new Error('IPFS client not initialized (create() failed)');
        }
        try {
            logger.info(`[ipfsService.saveFile] buffer length=${buffer.length}`);
            const result = await this.client.add(buffer);
            logger.info(`[ipfsService.saveFile] => CID= ${result.cid.toString()}`);
            return result.cid.toString();
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

// Export a singleton instance
module.exports = new IpfsService();
