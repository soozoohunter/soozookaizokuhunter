// express/utils/multiEngineReverseImage.js
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

// 注意：這裡改成正確的相對路徑
// 假設 ipfsService.js 位於 express/services/ipfsService.js
// 假設 chain.js 位於   express/utils/chain.js
const ipfsService = require('../services/ipfsService');
const chain = require('./chain');

const fs = require('fs');
const path = require('path');

/**
 * doMultiReverseImage(imagePath, fileId)
 *  - 在同一個瀏覽器中依序執行 (Google, Bing, Yandex, Baidu, Ginifab)
 *  - 各抓前5筆結果 => 截圖 => 上傳 IPFS => 區塊鏈
 *  - 回傳所有結果 link 陣列 string[]
 */
async function doMultiReverseImage(imagePath, fileId) {
  const foundLinks = [];
  let browser;
  try {
    browser = await puppeteerExtra.launch({
      headless: true,
      defaultViewport: { width:1280, height:800 },
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });

    // 順序執行
    const googleLinks = await doGoogleImageSearch(browser, imagePath, fileId);
    foundLinks.push(...googleLinks);

    const bingLinks = await doBingImageSearch(browser, imagePath, fileId);
    foundLinks.push(...bingLinks);

    const yandexLinks = await doYandexImageSearch(browser, imagePath, fileId);
    foundLinks.push(...yandexLinks);

    const baiduLinks = await doBaiduImageSearch(browser, imagePath, fileId);
    foundLinks.push(...baiduLinks);

    const ginifabLinks = await doGinifabImageSearch(browser, imagePath, fileId);
    foundLinks.push(...ginifabLinks);

  } catch (err) {
    console.error('[doMultiReverseImage error]', err);
  } finally {
    if (browser) await browser.close();
  }
  return foundLinks;
}

// === 各搜尋引擎函式 ===

async function doGoogleImageSearch(browser, imagePath, fileId) {
  const result = [];
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://images.google.com/', { waitUntil:'networkidle2' });

    // 相機 icon
    await page.waitForSelector('div[jsname="Q4LuWd"] a.Q4LuWd', { timeout:8000 });
    await page.click('div[jsname="Q4LuWd"] a.Q4LuWd');

    // "Upload an image" tab
    const uploadTabSel = 'a[aria-label="Upload an image"]';
    await page.waitForSelector(uploadTabSel, { timeout:8000 });
    await page.click(uploadTabSel);

    // 檔案上傳
    const fileInputSel = 'input#qbfile';
    await page.waitForSelector(fileInputSel, { timeout:8000 });
    const fileInput = await page.$(fileInputSel);
    await fileInput.uploadFile(imagePath);

    await page.waitForTimeout(4000);

    // 抓前 5 筆
    const resSel = 'div.g a';
    await page.waitForSelector(resSel, { timeout:15000 });
    const links = await page.$$eval(resSel, arr => arr.slice(0,5).map(a=>a.href));

    for(const link of links) {
      result.push(link);
      await captureScreenshotAndChain(page, link, fileId);
    }
  } catch(e) {
    console.error('[doGoogleImageSearch]', e);
  } finally {
    if (page) await page.close().catch(()=>{});
  }
  return result;
}

