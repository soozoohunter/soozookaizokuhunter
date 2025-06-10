// express/services/crawlers/baiduCrawler.js
const path = require('path');
const { saveScreenshot, handleEngineError } = require('../../utils/screenshotUtil');

const ENGINE_MAX_LINKS = parseInt(process.env.ENGINE_MAX_LINKS, 10) || 50;

async function searchBaidu(browser, imagePath) {
  const engineName='baidu';
  let page;
  let resultScreenshot='';
  let foundLinks=[];
  const maxAttempts=3;

  for(let attempt=1; attempt<=maxAttempts; attempt++){
    try{
      page=await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/113');
      await page.goto('https://image.baidu.com/', {
        waitUntil:'domcontentloaded',
        timeout:15000
      });
      await page.waitForTimeout(2000);

      const homeShot = path.join('uploads', `${engineName}_home_${Date.now()}.png`);
      await saveScreenshot(page, homeShot);

      // 可能需要點擊相機按鈕
      const cameraBtn=await page.$('span.soutu-btn');
      if(cameraBtn){
        await cameraBtn.click();
        await page.waitForTimeout(1000);
      }

      const fileInputSel='input#uploadImg, input[type=file]';
      const fileInput=await page.waitForSelector(fileInputSel, { timeout:8000 });
      await fileInput.uploadFile(imagePath);
      await page.waitForTimeout(5000);

      resultScreenshot=path.join('uploads', `${engineName}_results_${Date.now()}.png`);
      await saveScreenshot(page, resultScreenshot);

      let links=await page.$$eval('a', as=>as.map(a=>a.href));
      links=links.filter(l => l && !l.includes('baidu.com'));
      foundLinks=links.slice(0, ENGINE_MAX_LINKS);

      console.log(`[Baidu] found ${foundLinks.length} links at attempt #${attempt}`);
      break;
    } catch(err){
      await handleEngineError(page, engineName, attempt, err);
    } finally {
      if(page) await page.close().catch(()=>{});
    }
  }

  return {
    engine:engineName,
    screenshotPath:resultScreenshot,
    links:foundLinks,
    success: foundLinks.length>0
  };
}

module.exports = { searchBaidu };
