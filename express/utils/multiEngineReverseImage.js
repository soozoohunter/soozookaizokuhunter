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
 *  - 透過「Ginifab 以圖搜圖」網站，先上傳圖片，再依序點選 Bing / Yandex / TinEye / Baidu (略過 Google)
 *  - 對每個跳轉後的 popup 分頁做截圖 => 上傳 IPFS => 區塊鏈存紀錄
 *  - 回傳所有 popup 網址陣列 foundLinks (可視需求加以調整)
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
    // 1) 進到 Ginifab 站點
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', { waitUntil:'networkidle2' });

    // 2) 上傳圖片
    const fileInputSelector = '#fileInput';
    await page.waitForSelector(fileInputSelector, { timeout:10000 });
    const fileInput = await page.$(fileInputSelector);
    await fileInput.uploadFile(imagePath);
    // 等待網站處理
    await page.waitForTimeout(3000);

    // ==============  
    // Ginifab 站上有幾個搜尋引擎按鈕 (Google, Bing, Yandex, TinEye, Baidu...)  
    // 我們只點 Bing, Yandex, TinEye, Baidu，**跳過 Google**。
    // 下列 selector 以該網站的實際 DOM 為準，如發生變動，請自行以瀏覽器檢查器修正
    // ==============

    // 3) 定義要點擊的引擎連結 (Selector 與引擎名稱)
    //   - 依目前 ginifab 頁面實測，有可能是 <a> 文字包含"Bing" / "Yandex" / "TinEye" / "百度" / "Baidu"
    //   - 或者查它的 data-engine, class name... 請視實際網頁結構調整
    const engineLinks = [
      { name: 'Bing',   textIncludes: 'Bing'    },
      { name: 'Yandex', textIncludes: 'Yandex'  },
      { name: 'TinEye', textIncludes: 'TinEye'  },
      { name: 'Baidu',  textIncludes: 'Baidu'   },
    ];

    // 4) 依序點擊引擎 → popup → 截圖 → IPFS → 區塊鏈
    for (const engine of engineLinks) {
      const linkHandle = await page.$x(`//a[contains(text(),"${engine.textIncludes}")]`);
      if (linkHandle && linkHandle.length > 0) {
        // 等待 popup
        const [popupPromise] = await Promise.all([
          page.waitForEvent('popup'), 
          linkHandle[0].click()  // 點擊該引擎連結
        ]);

        // 取得 popup Page
        const popupPage = await popupPromise;
        const popupUrl = popupPage.url();
        console.log(`[Ginifab] ${engine.name} => opened popup: ${popupUrl}`);

        // 等待頁面載入、搜索結果出現
        // (每個引擎不同，這裡給個大約 5-6 秒等待即可，或自行加強判斷)
        await popupPage.waitForTimeout(5000);

        // 截圖 => IPFS => 區塊鏈
        const screenshotPath = path.join(__dirname, `../../uploads/result_${fileId}_${engine.name}_${Date.now()}.png`);
        await popupPage.screenshot({ path: screenshotPath, fullPage:true });
        
        // 上傳 IPFS
        const ipfsHash = await ipfsService.saveFile(screenshotPath);
        // 區塊鏈存紀錄
        const receipt = await chain.storeRecord(ipfsHash);
        const txHash = receipt?.transactionHash || null;

        console.log(`[captureScreenshot] => ${engine.name}, IPFS=${ipfsHash}, tx=${txHash||'(None)'}`);

        // 收集回傳 (可隨需求改更詳細資料)
        foundLinks.push(`${engine.name} => ${popupUrl}`);

        // 關閉該 popup 分頁
        await popupPage.close();
        // 回到 ginifab 主頁，再繼續下一個引擎
        await page.bringToFront();
      } else {
        console.warn(`[Ginifab] Cannot find link for engine: ${engine.name}`);
      }
      // 小等一下再進行下一輪
      await page.waitForTimeout(2000);
    }

    // 全部執行完
  } catch (err) {
    console.error('[doMultiReverseImage error]', err);
  } finally {
    if (browser) await browser.close();
  }
  return foundLinks;
}

module.exports = { doMultiReverseImage };
