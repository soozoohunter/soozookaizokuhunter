// express/services/ipfsService.js
require('dotenv').config();
const { create } = require('ipfs-http-client');
const logger = require('../utils/logger');

// 預設連線: 'http://127.0.0.1:5001' or 'http://suzoo_ipfs:5001'
const IPFS_API_URL = process.env.IPFS_API_URL || 'http://127.0.0.1:5001';

let client = null;
try {
  logger.info('[ipfsService] init =>', IPFS_API_URL);
  client = create({ url: IPFS_API_URL });
  logger.info('[ipfsService] connected to IPFS =>', IPFS_API_URL);
} catch (err) {
  logger.error('[ipfsService] init error:', err);
  client = null; // 失敗就設為 null
}

async function saveFile(buffer) {
  if (!client) {
    throw new Error('IPFS client not initialized (create() failed)');
  }
  logger.info(`[ipfsService.saveFile] buffer length=${buffer.length}`);

  const added = await client.add(buffer);
  const cidStr = added.cid.toString();
  logger.info('[ipfsService.saveFile] => CID=', cidStr);

  return cidStr;
}

module.exports = { saveFile };
