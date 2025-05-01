/******************************************************
 * express/services/pdf/pdfService.js
 * 
 * 本檔案整合了：
 *  1) 原創證書 PDF (generateCertificate)
 *  2) 侵權偵測報告 PDF (generateReport)
 *  3) 侵權偵測報告 + 相似圖片 + HTML摘要 (generateScanPDFWithMatches)
 *  4) 綜合搜尋引擎報告 PDF (generateSearchReport)
 *  5) 輔助函式 extractTextSummary (含 cheerio)
 * 
 * 請依照實際情況、路徑、字體位置做調整。
 ******************************************************/
 
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const cheerio = require('cheerio'); // 用於擷取 HTML 文字摘要

/******************************************************
 * 輔助函式：從 HTML 擷取純文字摘要 (預設前 500 字)
 ******************************************************/
function extractTextSummary(htmlContent, maxLength = 500) {
  const $ = cheerio.load(htmlContent);
  // 將 <body> 內的所有文字抓出，去除多餘空白
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  // 取前 maxLength 字
  return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
}

/******************************************************
 * 生成【原創證明書 PDF】
 * @param {string} filePath     - 本機檔案路徑 (原檔)
 * @param {string} originalName - 上傳時的原始檔名
 * @param {string} previewUrl   - 圖片/影片截圖線上URL or 本地檔路徑
 * @return {Promise<string>} 完整輸出PDF路徑
 ******************************************************/
async function generateCertificate(filePath, originalName, previewUrl) {
  return new Promise((resolve, reject) => {
    try {
      // 請依您專案結構，自行調整輸出目錄
      const certDir = path.join('public', 'certificates');
      if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
      }
      const base = path.basename(filePath, path.extname(filePath));
      const pdfName = `${base}_certificate.pdf`;
      const pdfPath = path.join(certDir, pdfName);

      const doc = new PDFDocument({ autoFirstPage: true });

      // ★★ [核心] 註冊自訂(中文)字體路徑 (請依實際調整) ★★
      const fontPath = path.join(__dirname, '../../..', 'fonts', 'NotoSansTC-VariableFont_wght.ttf');
      doc.registerFont('NotoSansTC', fontPath);
      doc.font('NotoSansTC');

      const ws = fs.createWriteStream(pdfPath);
      doc.pipe(ws);

      // PDF 內容 (排版可自由調整)
      doc.fontSize(20).text('原創作品證明書', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`檔案名稱：${originalName}`);
      doc.text(`上傳時間：${new Date().toLocaleString()}`);
      if (/\.(mp4|mov|avi|webm)$/i.test(filePath)) {
        doc.text('(此為影片檔，只顯示截圖預覽)');
      }
      doc.moveDown();

      // 插入預覽圖片/影片截圖
      try {
        doc.image(previewUrl, { fit: [300, 300], align: 'center' });
      } catch (e) {
        doc.text('圖片/影片截圖載入失敗');
      }
      doc.moveDown();

      doc.fontSize(12).text('以上圖片為使用者上傳之原創作品，可作為存證依據。');
      doc.text('簽發單位：KaiShield', { align: 'right' });
      doc.text(`簽發時間：${new Date().toLocaleString()}`, { align: 'right' });

      doc.end();
      ws.on('finish', () => resolve(pdfPath));
    } catch (err) {
      reject(err);
    }
  });
}

/******************************************************
 * 生成【侵權偵測報告 PDF】(Bing/TinEye/Baidu 結果列表)
 * @param {string} filePath  - 原始檔案路徑
 * @param {{bing:string[], tineye:string[], baidu:string[]}} results
 * @return {Promise<string>}  - PDF路徑
 ******************************************************/
