// express/utils/multiEngineReverseImage.js
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

const fs   = require('fs');
const path = require('path');

// 引入 IPFS + Chain 服務，用於截圖後上傳
const ipfsService = require('../../services/ipfsService');
const chain = require('../../utils/chain');

/**
 * doMultiReverseImage(imagePath, fileId)
 *  - 在同一個 browser 中依序執行 Google, Bing, Yandex, Baidu, Ginifab
 *  - 各取前 5 筆結果連結 => 合併回傳 string[] (URL清單)
 *  - 同時對每個 result link 截圖 => 上傳 IPFS => 區塊鏈記錄
 */
async function doMultiReverseImage(imagePath, fileId) {
  const foundLinks = [];
  let browser;
  try {
    // 啟動 puppeteer-extra + stealth
    browser = await puppeteerExtra.launch({
      headless: true,
      defaultViewport: { width:1280, height:800 },
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });

    // 順序執行（也可用 Promise.all）
    const google = await doGoogleImageSearch(browser, imagePath, fileId);
    foundLinks.push(...google);
    const bing = await doBingImageSearch(browser, imagePath, fileId);
    foundLinks.push(...bing);
    const yandex = await doYandexImageSearch(browser, imagePath, fileId);
    foundLinks.push(...yandex);
    const baidu = await doBaiduImageSearch(browser, imagePath, fileId);
    foundLinks.push(...baidu);
    const ginifab = await doGinifabImageSearch(browser, imagePath, fileId);
    foundLinks.push(...ginifab);

  } catch(err) {
    console.error('[doMultiReverseImage error]', err);
  } finally {
    if (browser) await browser.close();
  }
  return foundLinks;
}

//
// 以下每個函式會：
//  1) 打開分頁
//  2) 上傳 imagePath
//  3) 抓前5 result link
//  4) 對 link 做 captureScreenshotAndChain
//

async function doGoogleImageSearch(browser, imagePath, fileId) {
  const result = [];
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://images.google.com/', { waitUntil:'networkidle2' });

    // 相機icon
    await page.waitForSelector('div[jsname="Q4LuWd"] a.Q4LuWd',{ timeout:8000 });
    await page.click('div[jsname="Q4LuWd"] a.Q4LuWd');

    // "Upload an image" tab
    const upSel = 'a[aria-label="Upload an image"]';
    await page.waitForSelector(upSel,{ timeout:8000 });
    await page.click(upSel);

    // file input
    const fileSel = 'input#qbfile';
    await page.waitForSelector(fileSel,{ timeout:8000 });
    const fileInput = await page.$(fileSel);
    await fileInput.uploadFile(imagePath);

    await page.waitForTimeout(4000);

    // 前5連結
    const resSel = 'div.g a';
    await page.waitForSelector(resSel,{ timeout:15000 });
    const links = await page.$$eval(resSel, arr => arr.slice(0,5).map(a=>a.href));
    for (const link of links) {
      result.push(link);
      await captureScreenshotAndChain(page, link, fileId);
    }

  } catch(e){
    console.error('[doGoogleImageSearch]', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return result;
}

async function doBingImageSearch(browser, imagePath, fileId) {
  const result = [];
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://www.bing.com/images?FORM=SBIRDI',{ waitUntil:'networkidle2' });

    const camBtn = 'button[aria-label="Search using an image"]';
    await page.waitForSelector(camBtn,{ timeout:8000 });
    await page.click(camBtn);

    const fileSel = 'input[type="file"][accept="image/*"]';
    const fileInput = await page.waitForSelector(fileSel,{ visible:true, timeout:15000 });
    await fileInput.uploadFile(imagePath);

    await page.waitForTimeout(5000);

    // 前5
    const itemHandles = await page.$$('li a.iusc');
    for(let i=0; i<Math.min(itemHandles.length,5); i++){
      const href = await itemHandles[i].evaluate(a=>a.href);
      result.push(href);
      await captureScreenshotAndChain(page, href, fileId);
    }
  } catch(e){
    console.error('[doBingImageSearch]', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return result;
}

async function doYandexImageSearch(browser, imagePath, fileId) {
  const arr = [];
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://yandex.com/images/', { waitUntil:'networkidle2' });
    await page.waitForSelector('button[data-testid="search-input__camera"]',{ timeout:8000 });
    await page.click('button[data-testid="search-input__camera"]');

    const fileInput = await page.waitForSelector('input[type="file"]',{ visible:true, timeout:10000 });
    await fileInput.uploadFile(imagePath);

    await page.waitForTimeout(5000);

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

    const sel = 'div.upload-wrap input[type="file"]';
    const up = await page.waitForSelector(sel,{ timeout:8000 });
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
  const arr=[];
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', { waitUntil:'networkidle2' });

    const fileInput = await page.waitForSelector('#fileInput',{ timeout:10000 });
    await fileInput.uploadFile(imagePath);

    await page.waitForTimeout(3000);

    // 可能點擊 "Search by TinEye" => popup
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
    for(let i=0;i<Math.min(anchors.length,5); i++){
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
 * 截圖 => 上傳 IPFS => 區塊鏈
 */
async function captureScreenshotAndChain(page, url, fileId) {
  try {
    await page.goto(url, { waitUntil:'networkidle2', timeout:10000 });
    const screenshotPath = path.join(__dirname, `../../uploads/result_${fileId}_${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage:true });

    // 上傳 IPFS
    const ipfsHash = await ipfsService.saveFile(screenshotPath);
    // 區塊鏈
    const receipt = await chain.storeRecord(ipfsHash);
    const txHash = receipt?.transactionHash;
    console.log(`Screenshot => ${url}, IPFS=${ipfsHash}, txHash=${txHash||'(None)'}`);
  } catch(e) {
    console.warn('[captureScreenshotAndChain]', e);
  }
}

module.exports = { doMultiReverseImage };
