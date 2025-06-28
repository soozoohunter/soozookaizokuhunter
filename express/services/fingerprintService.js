const crypto = require('crypto');
const fs = require('fs');

/**
 * 從檔案路徑非同步計算檔案的 SHA256 雜湊值
 * @param {string} filePath - 檔案的絕對路徑
 * @returns {Promise<string>} - 回傳十六進位的 SHA256 字串
 */
function getHashFromFile(filePath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    const hash = crypto.createHash('sha256');

    stream.on('data', (data) => {
      hash.update(data);
    });

    stream.on('end', () => {
      const hexHash = hash.digest('hex');
      resolve(hexHash);
    });

    stream.on('error', (err) => {
      console.error(`[fingerprintService] Error reading file at ${filePath}:`, err);
      reject(err);
    });
  });
}

// 為了與您舊的程式碼兼容，保留 sha256 這個名稱，但它的功能是同步計算 buffer
function sha256(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('Input must be a buffer.');
  }
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = {
  getHashFromFile,
  sha256,
};
