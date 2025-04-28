// express/services/crawlers/tinEyeCrawler.js
const path = require('path');
const { saveScreenshot, handleEngineError } = require('../../utils/screenshotUtil');

async function searchTinEye(browser, imagePath){
  const engineName = 'tineye';
  let page;
  let resultScreenshot='';
  let foundLinks=[];
  const maxAttempts=3;

  for(let attempt=1; attempt<=maxAttempts; attempt++){
    try {
      page = await browser.newPage();
      await page.goto('https://tineye.com/', {
        waitUntil:'domcontentloaded',
        timeout:15000
      });

      const homeShot = path.join('uploads', `${engineName}_home_${Date.now()}.png`);
      await saveScreenshot(page, homeShot);

      const fileInputSel='input[type=file][name="image"]';
      const fileInput = await page.waitForSelector(fileInputSel, { timeout:8000 });
      await fileInput.uploadFile(imagePath);
      await page.waitForTimeout(2000);

      await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 }).catch(()=>{});
      await page.waitForTimeout(2000);

      resultScreenshot = path.join('uploads', `${engineName}_results_${Date.now()}.png`);
      await saveScreenshot(page, resultScreenshot);

      let links = await page.$$eval('a', as=>as.map(a=>a.href));
      links = links.filter(l => l && !l.includes('tineye.com'));
      foundLinks = links.slice(0,5);

      console.log(`[TinEye] found ${foundLinks.length} links at attempt #${attempt}`);
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

module.exports = { searchTinEye };ｃｃ
