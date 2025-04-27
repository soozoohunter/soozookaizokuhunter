// express/services/crawlers/bingCrawler.js
const fs = require('fs');
const path = require('path');
const { saveScreenshot, handleEngineError } = require('../../utils/screenshotUtil');

async function searchBing(browser, imagePath) {
  const engineName = 'bing';
  let page;
  let resultScreenshot = '';
  let foundLinks = [];
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      page = await browser.newPage();
      await page.goto('https://www.bing.com/images', { waitUntil:'domcontentloaded', timeout:15000 });
      
      // 截圖 => 進入首頁
      const homeShot = path.join('uploads', `${engineName}_home_${Date.now()}.png`);
      await saveScreenshot(page, homeShot);

      // 點擊相機按鈕以開啟上傳彈窗
      // Bing 可能不斷改版 => 請自行檢查目前 selector
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('#sb_sbi') // e.g. Bing圖片搜尋框旁的相機ID
      ]);

      // 上傳檔案
      await fileChooser.accept([imagePath]);

      // 等待結果 => 可能需改特定 selector
      await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 }).catch(()=>{});
      await page.waitForTimeout(3000);

      // 截圖 => 搜尋結果頁
      resultScreenshot = path.join('uploads', `${engineName}_results_${Date.now()}.png`);
      await saveScreenshot(page, resultScreenshot);

      // 取得外部連結
      let links = await page.$$eval('a', as => as.map(a => a.href));
      links = links.filter(h => h && !h.includes('bing.com'));
      foundLinks = links.slice(0, 5); // 只拿前5筆
      console.log(`[Bing] found ${foundLinks.length} links at attempt #${attempt}`);

      break; // 成功取得結果就離開重試循環
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

module.exports = { searchBing };
