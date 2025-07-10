const crypto = require('crypto');

/**
 * 生成一個隨機、安全的臨時密碼。
 * @param {number} length - 密碼長度，預設為 12。
 * @returns {string} - 返回生成的隨機密碼。
 */
function generateTempPassword(length = 12) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') // 轉換為十六進位字串
        .slice(0, length); // 截取所需長度
}

module.exports = {
    generateTempPassword,
};
