const crypto = require('crypto');
const fs = require('fs').promises;

exports.calculateSHA256 = async (filePath) => {
    try {
        const fileBuffer = await fs.readFile(filePath);
        const hash = crypto.createHash('sha256');
        hash.update(fileBuffer);
        return hash.digest('hex');
    } catch (error) {
        console.error(`[Crypto Utils] 計算SHA256錯誤: ${error.message}`);
        throw new Error('文件指紋計算失敗');
    }
};
