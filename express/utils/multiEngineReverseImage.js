/**
 * express/utils/multiEngineReverseImage.js
 * 
 * 執行多引擎圖搜 (Bing/TinEye/Baidu)，回傳所有連結
 * 若無結果，則截圖保存並回傳空陣列
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function doMultiReverseImage(imagePath, fileId) {
  // 檔案檢查
  if(!imagePath || !fs.existsSync(imagePath)) {
    console.warn('[doMultiReverseImage] file not found =>', imagePath);
    return [];
  }

  const browser = await puppeteer.launch({
    headless:true,
    args:['--no-sandbox','--disable-setuid-sandbox']
  });

  async function searchBing() {
    const page = await browser.newPage();
    try {
      await page.goto('https://www.bing.com/images', { waitUntil:'domcontentloaded' });
      // 點擊「以圖搜圖」
      await page.waitForSelector('#sb_sbi', { timeout:8000 });
      await page.click('#sb_sbi');

      // 上傳
      const fileInput = await page.waitForSelector('input[type=file]', { timeout:8000 });
      await fileInput.uploadFile(imagePath);

      // 等待載入
      await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:10000 }).catch(()=>{});
      await page.waitForTimeout(3000);

      let links = await page.$$eval('a', as => as.map(a=>a.href));
      links = links.filter(l => l && !l.includes('bing.com'));
      if(!links.length) {
        await page.screenshot({ path: `bing_search_${fileId}.png` });
        console.warn('[Bing] no external links found.');
      }
      return links;
    } catch(err) {
      console.error('[Bing error]', err);
      try {
        await page.screenshot({ path:`bing_search_${fileId}_error.png` });
      } catch(e){}
      return [];
    } finally {
      await page.close();
    }
  }

  async function searchTinEye() {
    const page = await browser.newPage();
    try {
      await page.goto('https://tineye.com/', { waitUntil:'domcontentloaded' });
      const fileInput = await page.waitForSelector('input[name="image"]', { timeout:5000 });
      await fileInput.uploadFile(imagePath);

      await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:10000 });
      await page.waitForTimeout(3000);

      let links = await page.$$eval('a', as => as.map(a=>a.href));
      links = links.filter(l => l && !l.includes('tineye.com'));
      if(!links.length) {
        await page.screenshot({ path:`tineye_search_${fileId}.png` });
        console.warn('[TinEye] no external links found.');
      }
      return links;
    } catch(err) {
      console.error('[TinEye error]', err);
      try {
        await page.screenshot({ path:`tineye_search_${fileId}_error.png` });
      } catch(e){}
      return [];
    } finally {
      await page.close();
    }
  }

  async function searchBaidu() {
    const page = await browser.newPage();
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/100');
      await page.goto('https://graph.baidu.com/', { waitUntil:'domcontentloaded' });

      // 上傳
      const fileInput = await page.waitForSelector('input[type="file"]', { timeout:5000 });
      await fileInput.uploadFile(imagePath);

      // 結果同頁動態載入 => 等 5 秒
      await page.waitForTimeout(5000);

      let links = await page.$$eval('a', as => as.map(a=>a.href));
      links = links.filter(l => l && !l.includes('baidu.com'));
      if(!links.length) {
        await page.screenshot({ path:`baidu_search_${fileId}.png` });
        console.warn('[Baidu] no external links found.');
      }
      return links;
    } catch(err) {
      console.error('[Baidu error]', err);
      try {
        await page.screenshot({ path:`baidu_search_${fileId}_error.png` });
      } catch(e){}
      return [];
    } finally {
      await page.close();
    }
  }

  // 同時執行三引擎
  let [bingLinks, tineyeLinks, baiduLinks] = [[], [], []];
  try {
    [bingLinks, tineyeLinks, baiduLinks] = await Promise.all([
      searchBing(), searchTinEye(), searchBaidu()
    ]);
  } catch(e) {
    console.error('[doMultiReverseImage] parallel error =>', e);
  }

  await browser.close();
  const foundLinks = [...bingLinks, ...tineyeLinks, ...baiduLinks];
  console.log(`[doMultiReverseImage] found ${foundLinks.length} links from 3 engines.`);
  return foundLinks;
}

module.exports = { doMultiReverseImage };
