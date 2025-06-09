// express/services/infringementService.js
const fs = require('fs');
const path = require('path');
const { launchBrowser } = require('../utils/browserHelper');
const { searchGinifab } = require('./crawlers/ginifabCrawler');
const { searchBing } = require('./crawlers/bingCrawler');
const { searchTinEye } = require('./crawlers/tinEyeCrawler');
const { searchBaidu } = require('./crawlers/baiduCrawler');
// optional: 也可將 ginifabEngine(增強版) 直接放這裡

/**
 * detectInfringement
 * 先嘗試 aggregator (Ginifab) => 若全部失敗 => fallback 直連
 * @param {string} localFilePath - 供 Bing/TinEye/Baidu 做本機上傳
 * @param {string} [publicUrl]   - 供 Ginifab aggregator 貼上 (圖片必須可公開存取)
 * @returns {Promise<{success:boolean, results:any[], pdfPath?:string}>}
 */
async function detectInfringement(localFilePath, publicUrl='') {
  if(!fs.existsSync(localFilePath)){
    throw new Error(`File not found => ${localFilePath}`);
  }
  const browser = await launchBrowser();
  let aggregatorResults=null;

  try {
    // aggregator => ginifab
    aggregatorResults = await searchGinifab(browser, publicUrl);
  } catch(e){
    console.warn('[detectInfringement] aggregator fail => fallback direct. err=', e);
  }

  let finalResults=[];
  if(aggregatorResults &&
    (aggregatorResults.bing.success ||
     aggregatorResults.tineye.success ||
     aggregatorResults.baidu.success)
  ){
    console.log('[detectInfringement] aggregator at least one success => use aggregator results');
    finalResults.push({
      engine:'bing', links:aggregatorResults.bing.links,
      screenshotPath:aggregatorResults.bing.screenshot,
      success:aggregatorResults.bing.success
    });
    finalResults.push({
      engine:'tineye', links:aggregatorResults.tineye.links,
      screenshotPath:aggregatorResults.tineye.screenshot,
      success:aggregatorResults.tineye.success
    });
    finalResults.push({
      engine:'baidu', links:aggregatorResults.baidu.links,
      screenshotPath:aggregatorResults.baidu.screenshot,
      success:aggregatorResults.baidu.success
    });
  } else {
    // fallback direct
    console.log('[detectInfringement] aggregator fail => do direct approach');
    const rBing   = await searchBing(browser, localFilePath);
    const rTinEye = await searchTinEye(browser, localFilePath);
    const rBaidu  = await searchBaidu(browser, localFilePath);
    finalResults.push(rBing, rTinEye, rBaidu);
  }

  await browser.close();

  return {
    success: true,
    results: finalResults
  };
}

module.exports = { detectInfringement };
