const { exec } = require('child_process');
const fs = require('fs');

async function uploadToIPFS(filePath) {
  return new Promise((resolve, reject) => {
    exec(`ipfs add ${filePath}`, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      const match = stdout.match(/added\s+(\S+)\s+/);
      if (match) {
        // 刪除暫存檔
        fs.unlinkSync(filePath);
        resolve(match[1]);
      } else {
        reject(new Error('無法解析 IPFS hash'));
      }
    });
  });
}

module.exports = { uploadToIPFS };
