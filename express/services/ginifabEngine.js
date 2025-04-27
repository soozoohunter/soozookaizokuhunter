// express/services/ginifabEngine.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs   = require('fs');

/**
 * 使用 Ginifab 網站，以「指定圖片網址」模式進行 Bing / TinEye / Baidu 反向搜尋。
 * @param {string} publicImageUrl - e.g. https://suzookaizokuhunter.com/uploads/xxx.jpg
 * @param {number} fileId - DB PK, optional for screenshot naming
 * @returns {Object} 包含各引擎連結陣列 & 截圖資訊
 */
async function doGinifabEngine(publicImageUrl, fileId) {
  const result = { bingLinks: [], tineyeLinks: [], baiduLinks: [], screenshots: {} };
  let browser, mainPage;
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

    // 進入 Ginifab 以圖搜圖主頁
    await mainPage.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil: 'domcontentloaded'
    });

    // 切換到「指定圖片網址」模式
    await mainPage.waitForSelector('a', { timeout: 5000 });
    await mainPage.evaluate(() => {
      const link = [...document.querySelectorAll('a')]
        .find(a => a.innerText.includes('指定圖片網址'));
      if (link) link.click();
    });

    // 輸入要搜尋的圖檔 URL
    await mainPage.waitForSelector('input[type=text]', { timeout:5000 });
    await mainPage.type('input[type=text]', publicImageUrl, { delay:50 });

    // 這裡可依序點擊「必應」「錫眼睛」「百度」按鈕，並抓取各分頁的結果
    // (若需整合 Bing/TinEye/Baidu連結，可參考 multiEngineReverseImage 之類似做法)
    // 例如:
    // result.bingLinks = [...];
    // result.tineyeLinks = [...];
    // result.baiduLinks = [...];

  } catch (err) {
    console.error('doGinifabEngine error:', err);
    // 可在此做錯誤截圖與儲存
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return result;
}

module.exports = { doGinifabEngine };
