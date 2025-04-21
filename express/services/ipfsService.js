require('dotenv').config();
const { create } = require('ipfs-http-client');

const IPFS_API_URL = process.env.IPFS_API_URL || 'http://127.0.0.1:5001';

let ipfs;
try {
  ipfs = create({ url: IPFS_API_URL });
  console.log('[ipfsService] Connected to IPFS =>', IPFS_API_URL);
} catch(e) {
  console.error('[ipfsService] init error:', e);
}

async function uploadToIPFS(buffer) {
  if (!ipfs) throw new Error('IPFS not initialized');
  const { cid } = await ipfs.add(buffer);
  return cid.toString();
}

module.exports = {
  uploadToIPFS
};
