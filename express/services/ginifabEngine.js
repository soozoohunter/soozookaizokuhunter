// express/services/ginifabEngine.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs   = require('fs');

/**
 * 使用 Ginifab 網站，以「指定圖片網址」模式進行 Bing / TinEye / Baidu 反向搜尋。
 * 依序點擊三個按鈕，監聽新分頁(Target)，抓取外部連結注入到 result。
 *
 * 四大步驟 (4-Band)：
 *   [Band A] 打開 Ginifab 主頁 + 輸入圖片 URL
 *   [Band B] 點擊「微軟必應」=> 擷取 Bing links
 *   [Band C] 點擊「錫眼睛」=> 擷取 TinEye links
 *   [Band D] 點擊「百度」=> 擷取 Baidu links
 *
 * @param {string} publicImageUrl - 例如 https://mysite.com/uploads/xxx.jpg
 * @param {number} fileId - DB PK，可用於命名截圖檔
 * @returns {Object} { bingLinks:[], tineyeLinks:[], baiduLinks:[], screenshots:{} }
 */
async function doGinifabEngine(publicImageUrl, fileId) {
  const result = {
    bingLinks: [],
    tineyeLinks: [],
    baiduLinks: [],
    screenshots: {}
  };
  let browser = null, mainPage = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-popup-blocking'
      ]
    });
    mainPage = await browser.newPage();

    // ========== [Band A] 打開 Ginifab 主頁 + 輸入 URL ==========
    try {
      await mainPage.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
        waitUntil: 'domcontentloaded'
      });
      // 切換到「指定圖片網址」模式
      await mainPage.waitForSelector('a', { timeout:5000 });
      await mainPage.evaluate(() => {
        const link = [...document.querySelectorAll('a')]
          .find(a => a.innerText.includes('指定圖片網址'));
        if (link) link.click();
      });
      // 輸入圖片 URL
      await mainPage.waitForSelector('input[type=text]', { timeout: 5000 });
      await mainPage.type('input[type=text]', publicImageUrl, { delay:50 });
    } catch (errBandA) {
      console.error('[GinifabEngine][BandA] fail =>', errBandA);
      // 可做截圖
      const shotPath = path.join(__dirname, `../uploads/errors/ginifab_bandA_${fileId||'x'}_${Date.now()}.png`);
      await mainPage.screenshot({ path: shotPath }).catch(()=>{});
      result.screenshots.bandA = shotPath;
      throw errBandA;
    }

    // 依序點擊 3 個按鈕，取得連結
    // 通常 Ginifab 頁面上對應 "微軟必應"、"錫眼睛"、"百度" 三段文字
    // 每次點擊都會彈出新分頁 => 需監聽 targetcreated or waitForTarget

    // ========== [Band B] 點擊「微軟必應」==========
    try {
      const [bingPage] = await Promise.all([
        new Promise(resolve => {
          browser.once('targetcreated', t => resolve(t.page()));
        }),
        mainPage.evaluate(() => {
          // 在 Ginifab 找到內含「必應」字樣的 a 標籤
          const anchor = [...document.querySelectorAll('a')]
            .find(a => a.innerText.includes('必應'));
          if (anchor) anchor.click();
        })
      ]);
      await bingPage.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 });
      await bingPage.waitForTimeout(2000);

      // 蒐集連結
      let links = await bingPage.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'), a => a.href)
          .filter(href => !href.includes('ginifab.com') && !href.includes('bing.com'));
      });
      links = [...new Set(links)];
      result.bingLinks = links;

      if(!links.length) {
        // 若沒找到 => 截圖
        const shotPath = path.join(__dirname, `../uploads/errors/ginifab_bing_nores_${fileId||'x'}_${Date.now()}.png`);
        await bingPage.screenshot({ path: shotPath }).catch(()=>{});
        result.screenshots.bing = shotPath;
      }

      await bingPage.close();
    } catch (errBandB) {
      console.error('[GinifabEngine][BandB: Bing] fail =>', errBandB);
      const shotPath = path.join(__dirname, `../uploads/errors/ginifab_bing_error_${fileId||'x'}_${Date.now()}.png`);
      await mainPage.screenshot({ path: shotPath }).catch(()=>{});
      result.screenshots.bing = shotPath;
    }

    // ========== [Band C] 點擊「錫眼睛」==========
    try {
      const [tineyePage] = await Promise.all([
        new Promise(resolve => {
          browser.once('targetcreated', t => resolve(t.page()));
        }),
        mainPage.evaluate(() => {
          const anchor = [...document.querySelectorAll('a')]
            .find(a => a.innerText.includes('錫眼睛'));
          if (anchor) anchor.click();
        })
      ]);
      await tineyePage.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 });
      await tineyePage.waitForTimeout(2000);

      let links = await tineyePage.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'), a => a.href)
          .filter(href => !href.includes('tineye.com'));
      });
      links = [...new Set(links)];
      result.tineyeLinks = links;

      if(!links.length){
        const shotPath = path.join(__dirname, `../uploads/errors/ginifab_tineye_nores_${fileId||'x'}_${Date.now()}.png`);
        await tineyePage.screenshot({ path: shotPath }).catch(()=>{});
        result.screenshots.tineye = shotPath;
      }

      await tineyePage.close();
    } catch (errBandC) {
      console.error('[GinifabEngine][BandC: TinEye] fail =>', errBandC);
      const shotPath = path.join(__dirname, `../uploads/errors/ginifab_tineye_error_${fileId||'x'}_${Date.now()}.png`);
      await mainPage.screenshot({ path: shotPath }).catch(()=>{});
      result.screenshots.tineye = shotPath;
    }

    // ========== [Band D] 點擊「百度」==========
    try {
      const [baiduPage] = await Promise.all([
        new Promise(resolve => {
          browser.once('targetcreated', t => resolve(t.page()));
        }),
        mainPage.evaluate(() => {
          const anchor = [...document.querySelectorAll('a')]
            .find(a => a.innerText.includes('百度'));
          if (anchor) anchor.click();
        })
      ]);
      await baiduPage.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 });
      await baiduPage.waitForTimeout(2000);

      let links = await baiduPage.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'), a => a.href)
          .filter(href => !href.includes('baidu.com'));
      });
      links = [...new Set(links)];
      result.baiduLinks = links;

      if(!links.length){
        const shotPath = path.join(__dirname, `../uploads/errors/ginifab_baidu_nores_${fileId||'x'}_${Date.now()}.png`);
        await baiduPage.screenshot({ path: shotPath }).catch(()=>{});
        result.screenshots.baidu = shotPath;
      }

      await baiduPage.close();
    } catch (errBandD) {
      console.error('[GinifabEngine][BandD: Baidu] fail =>', errBandD);
      const shotPath = path.join(__dirname, `../uploads/errors/ginifab_baidu_error_${fileId||'x'}_${Date.now()}.png`);
      await mainPage.screenshot({ path: shotPath }).catch(()=>{});
      result.screenshots.baidu = shotPath;
    }

  } catch (err) {
    console.error('doGinifabEngine top-level error:', err);
    // 最上層錯誤截圖 (若尚未截圖)
    const shotPath = path.join(__dirname, `../uploads/errors/ginifab_error_${fileId||'x'}_${Date.now()}.png`);
    if (mainPage) {
      await mainPage.screenshot({ path: shotPath }).catch(()=>{});
      result.screenshots.all = shotPath;
    }
  } finally {
    if (browser) await browser.close();
  }

  return result;
}

module.exports = { doGinifabEngine };
