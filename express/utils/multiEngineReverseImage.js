// express/utils/multiEngineReverseImage.js

const fs = require('fs');
const path = require('path');
const puppeteerExtra = require('./puppeteerExtra');  // 取用我們的 puppeteerExtra
const { ensureDir } = require('./screenshotUtil');

/**
 * doMultiReverseImage
 * 同時以 Bing / TinEye / Baidu 三引擎做反向搜尋（direct），回傳外部連結的陣列
 * @param {string} imagePath - 本地圖片路徑
 * @param {string|number} fileId - 用於命名截圖
 * @returns {Promise<string[]>} 回傳搜尋到的所有外部連結
 */
async function doMultiReverseImage(imagePath, fileId) {
  if(!imagePath || !fs.existsSync(imagePath)){
    console.warn('[doMultiReverseImage] file not found =>', imagePath);
    return [];
  }

  // 在同一個 browser 中開多個 page 並行
  const browser = await puppeteerExtra.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-popup-blocking'
    ]
  });

  async function searchBing() {
    let page;
    let foundLinks = [];
    try {
      page = await browser.newPage();
      await page.goto('https://www.bing.com/images', { waitUntil:'domcontentloaded', timeout:30000 });
      // Bing "相機"按鈕
      await page.waitForSelector('#sb_sbi', { timeout:10000 });
      await page.click('#sb_sbi');
      // 上傳 input
      const fileInput = await page.waitForSelector('input[type=file]', { timeout:8000 });
      await fileInput.uploadFile(imagePath);
      // 等待結果
      await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 }).catch(()=>{});
      await page.waitForTimeout(3000);

      let links = await page.$$eval('a', as => as.map(a=>a.href));
      foundLinks = links.filter(l => l && !l.includes('bing.com'));
      if(!foundLinks.length){
        await page.screenshot({ path: `uploads/bing_search_${fileId}_noresult.png` }).catch(()=>{});
        console.warn('[Bing] no external links found');
      }
    } catch(e){
      console.error('[Bing error]', e);
    } finally {
      if(page) await page.close().catch(()=>{});
    }
    return foundLinks;
  }

  async function searchTinEye() {
    let page;
    let foundLinks = [];
    try {
      page = await browser.newPage();
      await page.goto('https://tineye.com/', { waitUntil:'domcontentloaded', timeout:30000 });
      const fileInput = await page.waitForSelector('input[type=file][name="image"]', { timeout:8000 });
      await fileInput.uploadFile(imagePath);
      await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 }).catch(()=>{});
      await page.waitForTimeout(3000);

      let links = await page.$$eval('a', as => as.map(a=>a.href));
      foundLinks = links.filter(l => l && !l.includes('tineye.com'));
      if(!foundLinks.length){
        await page.screenshot({ path:`uploads/tineye_search_${fileId}_noresult.png` }).catch(()=>{});
        console.warn('[TinEye] no external links found');
      }
    } catch(e){
      console.error('[TinEye error]', e);
    } finally {
      if(page) await page.close().catch(()=>{});
    }
    return foundLinks;
  }

  async function searchBaidu() {
    let page;
    let foundLinks = [];
    try {
      page = await browser.newPage();
      // 強制桌面UA，避免行動版
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/112');
      await page.goto('https://graph.baidu.com/', { waitUntil:'domcontentloaded', timeout:30000 });
      // 上傳
      const fileInput = await page.waitForSelector('input[type=file]', { timeout:8000 });
      await fileInput.uploadFile(imagePath);
      await page.waitForTimeout(5000);

      let links = await page.$$eval('a', as => as.map(a=>a.href));
      foundLinks = links.filter(l => l && !l.includes('baidu.com'));
      if(!foundLinks.length){
        await page.screenshot({ path:`uploads/baidu_search_${fileId}_noresult.png` }).catch(()=>{});
        console.warn('[Baidu] no external links found');
      }
    } catch(e){
      console.error('[Baidu error]', e);
    } finally {
      if(page) await page.close().catch(()=>{});
    }
    return foundLinks;
  }

  let allLinks = [];
  try {
    const [bingLinks, tineyeLinks, baiduLinks] = await Promise.all([
      searchBing(), searchTinEye(), searchBaidu()
    ]);
    allLinks = [...bingLinks, ...tineyeLinks, ...baiduLinks];
    console.log(`[doMultiReverseImage] total found => ${allLinks.length}`);
  } catch(e){
    console.error('[doMultiReverseImage] parallel error =>', e);
  } finally {
    await browser.close();
  }

  return allLinks;
}

module.exports = { doMultiReverseImage };
