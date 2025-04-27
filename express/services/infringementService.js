// express/services/infringementService.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// 四大爬蟲
const { searchGinifab } = require('./crawlers/ginifabCrawler');
const { searchBing } = require('./crawlers/bingCrawler');
const { searchTinEye } = require('./crawlers/tinEyeCrawler');
const { searchBaidu } = require('./crawlers/baiduCrawler');

// 可選: PDF 報告
const { generateSearchReport } = require('./pdf/pdfService');

/**
 * detectInfringement
 * @param {string} localFilePath 本機圖片路徑
 * @param {string} publicUrlForGinifab 若 ginifab 需要遠端網址(可為 Cloudinary 後的 https://xxx)
 * @returns {Object} result = { success:boolean, data: {...} }
 */
async function detectInfringement(localFilePath, publicUrlForGinifab) {
  // 簡易檢查
  if (!fs.existsSync(localFilePath)) {
    throw new Error('檔案不存在: ' + localFilePath);
  }

  const browser = await puppeteer.launch({
    headless:true,
    args:['--no-sandbox','--disable-setuid-sandbox']
  });

  // 預設使用 aggregator
  let aggregatorResults = null;
  try {
    aggregatorResults = await searchGinifab(browser, publicUrlForGinifab);
    // aggregatorResults: { bing:{success, links}, tineye:{...}, baidu:{...} }
  } catch (aggError) {
    console.warn('[infringementService] aggregator fail => fallback => direct engines', aggError);
  }

  let finalResults = [];
  if (aggregatorResults && (
    aggregatorResults.bing.success ||
    aggregatorResults.tineye.success ||
    aggregatorResults.baidu.success
  )) {
    // 有至少一個引擎成功 => aggregator route OK
    finalResults.push({
      engine:'bing',
      screenshotPath: aggregatorResults.bing.screenshot,
      links: aggregatorResults.bing.links
    });
    finalResults.push({
      engine:'tineye',
      screenshotPath: aggregatorResults.tineye.screenshot,
      links: aggregatorResults.tineye.links
    });
    finalResults.push({
      engine:'baidu',
      screenshotPath: aggregatorResults.baidu.screenshot,
      links: aggregatorResults.baidu.links
    });
  } else {
    // fallback 依序 direct
    const rBing = await searchBing(browser, localFilePath);
    const rTinEye = await searchTinEye(browser, localFilePath);
    const rBaidu = await searchBaidu(browser, localFilePath);
    finalResults.push({ engine:'bing', screenshotPath:rBing.screenshotPath, links:rBing.links });
    finalResults.push({ engine:'tineye', screenshotPath:rTinEye.screenshotPath, links:rTinEye.links });
    finalResults.push({ engine:'baidu', screenshotPath:rBaidu.screenshotPath, links:rBaidu.links });
  }

  await browser.close();

  // 產 PDF or 直接回傳
  // ★ 如果您不需要 PDF，可以省略
  const pdfPath = await generateSearchReport(finalResults);

  return {
    success:true,
    pdfPath,
    results: finalResults
  };
}

module.exports = { detectInfringement };
