/********************************************************************
 * services/ipfsService.js
 ********************************************************************/
const { create } = require('ipfs-http-client');

let ipfs = null;

try {
  // 透過環境變數指定 IPFS 節點
  const ipfsHost = process.env.IPFS_HOST || 'suzoo_ipfs';
  const ipfsPort = process.env.IPFS_PORT || '5001';

  // 使用 ipfs-http-client@56.x 在 CommonJS 環境下仍可 require()
  ipfs = create({
    host: ipfsHost,
    port: ipfsPort,
    protocol: 'http'
  });

  console.log(`[ipfsService] connected to IPFS at ${ipfsHost}:${ipfsPort}`);
} catch (err) {
  console.error('[ipfsService] init fail:', err);
}

/**
 * 將檔案 buffer 新增至 IPFS，回傳 CID 字串
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function saveFile(buffer) {
  if (!ipfs) throw new Error('IPFS 未初始化');
  const result = await ipfs.add(buffer);
  return result.cid.toString(); // 回傳 CID
}

module.exports = { saveFile };
