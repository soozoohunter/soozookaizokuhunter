// express/services/crawlers/baiduCrawler.js
const fs = require('fs');
const path = require('path');
const { saveScreenshot, handleEngineError } = require('../../utils/screenshotUtil');

async function searchBaidu(browser, imagePath) {
  const engineName = 'baidu';
  let page;
  let resultScreenshot = '';
  let foundLinks = [];
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      page = await browser.newPage();
      // Baidu 圖片搜尋介面
      await page.goto('https://image.baidu.com/', { waitUntil:'domcontentloaded', timeout:15000 });

      // 截圖 => 首頁
      const homeShot = path.join('uploads', `${engineName}_home_${Date.now()}.png`);
      await saveScreenshot(page, homeShot);

      // 相機按鈕 => 觸發 file input
      const cameraBtn = await page.waitForSelector('span.soutu-btn', { timeout:8000 });
      await cameraBtn.click();

      // 等待 file input
      const fileInput = await page.waitForSelector('input#uploadImg, input[type=file]', { timeout:8000 });
      await fileInput.uploadFile(imagePath);

      // 等待結果
      await page.waitForTimeout(5000);

      // 截圖 => 結果頁
      resultScreenshot = path.join('uploads', `${engineName}_results_${Date.now()}.png`);
      await saveScreenshot(page, resultScreenshot);

      // 取得外部連結
      let links = await page.$$eval('a', as => as.map(a => a.href));
      // 過濾 baidu.com
      links = links.filter(h => h && !h.includes('baidu.com'));
      foundLinks = links.slice(0, 5);

      console.log(`[Baidu] found ${foundLinks.length} links at attempt #${attempt}`);
      break;
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

module.exports = { searchBaidu };
