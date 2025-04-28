// express/services/pdfService.js
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * 生成原創證明書 PDF，包含上傳檔案預覽與基本資訊
 * @param {string} filePath - 本機檔案路徑
 * @param {string} originalName - 使用者上傳時的原始檔名
 * @param {string} previewUrl - Cloudinary（或其他）線上圖片/影片預覽 URL
 * @return {Promise<string>} - 回傳生成之證書PDF檔案的完整路徑
 */
async function generateCertificate(filePath, originalName, previewUrl) {
  return new Promise((resolve, reject) => {
    try {
      // 建立目錄
      const certDir = path.join('public', 'certificates');
      if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
      }
      // 產生檔名
      const base = path.basename(filePath, path.extname(filePath));
      const pdfName = `${base}_certificate.pdf`;
      const pdfPath = path.join(certDir, pdfName);

      const doc = new PDFDocument({ autoFirstPage: true });
      const ws = fs.createWriteStream(pdfPath);
      doc.pipe(ws);

      doc.fontSize(20).text('原創作品證明書', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`檔案名稱：${originalName}`);
      const now = new Date().toLocaleString();
      doc.text(`上傳時間：${now}`);
      // 若是影片，可提示「只顯示一個截圖」
      if (/\.(mp4|mov|avi|webm)$/i.test(filePath)) {
        doc.text('(此為影片檔案，預覽圖僅擷取影片截圖)');
      }
      doc.moveDown();

      // 插入預覽圖（線上URL）
      // pdfkit 若可直接拿URL顯示，需要 Node v10+ & pdfkit 0.12+ ；若失敗可先下載 Buffer 再嵌
      doc.image(previewUrl, { fit: [300, 300], align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text('以上圖片為使用者上傳之原創作品，可作為基本存證依據。', { align: 'left' });
      doc.text('簽發單位：KaiShield', { align: 'right' });
      doc.text(`簽發時間：${now}`, { align: 'right' });

      doc.end();
      ws.on('finish', () => resolve(pdfPath));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 生成「侵權偵測報告 PDF」，包含 Bing/TinEye/Baidu 之搜尋結果鏈結
 * @param {string} filePath - 原始上傳檔案 (本機路徑)
 * @param {{bing: string[], tineye: string[], baidu: string[]}} results - 搜尋結果
 * @return {Promise<string>} - 報告PDF完整路徑
 */
async function generateReport(filePath, results) {
  return new Promise((resolve, reject) => {
    try {
      const reportDir = path.join('public', 'reports');
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      const base = path.basename(filePath, path.extname(filePath));
      const pdfName = `${base}_report.pdf`;
      const pdfPath = path.join(reportDir, pdfName);

      const doc = new PDFDocument();
      const ws = fs.createWriteStream(pdfPath);
      doc.pipe(ws);

      doc.fontSize(18).text('侵權偵測報告', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`檔案：${path.basename(filePath)}`);
      doc.text(`掃描時間：${new Date().toLocaleString()}`);
      doc.moveDown();

      // Bing
      doc.fontSize(14).text('Bing 搜尋結果：', { underline: true });
      doc.fontSize(10);
      if (results.bing.length === 0) {
        doc.text('無發現相關結果');
      } else {
        results.bing.forEach(link => doc.text(link));
      }
      doc.moveDown();

      // TinEye
      doc.fontSize(14).text('TinEye 搜尋結果：', { underline: true });
      doc.fontSize(10);
      if (results.tineye.length === 0) {
        doc.text('無發現相關結果');
      } else {
        results.tineye.forEach(link => doc.text(link));
      }
      doc.moveDown();

      // Baidu
      doc.fontSize(14).text('Baidu 搜尋結果：', { underline: true });
      doc.fontSize(10);
      if (results.baidu.length === 0) {
        doc.text('無發現相關結果');
      } else {
        results.baidu.forEach(link => doc.text(link));
      }
      doc.moveDown();

      doc.fontSize(12).text('以上鏈結僅供參考，請使用者自行比對是否構成侵權。', { align: 'left' });
      doc.text('（本報告由系統自動生成）', { align: 'right' });

      doc.end();
      ws.on('finish', () => resolve(pdfPath));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateCertificate,
  generateReport
};
