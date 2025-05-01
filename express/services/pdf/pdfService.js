// express/services/pdf/pdfService.js
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * 產生綜合搜尋報告 PDF
 * @param {Array} results 形如 [{engine:'bing', screenshotPath:'', links:[...]}, {...}...]
 * @return {string} local pdf path
 */
async function generateSearchReport(results) {
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }
  const timestamp = Date.now();
  const pdfPath = path.join('uploads', `searchReport_${timestamp}.pdf`);

  const doc = new PDFDocument({ autoFirstPage: false });

  // ★★ 同樣註冊中文字體
  const fontPath = path.join(__dirname, '../../../fonts/NotoSansTC-VariableFont_wght.ttf');
  doc.registerFont('NotoSansTC', fontPath);
  doc.font('NotoSansTC');

  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // 對於每個搜尋引擎，各佔一頁
  for (const r of results) {
    doc.addPage();
    doc.fontSize(18).text(`${r.engine.toUpperCase()} Search Results`, { align:'center' });
    doc.moveDown();

    // 放截圖
    if (r.screenshotPath && fs.existsSync(r.screenshotPath)) {
      doc.image(r.screenshotPath, { fit:[500, 400], align:'center' });
    } else {
      doc.text('No Screenshot', { align:'center' });
    }

    doc.moveDown();
    doc.fontSize(12).text('Links:', { underline:true });
    if (r.links && r.links.length) {
      r.links.forEach((lnk, idx) => {
        // 顯示藍色連結文字
        doc.fillColor('blue').text(`${idx+1}. ${lnk}`, {
          link: lnk,
          underline:false
        });
      });
    } else {
      doc.text('No external links found');
    }
  }

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      resolve(pdfPath);
    });
    stream.on('error', reject);
  });
}

module.exports = { generateSearchReport };
