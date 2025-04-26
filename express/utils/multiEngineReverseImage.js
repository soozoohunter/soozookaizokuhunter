// express/utils/multiEngineReverseImage.js
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

const ipfsService = require('../services/ipfsService');
const chain = require('./chain');

const fs = require('fs');
const path = require('path');

/**
 * doMultiReverseImage(imagePath, fileId)
 *  - 前往 Ginifab => 上傳圖片 => 依序點擊 Bing, Yandex, TinEye, Baidu
 *  - 截圖 => IPFS => 區塊鏈 => 回傳 popup 網址
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

    const page = await browser.newPage();
    // 1) 打開 Ginifab 網站
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'networkidle2'
    });

    // 2) 上傳圖片
    const fileInputSelector = '#fileInput';
    await page.waitForSelector(fileInputSelector, { timeout:20000 });
    const fileInput = await page.$(fileInputSelector);
    if(!fileInput) {
      console.warn('[multiEngineReverseImage] cannot find #fileInput on ginifab');
      return foundLinks;
    }

    // 上傳檔案
    await fileInput.uploadFile(imagePath);
    await page.waitForTimeout(3000);

    // 3) 找到各搜尋引擎按鈕 => 依序點擊
    const engineLinks = [
      { name:'Bing',    text:'Bing' },
      { name:'Yandex',  text:'Yandex' },
      { name:'TinEye',  text:'TinEye' },
      { name:'Baidu',   text:'Baidu' },
    ];

    for(const engine of engineLinks) {
      // 用 XPath 找包含 engine.text 的 <a>
      const linkHandle = await page.$x(`//a[contains(text(),"${engine.text}")]`);
      if(linkHandle.length>0) {
        // 開新popup
        const [popupPromise] = await Promise.all([
          page.waitForEvent('popup'),
          linkHandle[0].click()
        ]);

        const popup = await popupPromise;
        const popupUrl = popup.url();
        console.log(`[Ginifab => ${engine.name}] popup => ${popupUrl}`);

        // 等待 5秒讓該分頁載入結果
        await popup.waitForTimeout(5000);

        // 截圖
        const screenshotPath = path.join(__dirname,
          `../../uploads/result_${fileId}_${engine.name}_${Date.now()}.png`);
        await popup.screenshot({ path: screenshotPath, fullPage:true });

        // 上傳 IPFS
        const ipfsHash = await ipfsService.saveFile(screenshotPath);
        // 區塊鏈存
        const receipt = await chain.storeRecord(ipfsHash);
        const txHash = receipt?.transactionHash || null;

        console.log(`[captureScreenshot] => ${engine.name}, IPFS=${ipfsHash}, tx=${txHash||'(None)'}`);

        // 收集
        foundLinks.push(`${engine.name} => ${popupUrl}`);

        // 關閉 popup
        await popup.close();
        await page.bringToFront();
      } else {
        console.warn(`[multiEngineReverseImage] no link for ${engine.name}`);
      }
      // 每個引擎之間等 2 秒
      await page.waitForTimeout(2000);
    }

  } catch (err) {
    console.error('[doMultiReverseImage error]', err);
  } finally {
    if(browser) await browser.close().catch(()=>{});
  }
  return foundLinks;
}

module.exports = { doMultiReverseImage };
