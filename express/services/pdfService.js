// express/services/pdfService.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const logger = require('../utils/logger');

let base64TTF = '';
try {
    const fontPath = path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf');
    if (fs.existsSync(fontPath)) {
        base64TTF = fs.readFileSync(fontPath).toString('base64');
        logger.info('[PDF Service] NotoSansTC font loaded.');
    } else {
        logger.warn(`[PDF Service] Font file not found at: ${fontPath}`);
    }
} catch (e) {
    logger.error('[PDF Service] Font loading error:', e);
}

const launchBrowser = () => {
    const isHeadless = (process.env.PPTR_HEADLESS ?? 'true').toLowerCase() !== 'false';
    return puppeteer.launch({
        headless: isHeadless ? 'new' : false,
        executablePath: process.env.CHROMIUM_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
};

exports.generateCertificatePDF = async (data, outputPath) => {
    logger.info(`[PDF Service] Generating certificate at: ${outputPath}`);
    let browser;
    try {
        browser = await launchBrowser();
        const page = await browser.newPage();

        const { user, file, title } = data;

        const htmlContent = `
            <html>
                <head>
                    <meta charset="utf-8" />
                    <style>
                        @font-face {
                            font-family: "NotoSans";
                            src: url("data:font/ttf;base64,${base64TTF}") format("truetype");
                        }
                        body { font-family: "NotoSans", sans-serif; margin: 40px; color: #333; }
                        h1 { text-align: center; color: #111; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        .field { margin: 10px 0; font-size: 14px; }
                        b { color: #000; display: inline-block; width: 150px; }
                        .hash { font-family: monospace; word-break: break-all; font-size: 12px; }
                        .footer { text-align: center; margin-top: 50px; color: #888; font-size: 12px; }
                        hr { border: 0; border-top: 1px solid #ccc; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h1>原創著作證明書</h1>
                    <div class="field"><b>作者姓名：</b> ${user.real_name || 'N/A'}</div>
                    <div class="field"><b>電子郵件：</b> ${user.email}</div>
                    <div class="field"><b>手機：</b> ${user.phone || 'N/A'}</div>
                    <hr/>
                    <div class="field"><b>作品標題：</b> ${title || file.title}</div>
                    <div class="field"><b>原始檔名：</b> ${file.filename}</div>
                    <div class="field"><b>存證時間：</b> ${new Date(file.created_at).toLocaleString('zh-TW')}</div>
                    <hr/>
                    <div class="field"><b>數位指紋 (SHA-256)：</b><div class="hash">${file.fingerprint}</div></div>
                    <div class="field"><b>IPFS Hash：</b><div class="hash">${file.ipfs_hash || 'N/A'}</div></div>
                    <div class="field"><b>區塊鏈交易 Hash：</b><div class="hash">${file.tx_hash || 'N/A'}</div></div>
                    <div class="footer">© 2025 SUZOO IP Guard. All rights reserved.</div>
                </body>
            </html>`;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
        logger.info(`[PDF Service] Certificate generated successfully: ${outputPath}`);

    } catch (err) {
        logger.error('[PDF Service] Error generating PDF:', err);
        throw err; // Re-throw the error to be caught by the controller
    } finally {
        if (browser) await browser.close();
    }
};
