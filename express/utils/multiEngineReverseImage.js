/**
 * express/utils/multiEngineReverseImage.js
 *
 * 統一只保留 Bing / TinEye / Baidu
 * - 透過 ginifab 聚合頁面
 * - 點擊對應引擎連結後，自動打開 popup，盡量等到結果載入
 * - 截圖結果部分(隱藏搜尋UI)
 * - 截圖可再上傳 IPFS + 區塊鏈
 * - 回傳 "Possible match => URL" 陣列
 */
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

const fs = require('fs');
const path = require('path');

// ipfsService 路徑維持不變
const ipfsService = require('../services/ipfsService');
// chain 換成同資料夾的 utils/chain.js (若在 utils/ 下)
const chain = require('./chain');

/**
 * 執行多引擎圖片反查 (經由 ginifab)
 * @param {string} imagePath - 本地圖片檔案的絕對路徑
 * @param {string|number} fileId - 用於命名截圖/上傳區分的ID (DB的 File ID)
 * @returns {Promise<string[]>} - 回傳所有可能連結 (字串陣列: "Possible match => URL")
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
    //    建議在 Docker 裝好 chromium，或用 headless: 'new'
    browser = await puppeteerExtra.launch({
      headless: 'new',
      defaultViewport: { width: 1280, height: 800 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
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
      return foundLinks; 
    }
    await fileInput.uploadFile(imagePath);
    // 等 5 秒，讓 ginifab 生成預覽
    await page.waitForTimeout(5000);

    // 5) 三大引擎
    const engineConfigs = [
      { 
        name: 'Bing', 
        text: 'Bing', 
        resultSelector: '.layoutWrap' // Bing 結果列表區
      },
      { 
        name: 'TinEye', 
        text: 'TinEye', 
        resultSelector: '.results' // TinEye 結果列表
      },
      { 
        name: 'Baidu', 
        text: 'Baidu',
        resultSelector: '.card-list, .soutu-section, #layout'
      }
    ];

    // 6) 逐一處理三大引擎
    for (const engine of engineConfigs) {
      try {
        console.log(`--- [${engine.name}] ---`);

        // 在 ginifab 主頁上找到該引擎按鈕
        const [linkEl] = await page.$x(`//a[contains(text(),"${engine.text}")]`);
        if(!linkEl) {
          console.warn(`[${engine.name}] Link not found on ginifab`);
          foundLinks.push(`Possible match => (No link for ${engine.name})`);
          continue;
        }

        // 開新 popup
        const [popupPromise] = await Promise.all([
          page.waitForEvent('popup'),
          linkEl.click()
        ]);
        const popup = await popupPromise;

        // 盡量等到頁面載入
        try {
          await popup.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        } catch(navErr) {
          console.warn(`[${engine.name}] popup navigation timeout =>`, navErr.message);
        }

        // 再多等幾秒
        await popup.waitForTimeout(5000);

        // 隱藏搜尋引擎 UI
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

        // 截圖
        let screenshotPath;
        const regionHandle = await popup.$(engine.resultSelector);
        if(regionHandle) {
          screenshotPath = path.join(__dirname, `../../uploads/searchResult_${fileId}_${engine.name}_${Date.now()}.png`);
          await regionHandle.screenshot({ path: screenshotPath });
        } else {
          console.warn(`[${engine.name}] resultSelector not found => ${engine.resultSelector}`);
          screenshotPath = path.join(__dirname, `../../uploads/searchResult_${fileId}_${engine.name}_full_${Date.now()}.png`);
          await popup.screenshot({ path: screenshotPath, fullPage:true });
        }

        // 上傳 IPFS / 區塊鏈 (可省略)
        if(screenshotPath && fs.existsSync(screenshotPath)) {
          let ipfsHash = null;
          try {
            ipfsHash = await ipfsService.saveFile(screenshotPath);
            console.log(`[${engine.name}] IPFS Hash =>`, ipfsHash);
          } catch(eIPFS) {
            console.error(`[${engine.name}] IPFS fail =>`, eIPFS);
          }
          if(ipfsHash) {
            try {
              const chainRec = await chain.storeRecord(ipfsHash);
              const txHash = chainRec?.transactionHash || null;
              console.log(`[${engine.name}] chain txHash =>`, txHash);
            } catch(eChain) {
              console.error(`[${engine.name}] chain fail =>`, eChain);
            }
          }
        }

        // 解析所有 <a> => "Possible match => link"
        // 排除 javascript: 的假連結
        const pageLinks = await popup.$$eval('a', (as) =>
          as.map(a => a.href).filter(h => h && !h.includes('javascript'))
        );
        for(const link of pageLinks) {
          foundLinks.push(`Possible match => ${link}`);
        }

        // 關閉 popup
        await popup.close();
        // 回到主頁
        await page.bringToFront();
        await page.waitForTimeout(2000);

      } catch(engineErr) {
        console.error(`[${engine.name}] =>`, engineErr);
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
