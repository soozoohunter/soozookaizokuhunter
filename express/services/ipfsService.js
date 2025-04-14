// services/ipfsService.js
const { create } = require('ipfs-http-client');

const ipfsHost = process.env.IPFS_HOST || 'localhost';
const ipfsPort = process.env.IPFS_PORT || '5001';
let ipfs;
try {
  ipfs = create({ host: ipfsHost, port: ipfsPort, protocol: 'http' });
  console.log(`Connected to IPFS node at ${ipfsHost}:${ipfsPort}`);
} catch (err) {
  console.error('IPFS連線失敗:', err);
}

// 將檔案Buffer存儲到IPFS，返回內容ID (CID)
async function saveFile(buffer) {
  if (!ipfs) throw new Error('IPFS 客戶端未正確初始化');
  const result = await ipfs.add(buffer);
  // 根據 ipfs-http-client 版本，result 可能包含 path 或 cid 屬性
  const cid = result.path || result.cid.toString();
  return cid;
}

module.exports = { saveFile };
