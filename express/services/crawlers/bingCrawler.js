// express/services/crawlers/bingCrawler.js
const path = require('path');
const { saveScreenshot, handleEngineError } = require('../../utils/screenshotUtil');

async function searchBing(browser, imagePath) {
  const engineName = 'bing';
  let page;
  let resultScreenshot = '';
  let foundLinks = [];
  const maxAttempts = 3;

  for(let attempt=1; attempt<=maxAttempts; attempt++){
    try {
      page = await browser.newPage();
      await page.goto('https://www.bing.com/images', {
        waitUntil:'domcontentloaded',
        timeout:15000
      });
      await page.waitForTimeout(1500);

      // 首頁截圖
      const homeShot = path.join('uploads', `${engineName}_home_${Date.now()}.png`);
      await saveScreenshot(page, homeShot);

      // 點相機
      const cameraBtnSel = '#sbi_l, #sb_sbi';
      await page.waitForSelector(cameraBtnSel, { timeout:8000 });
      await page.click(cameraBtnSel);
      await page.waitForTimeout(1000);

      // v1: waitForFileChooser
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser({ timeout:5000 }),
        page.click(cameraBtnSel)
      ]);
      await fileChooser.accept([imagePath]);
      await page.waitForTimeout(4000);

      // 等載入結果
      await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 }).catch(()=>{});
      await page.waitForTimeout(3000);

      // 結果截圖
      resultScreenshot = path.join('uploads', `${engineName}_results_${Date.now()}.png`);
      await saveScreenshot(page, resultScreenshot);

      // 擷取外部連結
      let links = await page.$$eval('a', as=>as.map(a=>a.href));
      links = links.filter(l => l && !l.includes('bing.com'));
      foundLinks = links.slice(0,5);

      console.log(`[Bing] found ${foundLinks.length} links at attempt #${attempt}`);
      break;
    } catch(err){
      await handleEngineError(page, engineName, attempt, err);
    } finally {
      if(page) await page.close().catch(()=>{});
    }
  }

  return {
    engine: engineName,
    screenshotPath: resultScreenshot,
    links: foundLinks,
    success: foundLinks.length>0
  };
}

module.exports = { searchBing };
