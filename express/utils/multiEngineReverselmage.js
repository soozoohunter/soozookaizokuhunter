// express/utils/multiEngineReverseImage.js
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

// 如需上傳IPFS + 區塊鏈截圖，可以引入services
// const ipfsService = require('../../services/ipfsService');
// const chain = require('../../utils/chain');
// const fs   = require('fs');
// const path = require('path');

/**
 * doMultiReverseImage(imagePath, fileId)
 *  - 在同一 browser 中依序執行 (Google, Bing, Yandex, Baidu, Ginifab)
 *  - 各搜尋擷取前5條 => 回傳 link[] (string陣列)
 *  - (可擴充對結果做 screenshot => IPFS => chain)
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
    const g = await doGoogleImageSearch(browser, imagePath, fileId);
    foundLinks.push(...g);
    const b = await doBingImageSearch(browser, imagePath, fileId);
    foundLinks.push(...b);
    const y = await doYandexImageSearch(browser, imagePath, fileId);
    foundLinks.push(...y);
    const d = await doBaiduImageSearch(browser, imagePath, fileId);
    foundLinks.push(...d);
    const gf= await doGinifabTinEyeSearch(browser, imagePath, fileId);
    foundLinks.push(...gf);

  } catch(err) {
    console.error('[doMultiReverseImage error]', err);
  } finally {
    if (browser) await browser.close();
  }
  return foundLinks;
}

async function doGoogleImageSearch(browser, imagePath, fileId) {
  const result = [];
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://images.google.com/', { waitUntil:'networkidle2' });

    // 相機icon
    await page.waitForSelector('div[jsname="Q4LuWd"] a.Q4LuWd',{ timeout:8000 });
    await page.click('div[jsname="Q4LuWd"] a.Q4LuWd');

    // Upload tab
    const uploadTab = 'a[aria-label="Upload an image"]';
    await page.waitForSelector(uploadTab,{ timeout:8000 });
    await page.click(uploadTab);

    // file input
    const fileSel = 'input#qbfile';
    await page.waitForSelector(fileSel,{ timeout:8000 });
    const input = await page.$(fileSel);
    await input.uploadFile(imagePath);

    await page.waitForTimeout(4000);

    const resSel = 'div.g a';
    await page.waitForSelector(resSel,{ timeout:15000 });
    const links = await page.$$eval(resSel, arr => arr.slice(0,5).map(a=>a.href));
    result.push(...links);

    // (可選) screenshot => IPFS => chain
    // for(const l of links) { await captureScreenshotAndChain(page, l, fileId); }

  } catch(e) {
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

    const camSel = 'button[aria-label="Search using an image"]';
    await page.waitForSelector(camSel,{ timeout:8000 });
    await page.click(camSel);

    const fileSel = 'input[type="file"][accept="image/*"]';
    const input = await page.waitForSelector(fileSel, { visible:true, timeout:15000 });
    await input.uploadFile(imagePath);

    await page.waitForTimeout(5000);

    const itemHandles = await page.$$('li a.iusc');
    for(let i=0; i<Math.min(itemHandles.length,5); i++){
      const href = await itemHandles[i].evaluate(a=>a.href);
      result.push(href);
      // await captureScreenshotAndChain(page, href, fileId);
    }
  } catch(e) {
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

    // 相機
    const camSel = 'button[data-testid="search-input__camera"]';
    await page.waitForSelector(camSel,{ timeout:8000 });
    await page.click(camSel);

    const fileInput = await page.waitForSelector('input[type="file"]', { visible:true, timeout:10000 });
    await fileInput.uploadFile(imagePath);

    await page.waitForTimeout(5000);

    const anchors = await page.$$('.CbirSites-Item a');
    for(let i=0; i<Math.min(anchors.length,5); i++){
      const link = await anchors[i].evaluate(a=>a.href);
      arr.push(link);
      // await captureScreenshotAndChain(page, link, fileId);
    }
  } catch(e) {
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
      if(href) arr.push(href);
      // await captureScreenshotAndChain(page, href, fileId);
    }
  } catch(e) {
    console.error('[doBaiduImageSearch]', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return arr;
}

async function doGinifabTinEyeSearch(browser, imagePath, fileId) {
  const arr = [];
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', { waitUntil:'networkidle2' });

    const fileInput = await page.waitForSelector('#fileInput',{ timeout:10000 });
    await fileInput.uploadFile(imagePath);

    await page.waitForTimeout(3000);

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.evaluate(() => {
        const aList = Array.from(document.querySelectorAll('a'));
        const tinEyeLink = aList.find(a=> /tin\s*eye/i.test(a.textContent||''));
        if (tinEyeLink) tinEyeLink.click();
      })
    ]);
    await popup.waitForTimeout(3000);

    const anchors = await popup.$$('a.result--url');
    for(let i=0; i<Math.min(anchors.length,5); i++){
      const href = await anchors[i].evaluate(a=>a.href);
      arr.push(href);
      // await captureScreenshotAndChain(popup, href, fileId);
    }
    if(!popup.isClosed()) await popup.close();
  } catch(e) {
    console.error('[doGinifabTinEyeSearch]', e);
  } finally {
    if(page && !page.isClosed()) await page.close().catch(()=>{});
  }
  return arr;
}

/**
 * (可選) 截圖 => IPFS => 區塊鏈
async function captureScreenshotAndChain(page, url, fileId) {
  try {
    await page.goto(url, { waitUntil:'networkidle2', timeout:10000 });
    const screenshotPath = path.join(__dirname, `../../uploads/result_${fileId}_${Date.now()}.png`);
    await page.screenshot({ path:screenshotPath, fullPage:true });

    const ipfsHash = await ipfsService.saveFile(screenshotPath);
    const receipt = await chain.storeRecord(ipfsHash);
    console.log(`Screenshot => ${url}, IPFS=${ipfsHash}, txHash=${receipt?.transactionHash||'(None)'}`);
  } catch(e) {
    console.warn('[captureScreenshotAndChain]', e);
  }
}
*/

module.exports = { doMultiReverseImage };
