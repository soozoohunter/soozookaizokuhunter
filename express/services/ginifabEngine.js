const puppeteer = require('puppeteer');
const path = require('path');
const fs   = require('fs');

/**
 * @param {string} publicImageUrl - e.g. https://suzookaizokuhunter.com/uploads/xxx.jpg
 * @param {number} fileId - DB PK, optional for screenshot naming
 */
async function doGinifabEngine(publicImageUrl, fileId) {
  const result = { bingLinks: [], tineyeLinks: [], baiduLinks: [], screenshots: {} };
  let browser, mainPage;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox','--disable-popup-blocking']
    });
    mainPage = await browser.newPage();
    await mainPage.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', { waitUntil:'domcontentloaded' });
    // 切換到「指定圖片網址」模式
    await mainPage.waitForSelector('a', { timeout:5000 });
    await mainPage.evaluate(()=>{
      const link = [...document.querySelectorAll('a')]
        .find(a=>a.innerText.includes('指定圖片網址'));
      if(link) link.click();
    });
    // 輸入URL
    await mainPage.waitForSelector('input[type=text]', { timeout:5000 });
    await mainPage.type('input[type=text]', publicImageUrl, { delay:50 });
    // ... 依序點擊「必應」「錫眼睛」「百度」(略) ...

    // 取得 Bing / TinEye / Baidu links
    // same as 方案D ...
    // result.bingLinks = ...
    // result.tineyeLinks = ...
    // result.baiduLinks = ...

  } catch (err) {
    console.error('doGinifabEngine error:', err);
    // screenshot if needed
  } finally {
    if(browser) await browser.close();
  }
  return result;
}

module.exports = { doGinifabEngine };
