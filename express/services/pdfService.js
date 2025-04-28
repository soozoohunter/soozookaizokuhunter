// express/services/pdfService.js
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * 生成原創證明書 PDF (預覽圖 + 作品資訊)
 * @param {string} filePath - 本機檔案路徑
 * @param {string} originalName - 上傳時的原始檔名
 * @param {string} previewUrl - 圖片或影片截圖線上URL / 或本地圖片
 * @return {Promise<string>} 完整輸出PDF路徑
 */
async function generateCertificate(filePath, originalName, previewUrl) {
  return new Promise((resolve, reject) => {
    try {
      const certDir = path.join('public', 'certificates');
      if(!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive:true });
      }
      const base = path.basename(filePath, path.extname(filePath));
      const pdfName = `${base}_certificate.pdf`;
      const pdfPath = path.join(certDir, pdfName);

      const doc = new PDFDocument({ autoFirstPage:true });
      const ws = fs.createWriteStream(pdfPath);
      doc.pipe(ws);

      doc.fontSize(20).text('原創作品證明書', { align:'center' });
      doc.moveDown();

      doc.fontSize(12).text(`檔案名稱：${originalName}`);
      doc.text(`上傳時間：${new Date().toLocaleString()}`);
      if(/\.(mp4|mov|avi|webm)$/i.test(filePath)) {
        doc.text('(此為影片檔，只顯示截圖預覽)');
      }
      doc.moveDown();

      // 插入圖片 (可為線上URL or 本地檔)
      doc.image(previewUrl, { fit:[300,300], align:'center' });
      doc.moveDown();

      doc.fontSize(12).text('以上圖片為使用者上傳之原創作品，可作為存證依據。');
      doc.text('簽發單位：KaiShield', { align:'right' });
      doc.text(`簽發時間：${new Date().toLocaleString()}`, { align:'right' });

      doc.end();
      ws.on('finish', ()=> resolve(pdfPath));
    } catch(err) {
      reject(err);
    }
  });
}

/**
 * 生成侵權偵測報告 PDF (Bing/TinEye/Baidu 結果)
 * @param {string} filePath - 原始檔案路徑
 * @param {{bing:string[], tineye:string[], baidu:string[]}} results
 * @return {Promise<string>}
 */
async function generateReport(filePath, results) {
  return new Promise((resolve, reject)=>{
    try {
      const rptDir = path.join('public', 'reports');
      if(!fs.existsSync(rptDir)) {
        fs.mkdirSync(rptDir, { recursive:true });
      }
      const base = path.basename(filePath, path.extname(filePath));
      const pdfName = `${base}_report.pdf`;
      const pdfPath = path.join(rptDir, pdfName);

      const doc = new PDFDocument();
      const ws = fs.createWriteStream(pdfPath);
      doc.pipe(ws);

      doc.fontSize(18).text('侵權偵測報告', { align:'center' });
      doc.moveDown();

      doc.fontSize(12).text(`掃描對象：${path.basename(filePath)}`);
      doc.text(`掃描時間：${new Date().toLocaleString()}`);
      doc.moveDown();

      // Bing
      doc.fontSize(14).text('Bing 結果：', { underline:true });
      doc.fontSize(10);
      if(!results.bing.length) {
        doc.text('無結果');
      } else {
        results.bing.forEach(link => doc.text(link));
      }
      doc.moveDown();

      // TinEye
      doc.fontSize(14).text('TinEye 結果：', { underline:true });
      doc.fontSize(10);
      if(!results.tineye.length) {
        doc.text('無結果');
      } else {
        results.tineye.forEach(link => doc.text(link));
      }
      doc.moveDown();

      // Baidu
      doc.fontSize(14).text('Baidu 結果：', { underline:true });
      doc.fontSize(10);
      if(!results.baidu.length) {
        doc.text('無結果');
      } else {
        results.baidu.forEach(link => doc.text(link));
      }
      doc.moveDown();

      doc.fontSize(12).text('以上鏈結僅供參考，請使用者自行比對是否侵權。', { align:'left' });
      doc.text('（本報告由系統自動生成）', { align:'right' });

      doc.end();
      ws.on('finish', ()=>resolve(pdfPath));
    } catch(err) {
      reject(err);
    }
  });
}

module.exports = {
  generateCertificate,
  generateReport
};
