const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const logger = require('../utils/logger');
// const chain = require('../utils/chain'); // 如需上鏈可取消註解

const launchBrowser = () => {
    return puppeteer.launch({
        headless: 'new',
        executablePath: process.env.CHROMIUM_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
};

// 通用檢索函式
async function searchTIPO(keyword, searchType) {
    let browser;
    try {
        logger.info(`[Trademark] Starting TIPO search for keyword: "${keyword}", type: "${searchType}"`);
        browser = await launchBrowser();
        const page = await browser.newPage();
        
        // TIPO 網站 URL
        const url = `https://cloud.tipo.gov.tw/S282/S282WV1/#/?searchBy=${searchType}&kw=${encodeURIComponent(keyword)}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // 等待查詢結果的選擇器出現 (請根據實際 TIPO 網站的 class name 調整)
        await page.waitForSelector('.table-responsive', { timeout: 15000 });

        // 在瀏覽器環境中執行 JS 來提取資料
        const results = await page.evaluate(() => {
            const data = [];
            const rows = document.querySelectorAll('.table-responsive tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > 5) {
                    data.push({
                        applicationNumber: cells[1]?.innerText.trim(),
                        trademarkName: cells[3]?.innerText.trim(),
                        applicant: cells[4]?.innerText.trim(),
                        status: cells[5]?.innerText.trim(),
                    });
                }
            });
            return data;
        });

        logger.info(`[Trademark] Found ${results.length} results for "${keyword}"`);
        return results;

    } catch(err) {
        logger.error(`[Trademark] Puppeteer failed for keyword "${keyword}"`, err);
        throw new Error('無法從 TIPO 網站擷取資料，可能是網站結構已變更或服務暫時不可用。');
    } finally {
        if (browser) await browser.close();
    }
}

// 申請前檢索 - 文字
router.get('/pre-text', async (req, res) => {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ error: '缺少 keyword 參數' });
    try {
        const results = await searchTIPO(keyword, 'text');
        res.json({ searchType: 'pre-text', keyword, results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 申請前檢索 - 圖形 (這裡的 keyword 可能是圖形分類碼)
router.get('/pre-mark', async (req, res) => {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ error: '缺少 keyword 參數' });
    try {
        const results = await searchTIPO(keyword, 'mark');
        res.json({ searchType: 'pre-mark', keyword, results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
