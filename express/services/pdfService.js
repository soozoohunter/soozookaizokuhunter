const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * 生成報告 PDF，包含提供的結果數據與截圖證據等。
 * @param {Object} data - 掃描結果數據，包含fingerprint, ipfsHash, txHash, results等。
 * @returns {Buffer} PDF文件的二進位內容 (可直接發送給客戶端)。
 */
async function generatePDF(data) {
    // 構建 PDF 內容的 HTML 字串
    const { fingerprint, ipfsHash, txHash, results, suspiciousLinks } = data;
    // 內嵌 base64 字型（如 Noto Sans CJK，用於顯示中文）
    let fontFaceStyle = '';
    try {
        const fontData = fs.readFileSync(path.join(__dirname, '../public/NotoSansCJK-Regular.ttf'), 'base64');
        fontFaceStyle = `
            <style>
            @font-face {
                font-family: "NotoSansCJK";
                src: url(data:font/ttf;base64,${fontData}) format("truetype");
            }
            body { font-family: "NotoSansCJK", sans-serif; }
            </style>`;
    } catch (e) {
        console.warn('嵌入字型失敗，將使用系統字型', e);
    }
    // 內嵌 stamp.png 圖片（簽章/Logo等）
    let stampImageHtml = '';
    try {
        const stampData = fs.readFileSync(path.join(__dirname, '../public/stamp.png'), 'base64');
        stampImageHtml = `<img src="data:image/png;base64,${stampData}" alt="Stamp" style="position:absolute; top:20px; right:20px; width:100px; opacity:0.5;" />`;
    } catch (e) {
        console.warn('stamp.png 載入失敗', e);
    }

    // 構建結果條目 HTML 列表
    let resultsHtml = '';
    results.forEach((resSet, idx) => {
        const { bing, tineye, baidu } = resSet;
        resultsHtml += `<h3>搜索结果集 ${idx+1}：</h3><ul>`;
        [bing, tineye, baidu].forEach(engineRes => {
            resultsHtml += `<li><b>${engineRes.engine}：</b> `;
            if (!engineRes.success) {
                resultsHtml += `<span style="color:red;">搜尋失敗：${engineRes.error}</span>`;
            } else if (engineRes.links.length === 0) {
                resultsHtml += `未找到相符結果。`;
            } else {
                resultsHtml += `找到 ${engineRes.links.length} 個結果，包含連結：`;
                resultsHtml += '<ul>';
                engineRes.links.slice(0, 5).forEach(link => {
                    resultsHtml += `<li>${link}</li>`;
                });
                if (engineRes.links.length > 5) {
                    resultsHtml += `<li>...共${engineRes.links.length}條</li>`;
                }
                resultsHtml += '</ul>';
            }
            resultsHtml += `</li>`;
        });
        resultsHtml += `</ul>`;
    });
    let suspiciousHtml = suspiciousLinks && suspiciousLinks.length
        ? `<p style="color:red;"><b>可疑鏈結:</b><br>${suspiciousLinks.join('<br>')}</p>`
        : `<p><b>可疑鏈結:</b> 無</p>`;

    const htmlContent = `
        <html>
        <head>
            <meta charset="utf-8">
            ${fontFaceStyle}
            <style>
                body { margin: 40px; font-size: 14px; }
                h1 { text-align: center; }
                h3 { margin-top: 20px; }
                ul { margin-bottom: 20px; }
            </style>
        </head>
        <body>
            ${stampImageHtml}
            <h1>掃描報告</h1>
            <p><b>Fingerprint:</b> ${fingerprint}</p>
            <p><b>IPFS Hash:</b> ${ipfsHash || '（無）'}</p>
            <p><b>Tx Hash:</b> ${txHash || '（無）'}</p>
            <hr>
            <h2>侵權掃描結果：</h2>
            ${suspiciousHtml}
            ${resultsHtml}
        </body>
        </html>
    `;

    // 使用 Puppeteer 生成 PDF
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    try {
        const page = await browser.newPage();
        // 設置合適的紙張尺寸
        await page.setViewport({ width: 1280, height: 800 });
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        return pdfBuffer;
    } finally {
        await browser.close();
    }
}

module.exports = { generatePDF };
