const logger = require('../utils/logger');

/**
 * 這是一個臨時的、假的 PDF 生成函式，用於防止應用程式崩潰。
 * 當您提供了真實的 PDF 生成邏輯後，我會為您替換掉它。
 * @param {object} data - 生成證書所需的數據
 * @returns {Promise<string>} - 返回一個假的 PDF 文件路徑
 */
async function generateCertificatePDF(data) {
  logger.warn('[PDF Service] Using temporary patch for generateCertificatePDF. No actual PDF will be generated.');

  // 模擬異步操作
  await new Promise(resolve => setTimeout(resolve, 50));

  // 假設 PDF 已生成並儲存在一個臨時路徑
  const fakePdfPath = '/tmp/fake-certificate.pdf';
  logger.info(`[PDF Service] Mock PDF generated for user: ${data.userName}, file: ${data.fileName}. Path: ${fakePdfPath}`);

  return fakePdfPath;
}

module.exports = {
  generateCertificatePDF,
};
