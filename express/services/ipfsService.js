// express/services/ipfsService.js
require('dotenv').config();
const { create } = require('ipfs-http-client');

// 預設連線: 'http://127.0.0.1:5001' or 'http://suzoo_ipfs:5001'
const IPFS_API_URL = process.env.IPFS_API_URL || 'http://127.0.0.1:5001';

let client = null;
try {
  client = create({ url: IPFS_API_URL });
  console.log('[ipfsService] connected to IPFS =>', IPFS_API_URL);
} catch (err) {
  console.error('[ipfsService] init error:', err);
}

async function saveFile(buffer) {
  if (!client) throw new Error('IPFS client not initialized');
  const added = await client.add(buffer);
  return added.cid.toString();
}

module.exports = { saveFile };
