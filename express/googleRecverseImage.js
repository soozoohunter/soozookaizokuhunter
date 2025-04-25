/**
 * googleReverseImage.js
 *
 * 說明：
 *   透過 Puppeteer 自動化「Google 以圖搜圖」，
 *   上傳本地圖片並擷取前幾個搜尋結果連結 (範例抓5筆)。
 *
 * 使用方式 (CLI)：
 *   node googleReverseImage.js ./test.jpg
 *
 * 注意：
 *   - 若出現 reCAPTCHA 或介面改動，本程式可能失效
 *   - 只適合「單次測試、個人用」；商業/大量用途可能違反 Google TOS
 */

const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  // 1) 解析命令列參數 => 圖片路徑
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error('請輸入圖片路徑：\n  例：node googleReverseImage.js ./test.jpg');
    process.exit(1);
  }

  // 2) 啟動 Puppeteer
  const browser = await puppeteer.launch({
    headless: true, // 如要觀察流程，可設 false
    defaultViewport: { width: 1280, height: 800 },
  });
  const page = await browser.newPage();

  try {
    // 3) 進入 Google 圖片搜尋頁
    await page.goto('https://images.google.com/', { waitUntil: 'networkidle2' });

    // 4) 點擊「相機」icon (英文介面 selector 下列可能需要調整)
    const cameraButtonSelector = 'div[jsname="Q4LuWd"] a.Q4LuWd';
    await page.waitForSelector(cameraButtonSelector, { timeout: 8000 });
    await page.click(cameraButtonSelector);

    // 5) 點擊「Upload an image」Tab (英文介面)
    const uploadTabSelector = 'a[aria-label="Upload an image"]';
    await page.waitForSelector(uploadTabSelector, { timeout: 8000 });
    await page.click(uploadTabSelector);

    // 6) 上傳檔案
    const fileInputSelector = 'input#qbfile';
    await page.waitForSelector(fileInputSelector, { timeout: 8000 });
    const absoluteImgPath = path.resolve(imagePath);
    const fileInput = await page.$(fileInputSelector);
    await fileInput.uploadFile(absoluteImgPath);

    // 7) 等待搜尋結果
    await page.waitForTimeout(4000);

    // 8) 取得前 5 個搜尋結果連結
    const resultsSelector = 'div.g a';
    await page.waitForSelector(resultsSelector, { timeout: 15000 });
    const links = await page.$$eval(resultsSelector, (anchors) =>
      anchors.slice(0, 5).map((a) => a.href)
    );

    console.log('【以圖搜圖】前 5 個搜尋結果連結：');
    links.forEach((lnk) => console.log(' -', lnk));

  } catch (err) {
    console.error('操作失敗:', err);
  } finally {
    await browser.close();
  }
})();
