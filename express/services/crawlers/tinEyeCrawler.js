// express/services/crawlers/tinEyeCrawler.js
const fs = require('fs');
const path = require('path');
const { saveScreenshot, handleEngineError } = require('../../utils/screenshotUtil');

async function searchTinEye(browser, imagePath) {
  const engineName = 'tineye';
  let page;
  let resultScreenshot = '';
  let foundLinks = [];
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      page = await browser.newPage();
      await page.goto('https://tineye.com/', { waitUntil:'domcontentloaded', timeout:15000 });

      // 截圖 => 進入首頁
      const homeShot = path.join('uploads', `${engineName}_home_${Date.now()}.png`);
      await saveScreenshot(page, homeShot);

      // 上傳檔案 input
      const fileInput = await page.waitForSelector('input[type=file]', { timeout:8000 });
      await fileInput.uploadFile(imagePath);

      // 等結果載入
      await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 }).catch(()=>{});
      await page.waitForTimeout(3000);

      // 截圖 => 搜尋結果頁
      resultScreenshot = path.join('uploads', `${engineName}_results_${Date.now()}.png`);
      await saveScreenshot(page, resultScreenshot);

      // 取得外部連結
      let links = await page.$$eval('a', as => as.map(a => a.href));
      links = links.filter(h => h && !h.includes('tineye.com'));
      foundLinks = links.slice(0, 5);

      console.log(`[TinEye] found ${foundLinks.length} links at attempt #${attempt}`);
      break; // 成功跳脫重試
    } catch (error) {
      await handleEngineError(page, engineName, attempt, error);
    } finally {
      if (page) await page.close().catch(()=>{});
    }
  }

  return {
    engine: engineName,
    screenshotPath: resultScreenshot,
    links: foundLinks
  };
}

module.exports = { searchTinEye };
