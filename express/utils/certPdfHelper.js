// express/utils/certPdfHelper.js
const fs = require('fs');
const path = require('path');
const { launchBrowser } = require('./browserHelper');

/**
 * 產生證書 PDF
 * @param {object} data
 * @param {string} outputPath
 */
async function generateCertificatePDF(data, outputPath) {
  const {
    name, dob, phone, address, email,
    title, fileName, fingerprint, ipfsHash, txHash,
    serial, mimeType, issueDate, filePath, stampImagePath
  } = data;

  const stampTag = (stampImagePath && fs.existsSync(stampImagePath))
    ? `<img class="stamp" src="file://${stampImagePath}" />`
    : '';

  // 如需預覽圖片
  let preview = '';
  if(filePath && fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    if(/\.(png|jpe?g|webp|gif)$/.test(ext)) {
      const b64 = fs.readFileSync(filePath).toString('base64');
      preview = `<img src="data:image/${ext.slice(1)};base64,${b64}" style="max-width:300px; margin-top:10px;" />`;
    }
  }

  const html = `
  <html>
  <head>
    <meta charset="UTF-8"/>
    <style>
      body { font-family:sans-serif; margin:20px; position:relative; }
      h1 { text-align:center; }
      .stamp {
        position:absolute; width:100px; top:20px; left:20px; opacity:0.7;
        transform:rotate(45deg); border-radius:50%;
      }
      .field { margin:5px 0; }
      .label { font-weight:bold; }
      .preview { margin-top:20px; }
      .footer { margin-top:30px; text-align:center; font-size:12px; color:#666; }
    </style>
  </head>
  <body>
    ${stampTag}
    <h1>原創著作權證書</h1>
    <div class="field"><span class="label">作者:</span> ${name}</div>
    <div class="field"><span class="label">生日:</span> ${dob||''}</div>
    <div class="field"><span class="label">電話:</span> ${phone}</div>
    <div class="field"><span class="label">地址:</span> ${address||''}</div>
    <div class="field"><span class="label">Email:</span> ${email}</div>
    <div class="field"><span class="label">作品標題:</span> ${title}</div>
    <div class="field"><span class="label">檔名:</span> ${fileName}</div>
    <div class="field"><span class="label">Fingerprint(SHA-256):</span> ${fingerprint}</div>
    <div class="field"><span class="label">IPFS Hash:</span> ${ipfsHash||'N/A'}</div>
    <div class="field"><span class="label">區塊鏈 TxHash:</span> ${txHash||'N/A'}</div>
    <div class="field"><span class="label">序號(Serial):</span> ${serial}</div>
    <div class="field"><span class="label">MIME Type:</span> ${mimeType||''}</div>
    <div class="field"><span class="label">產出日期:</span> ${issueDate||''}</div>
    <div class="preview">${preview}</div>
    <div class="footer">© 2025 凱盾全球國際股份有限公司 All Rights Reserved.</div>
  </body>
  </html>
  `;

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil:'networkidle0' });
  await page.emulateMediaType('screen');
  await page.pdf({
    path: outputPath,
    format:'A4',
    printBackground:true
  });
  await browser.close();
}

/**
 * 產生「掃描報告 PDF」
 * @param {Object} param0
 * @param {string} pdfPath
 */
async function generateScanPDF({ file, suspiciousLinks, stampImagePath }, pdfPath) {
  const stampTag = (stampImagePath && fs.existsSync(stampImagePath))
    ? `<img class="stamp" src="file://${stampImagePath}" />`
    : '';

  const linksHtml = suspiciousLinks.length
    ? suspiciousLinks.map(l=>`<div style="word-wrap:break-word;">${l}</div>`).join('')
    : '未發現可疑連結';

  const html = `
  <html>
  <head>
    <meta charset="UTF-8"/>
    <style>
      body { font-family:sans-serif; margin:20px; position:relative; }
      h1 { text-align:center; }
      .stamp {
        position:absolute; width:80px; top:20px; right:20px; opacity:0.7;
        transform:rotate(45deg); border-radius:50%;
      }
      .footer { margin-top:30px; color:#666; text-align:center; font-size:12px; }
    </style>
  </head>
  <body>
    ${stampTag}
    <h1>侵權偵測報告</h1>
    <p>FileID: ${file.id}</p>
    <p>Filename: ${file.filename}</p>
    <p>Fingerprint: ${file.fingerprint}</p>
    <p>Status: ${file.status}</p>
    <hr/>
    <h3>可疑連結:</h3>
    <div>${linksHtml}</div>
    <div class="footer">© 2025 凱盾全球國際股份有限公司 All Rights Reserved.</div>
  </body>
  </html>
  `;

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil:'networkidle0' });
  await page.emulateMediaType('screen');
  await page.pdf({
    path: pdfPath,
    format:'A4',
    printBackground:true
  });
  await browser.close();
}

module.exports = {
  generateCertificatePDF,
  generateScanPDF
};
