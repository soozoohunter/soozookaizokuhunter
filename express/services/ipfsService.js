/********************************************************************
 * services/ipfsService.js
 ********************************************************************/
const { create } = require('ipfs-http-client');

let ipfs = null;
try {
  // 透過環境變數指定 IPFS 節點
  const ipfsHost = process.env.IPFS_HOST || 'suzoo_ipfs';
  const ipfsPort = process.env.IPFS_PORT || '5001';
  ipfs = create({ host: ipfsHost, port: ipfsPort, protocol: 'http' });
  console.log(`[ipfsService] connected to IPFS at ${ipfsHost}:${ipfsPort}`);
} catch (err) {
  console.error('[ipfsService] init fail:', err);
}

async function saveFile(buffer) {
  if (!ipfs) throw new Error('IPFS 未初始化');
  const result = await ipfs.add(buffer);
  // `result` 可能包含 path 或 cid 屬性
  const cid = result.cid.toString();
  return cid;
}

module.exports = { saveFile };