async function generateReport(filePath, results) {
  return new Promise((resolve, reject) => {
    try {
      const rptDir = path.join('public', 'reports');
      if (!fs.existsSync(rptDir)) {
        fs.mkdirSync(rptDir, { recursive: true });
      }
      const base = path.basename(filePath, path.extname(filePath));
      const pdfName = `${base}_report.pdf`;
      const pdfPath = path.join(rptDir, pdfName);

      const doc = new PDFDocument({ autoFirstPage: true });

      // ★★ [核心] 註冊字體
      const fontPath = path.join(__dirname, '../../..', 'fonts', 'NotoSansTC-VariableFont_wght.ttf');
      doc.registerFont('NotoSansTC', fontPath);
      doc.font('NotoSansTC');

      const ws = fs.createWriteStream(pdfPath);
      doc.pipe(ws);

      doc.fontSize(18).text('侵權偵測報告', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`掃描對象：${path.basename(filePath)}`);
      doc.text(`掃描時間：${new Date().toLocaleString()}`);
      doc.moveDown();

      // Bing
      doc.fontSize(14).text('Bing 結果：', { underline: true });
      doc.fontSize(10);
      if (!results.bing || !results.bing.length) {
        doc.text('無結果');
      } else {
        results.bing.forEach(link => doc.text(link));
      }
      doc.moveDown();

      // TinEye
      doc.fontSize(14).text('TinEye 結果：', { underline: true });
      doc.fontSize(10);
      if (!results.tineye || !results.tineye.length) {
        doc.text('無結果');
      } else {
        results.tineye.forEach(link => doc.text(link));
      }
      doc.moveDown();

      // Baidu
      doc.fontSize(14).text('Baidu 結果：', { underline: true });
      doc.fontSize(10);
      if (!results.baidu || !results.baidu.length) {
        doc.text('無結果');
      } else {
        results.baidu.forEach(link => doc.text(link));
      }
      doc.moveDown();

      doc.fontSize(12).text('以上鏈結僅供參考，請使用者自行比對是否侵權。');
      doc.text('（本報告由系統自動生成）', { align: 'right' });

      doc.end();
      ws.on('finish', () => resolve(pdfPath));
      ws.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

/******************************************************
 * 生成【侵權偵測報告 + 相似圖片 + (可選)快取HTML摘要】PDF
 * @param {Object} options
 *   - file: {id, filename, fingerprint, status}
 *   - suspiciousLinks: string[]
 *   - matchedImages: Array<{id:string, score:number, base64:string}>
 *   - stampImagePath: (可選) 浮水印圖
 *   - cachedHtmlContent: (可選) 來自各平台的 HTML 字串快取 (ex: {bing:'<html>...', ginifab:'<html>...'})
 * @param {string} outputPath - 輸出PDF檔案路徑
 ******************************************************/
async function generateScanPDFWithMatches(
  { file, suspiciousLinks, matchedImages, stampImagePath, cachedHtmlContent },
  outputPath
) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ autoFirstPage: true });

      // ★★ [核心] 註冊字體 (中文)
      const fontPath = path.join(__dirname, '../../..', 'fonts', 'NotoSansTC-VariableFont_wght.ttf');
      doc.registerFont('NotoSansTC', fontPath);
      doc.font('NotoSansTC');

      const ws = fs.createWriteStream(outputPath);
      doc.pipe(ws);

      doc.fontSize(18).text('侵權偵測報告(含相似圖片)', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`File ID: ${file.id}`);
      doc.text(`Filename: ${file.filename}`);
      doc.text(`Fingerprint: ${file.fingerprint}`);
      doc.text(`Status: ${file.status}`);
      doc.moveDown();

      // 可疑連結
      doc.fontSize(14).text('可疑連結:', { underline: true });
      doc.fontSize(10);
      if (!suspiciousLinks || !suspiciousLinks.length) {
        doc.text('尚未發現侵權疑似連結');
      } else {
        suspiciousLinks.forEach((lnk, i) => {
          doc.text(`${i + 1}. ${lnk}`);
        });
      }
      doc.moveDown();

      // 相似圖片
      doc.fontSize(14).text('向量檢索 - 相似圖片:', { underline: true });
      if (matchedImages && matchedImages.length) {
        matchedImages.forEach((img, i) => {
          doc.fontSize(10).text(`${i + 1}. ID=${img.id}, score=${img.score.toFixed(3)}`);
          try {
            const buf = Buffer.from(img.base64, 'base64');
            doc.image(buf, { fit: [200, 200], align: 'left' });
          } catch (e) {
            doc.text('(顯示圖片失敗)');
          }
          doc.moveDown();
        });
      } else {
        doc.fontSize(10).text('未發現相似圖片');
      }
      doc.moveDown();

      // (NEW) 快取HTML摘要
      if (cachedHtmlContent && Object.keys(cachedHtmlContent).length > 0) {
        doc.fontSize(14).text('人工快取網頁摘要:', { underline: true });
        Object.entries(cachedHtmlContent).forEach(([platform, html]) => {
          // 取前 500 字摘要
          const summary = extractTextSummary(html, 500);
          doc.fontSize(12).fillColor('black').text(`平台: ${platform}`, { bold: true });
          doc.fontSize(10).fillColor('gray').text(summary);
          doc.moveDown();
        });
        doc.moveDown();
      }

      // 浮水印 (可選)
      if (stampImagePath && fs.existsSync(stampImagePath)) {
        // 例如蓋在右下角
        doc.image(stampImagePath, doc.page.width - 120, doc.page.height - 120, {
          width: 100,
          opacity: 0.5,
        });
      }

      doc.fontSize(12).fillColor('black').text(`報告時間：${new Date().toLocaleString()}`, { align: 'right' });
      doc.text('© 2025 凱盾全球國際股份有限公司', { align: 'center' });

      doc.end();
      ws.on('finish', () => resolve(outputPath));
      ws.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

/******************************************************
 * 產生【綜合搜尋報告 PDF】(對應 aggregator/fallback 截圖 + 連結)
 * @param {Array} results - 形如 [{engine:'bing', screenshotPath:'', links:[...]}, {...}...]
 * @return {Promise<string>} local pdf path
 ******************************************************/
async function generateSearchReport(results) {
  return new Promise((resolve, reject) => {
    try {
      // 可依需求調整輸出目錄
      if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads');
      }
      const timestamp = Date.now();
      const pdfPath = path.join('uploads', `searchReport_${timestamp}.pdf`);

      const doc = new PDFDocument({ autoFirstPage: false });

      // 同樣註冊中文字體
      const fontPath = path.join(__dirname, '../../..', 'fonts', 'NotoSansTC-VariableFont_wght.ttf');
      doc.registerFont('NotoSansTC', fontPath);
      doc.font('NotoSansTC');

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // 對於每個搜尋引擎，各佔一頁
      for (const r of results) {
        doc.addPage();
        doc.fontSize(18).text(`${r.engine.toUpperCase()} Search Results`, { align: 'center' });
        doc.moveDown();

        // 放截圖
        if (r.screenshotPath && fs.existsSync(r.screenshotPath)) {
          doc.image(r.screenshotPath, { fit: [500, 400], align: 'center' });
        } else {
          doc.text('No Screenshot', { align: 'center' });
        }

        doc.moveDown();
        doc.fontSize(12).text('Links:', { underline: true });
        if (r.links && r.links.length) {
          r.links.forEach((lnk, idx) => {
            // 顯示藍色連結文字 (PDFKit 不真正超連結，但可給出 link)
            doc.fillColor('blue').text(`${idx + 1}. ${lnk}`, {
              link: lnk,
              underline: false
            });
          });
        } else {
          doc.text('No external links found');
        }
      }

      doc.end();
      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);

    } catch (err) {
      reject(err);
    }
  });
}

/******************************************************
 * 匯出所有方法
 ******************************************************/
module.exports = {
  // 與您原始 code 相對應
  generateCertificate,
  generateReport,
  generateScanPDFWithMatches,
  generateSearchReport,
  extractTextSummary
};