async function doBingImageSearch(browser, imagePath, fileId) {
  const arr = [];
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://www.bing.com/images?FORM=SBIRDI', { waitUntil:'networkidle2' });

    const camSel = 'button[aria-label="Search using an image"]';
    await page.waitForSelector(camSel, { timeout:8000 });
    await page.click(camSel);

    const fileSel = 'input[type="file"][accept="image/*"]';
    const fileInput = await page.waitForSelector(fileSel, { visible:true, timeout:15000 });
    await fileInput.uploadFile(imagePath);

    await page.waitForTimeout(5000);

    // 前 5
    const itemHandles = await page.$$('li a.iusc');
    for (let i=0; i<Math.min(itemHandles.length,5); i++){
      const href = await itemHandles[i].evaluate(a=>a.href);
      arr.push(href);
      await captureScreenshotAndChain(page, href, fileId);
    }
  } catch(e){
    console.error('[doBingImageSearch]', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return arr;
}

async function doYandexImageSearch(browser, imagePath, fileId) {
  const arr = [];
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://yandex.com/images/', { waitUntil:'networkidle2' });

    // 相機
    await page.waitForSelector('button[data-testid="search-input__camera"]', { timeout:8000 });
    await page.click('button[data-testid="search-input__camera"]');

    const fileInput = await page.waitForSelector('input[type="file"]', { visible:true, timeout:10000 });
    await fileInput.uploadFile(imagePath);

    await page.waitForTimeout(5000);

    // 前 5
    const anchors = await page.$$('.CbirSites-Item a');
    for(let i=0; i<Math.min(anchors.length,5); i++){
      const link = await anchors[i].evaluate(a=>a.href);
      arr.push(link);
      await captureScreenshotAndChain(page, link, fileId);
    }
  } catch(e){
    console.error('[doYandexImageSearch]', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return arr;
}

async function doBaiduImageSearch(browser, imagePath, fileId) {
  const arr = [];
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://graph.baidu.com/pcpage/index?tpl_from=pc', { waitUntil:'networkidle2' });

    const upSel = 'div.upload-wrap input[type="file"]';
    const up = await page.waitForSelector(upSel, { timeout:8000 });
    await up.uploadFile(imagePath);

    await page.waitForTimeout(5000);

    const items = await page.$$('.result-list .result-item');
    for(let i=0; i<Math.min(items.length,5); i++){
      const href = await items[i].$eval('.result-title a', el=>el.href).catch(()=>null);
      if(href) {
        arr.push(href);
        await captureScreenshotAndChain(page, href, fileId);
      }
    }
  } catch(e){
    console.error('[doBaiduImageSearch]', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return arr;
}

async function doGinifabImageSearch(browser, imagePath, fileId) {
  const arr = [];
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', { waitUntil:'networkidle2' });

    const fileInput = await page.waitForSelector('#fileInput',{ timeout:10000 });
    await fileInput.uploadFile(imagePath);

    await page.waitForTimeout(3000);

    // 可能出現 "Search by TinEye" => popup
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.evaluate(()=>{
        const aList = Array.from(document.querySelectorAll('a'));
        const tinEyeLink = aList.find(a=> /tin\s*eye/i.test(a.textContent||''));
        if(tinEyeLink) tinEyeLink.click();
      })
    ]);
    await popup.waitForTimeout(3000);

    const anchors = await popup.$$('a.result--url');
    for(let i=0; i<Math.min(anchors.length,5); i++){
      const href = await anchors[i].evaluate(a=>a.href);
      arr.push(href);
      await captureScreenshotAndChain(popup, href, fileId);
    }
    if(!popup.isClosed()) await popup.close();
  } catch(e){
    console.error('[doGinifabImageSearch]', e);
  } finally {
    if(page && !page.isClosed()) await page.close().catch(()=>{});
  }
  return arr;
}

/**
 * 對每個搜尋結果連結 截圖 => 上傳 IPFS => 區塊鏈
 */
async function captureScreenshotAndChain(page, url, fileId) {
  try {
    await page.goto(url, { waitUntil:'networkidle2', timeout:15000 });
    const screenshotPath = path.join(__dirname, `../../uploads/result_${fileId}_${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage:true });

    // 上傳 IPFS
    const ipfsHash = await ipfsService.saveFile(screenshotPath);

    // 區塊鏈存紀錄
    const receipt = await chain.storeRecord(ipfsHash);
    const txHash = receipt?.transactionHash || null;
    console.log(`[captureScreenshot] => ${url}, IPFS=${ipfsHash}, tx=${txHash||'(None)'}`);
  } catch(e) {
    console.warn('[captureScreenshotAndChain error]', e);
  }
}

module.exports = { doMultiReverseImage };
