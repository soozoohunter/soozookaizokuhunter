/**
 * express/utils/multiEngineReverseImage.js
 *
 * 統一只保留 Bing / TinEye / Baidu
 * - 透過 ginifab 聚合頁面，點擊跳轉 popup
 * - 每個 popup 只截搜尋結果區域 (不帶搜尋引擎 UI/Logo)
 * - 上傳 IPFS + 區塊鏈 (如有需要)
 * - 回傳 "Possible match => URL" 陣列
 */
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

const fs = require('fs');
const path = require('path');

// 這行路徑不動：ipfsService 位於 ../services/ipfsService.js
const ipfsService = require('../services/ipfsService');

// 這行改為 './chain' => 因為 chain.js 與本檔在同一資料夾 (express/utils/)
const chain = require('./chain');

/**
 * 執行多引擎圖片反查 (經由 ginifab)
 * @param {string} imagePath - 本地圖片檔案的絕對路徑
 * @param {string|number} fileId - 用於命名截圖/上傳區分的ID (DB的 File ID)
 * @returns {Promise<string[]>} - 回傳所有可能連結 (以 "Possible match => URL" 形式)
 */
async function doMultiReverseImage(imagePath, fileId) {
  console.log('[multiEngineReverseImage] Start => imagePath=', imagePath);
  const foundLinks = [];
  let browser;

  try {
    // 1) 檢查檔案是否存在
    if(!imagePath || !fs.existsSync(imagePath)) {
      console.warn('[doMultiReverseImage] imagePath not exist =>', imagePath);
      return foundLinks;
    }

    // 2) 啟動 Puppeteer (Stealth模式)
    browser = await puppeteerExtra.launch({
      headless: true,
      defaultViewport: { width: 1280, height: 800 },
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    console.log('Puppeteer launched...');

    // 3) 前往 ginifab 搜圖聚合頁
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'networkidle2'
    });

    // 4) 上傳圖片 => ginifab
    const fileInputSelector = '#fileInput';
    await page.waitForSelector(fileInputSelector, { timeout:20000 });
    const fileInput = await page.$(fileInputSelector);
    if(!fileInput) {
      console.warn('[doMultiReverseImage] Cannot find file input on ginifab');
      return foundLinks; // 回傳空陣列
    }
    await fileInput.uploadFile(imagePath);
    // 等幾秒，讓 ginifab 生成預覽
    await page.waitForTimeout(3000);

    // 5) 只保留 Bing / TinEye / Baidu
    const engineConfigs = [
      { 
        name: 'Bing', 
        text: 'Bing', 
        resultSelector: '.layoutWrap'        // Bing 結果列表區 (ginifab彈窗內)
      },
      { 
        name: 'TinEye', 
        text: 'TinEye', 
        resultSelector: '.results'           // TinEye 結果列表
      },
      { 
        name: 'Baidu', 
        text: 'Baidu', 
        // Baidu 可能是 graph.baidu.com, 這裡先抓常見容器
        resultSelector: '.card-list, .soutu-section, #layout'
      }
    ];

    // 6) 逐一處理三大引擎
    for (const engine of engineConfigs) {
      try {
        console.log(`--- [${engine.name}] ---`);
        // 在 ginifab 上找到該引擎按鈕
        const [linkEl] = await page.$x(`//a[contains(text(),"${engine.text}")]`);
        if(!linkEl) {
          console.warn(`[${engine.name}] Link not found on ginifab`);
          foundLinks.push(`Possible match => (No link for ${engine.name})`);
          continue;
        }

        // 監聽「popup」事件 => 新分頁/彈窗
        const popupPromise = page.waitForEvent('popup');
        await linkEl.click();
        const popup = await popupPromise;

        // 等待頁面載入
        await popup.waitForTimeout(5000);

        // 隱藏搜尋引擎 UI (popup)
        try {
          await popup.addStyleTag({
            content: `
              header, nav, .header, #header, .logo, #logo,
              [id*="top"], [class*="top"], [class*="navbar"],
              [class*="searchbox"], .branding, #branding,
              .soutu-interface, .soutu-operate, .soutu-intro,
              .card-header, .header-bar, .header-wrapper {
                visibility: hidden !important;
                display: none !important;
              }
            `
          });
        } catch(hideErr) {
          console.warn(`[${engine.name}] hide brand fail =>`, hideErr.message);
        }

        // 截圖「結果區域」
        let screenshotPath = null;
        const regionHandle = await popup.$(engine.resultSelector);
        if(regionHandle) {
          screenshotPath = path.join(__dirname, `../../uploads/searchResult_${fileId}_${engine.name}_${Date.now()}.png`);
          await regionHandle.screenshot({ path: screenshotPath });
        } else {
          console.warn(`[${engine.name}] resultSelector not found => ${engine.resultSelector}`);
          // 若沒找到指定區域，改截整頁
          screenshotPath = path.join(__dirname, `../../uploads/searchResult_${fileId}_${engine.name}_full_${Date.now()}.png`);
          await popup.screenshot({ path: screenshotPath, fullPage:true });
        }

        // 若需要上傳 IPFS / 區塊鏈
        if(screenshotPath && fs.existsSync(screenshotPath)) {
          let ipfsHash = null;
          let txHash = null;
          try {
            ipfsHash = await ipfsService.saveFile(screenshotPath);
            console.log(`[${engine.name}] IPFS Hash =>`, ipfsHash);
          } catch(eIPFS) {
            console.error(`[${engine.name}] IPFS fail =>`, eIPFS);
          }
          if(ipfsHash) {
            try {
              const chainRec = await chain.storeRecord(ipfsHash);
              txHash = chainRec?.transactionHash || null;
              console.log(`[${engine.name}] chain txHash =>`, txHash);
            } catch(eChain) {
              console.error(`[${engine.name}] chain fail =>`, eChain);
            }
          }
        }

        // 解析所有 <a> => "Possible match => link"
        const pageLinks = await popup.$$eval('a', (as) =>
          as.map(a=>a.href).filter(h=> h && !h.includes('javascript'))
        );
        for(const link of pageLinks) {
          foundLinks.push(`Possible match => ${link}`);
        }

        // 關閉 popup
        await popup.close();
        // 回到主頁
        await page.bringToFront();
        // 等 2秒 => 避免過快操作
        await page.waitForTimeout(2000);

      } catch(engineErr) {
        console.error(`[doMultiReverseImage] [${engine.name}] =>`, engineErr);
        foundLinks.push(`Possible match => (Error on ${engine.name})`);
      }
    }

  } catch(err) {
    console.error('[doMultiReverseImage error]', err);
  } finally {
    if(browser) {
      await browser.close().catch(()=>{});
    }
  }

  console.log(`[multiEngineReverseImage] done => found ${foundLinks.length} links`);
  return foundLinks;
}

module.exports = { doMultiReverseImage };
