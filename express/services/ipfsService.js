// express/services/ipfsService.js
require('dotenv').config();
const { create } = require('ipfs-http-client');
const logger = require('../utils/logger');
const { concat: uint8ArrayConcat } = require('uint8arrays/concat');

// 預設連線: 'http://suzoo_ipfs:5001'
const IPFS_API_URL = process.env.IPFS_API_URL || 'http://suzoo_ipfs:5001';

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

// Retrieve a file buffer from IPFS by CID
async function getFile(cid) {
  if (!client) {
    throw new Error('IPFS client not initialized (create() failed)');
  }
  try {
    logger.info(`[ipfsService.getFile] Fetching CID: ${cid}`);
    const chunks = [];
    for await (const chunk of client.cat(cid)) {
      chunks.push(chunk);
    }
    const uint8Buffer = uint8ArrayConcat(chunks);
    const buffer = Buffer.from(uint8Buffer);
    logger.info(`[ipfsService.getFile] Successfully fetched ${buffer.length} bytes for CID: ${cid}`);
    return buffer;
  } catch (err) {
    logger.error(`[ipfsService.getFile] Failed to get file for CID ${cid}:`, err.message);
    return null;
  }
}

module.exports = { saveFile, getFile };
