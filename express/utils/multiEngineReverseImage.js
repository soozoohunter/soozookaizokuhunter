/**
 * express/utils/multiEngineReverseImage.js
 *
 * 統一只保留 Bing / TinEye / Baidu
 * 透過 ginifab 聚合頁面，自動：
 *   1) 上傳本地圖片
 *   2) 逐一點擊引擎連結 => 彈窗
 *   3) 等待彈窗載入後擷取結果(並隱藏搜尋介面 UI)
 *   4) 截圖存檔、上傳 IPFS + 區塊鏈(可選)
 *   5) 擷取所有 <a> 連結 => 回傳
 * 並會額外輸出 debug 截圖與 DOM HTML，方便檢查「到底載入了什麼畫面」。
 */
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

const fs = require('fs');
const path = require('path');

// IPFS 與 chain 路徑不動
const ipfsService = require('../services/ipfsService');
// chain 若在同資料夾 => './chain'
const chain = require('./chain');

// 你也可以透過環境變數指定 Chrome 執行檔
// e.g. PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
const PUPPETEER_EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || null;

/**
 * 執行多引擎圖片反查
 * @param {string} imagePath - 本地圖片檔案絕對路徑
 * @param {string|number} fileId - 用於命名截圖/上傳區分的ID
 * @returns {Promise<string[]>}
 */
async function doMultiReverseImage(imagePath, fileId) {
  console.log('[multiEngineReverseImage] Start => imagePath=', imagePath);
  const foundLinks = [];
  let browser;

  // 準備一個 debug 輸出目錄
  const debugDir = path.join(__dirname, '../../uploads', `debug_ginifab_${fileId}`);
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }

  try {
    // 1) 檢查檔案是否存在
    if (!imagePath || !fs.existsSync(imagePath)) {
      console.warn('[doMultiReverseImage] imagePath not exist =>', imagePath);
      return foundLinks;
    }

    // 2) 啟動 Puppeteer
    browser = await puppeteerExtra.launch({
      headless: true, // 你可嘗試 'new' / false
      executablePath: PUPPETEER_EXECUTABLE_PATH || undefined,
      defaultViewport: { width: 1280, height: 900 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    const page = await browser.newPage();
    // 方便某些情況下避免被偵測，可自訂 UA
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    );
    console.log('[Puppeteer] launched.');

    // 3) 前往 ginifab 搜圖聚合頁
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil: 'networkidle2'
    });
    // 截圖 => debug_mainpage.png
    const debugMain = path.join(debugDir, `debug_mainpage.png`);
    await page.screenshot({ path: debugMain, fullPage: true });

    // 4) 上傳圖片 => ginifab
    const fileInputSelector = '#fileInput';
    await page.waitForSelector(fileInputSelector, { timeout: 15000 });
    const fileInput = await page.$(fileInputSelector);
    if (!fileInput) {
      console.warn('[doMultiReverseImage] Cannot find file input on ginifab');
      // 順便截圖
      const noInputScreenshot = path.join(debugDir, `debug_noFileInput.png`);
      await page.screenshot({ path: noInputScreenshot, fullPage: true });
      return foundLinks;
    }
    await fileInput.uploadFile(imagePath);

    // 等 3 秒 讓 ginifab 做預覽
    await page.waitForTimeout(3000);

    // 再截圖 => debug_afterUpload.png
    const debugAfterUpload = path.join(debugDir, `debug_afterUpload.png`);
    await page.screenshot({ path: debugAfterUpload, fullPage: true });

    // 5) 三大引擎
    const engineConfigs = [
      {
        name: 'Bing',
        text: 'Bing',
        resultSelector: '.layoutWrap'
      },
      {
        name: 'TinEye',
        text: 'TinEye',
        resultSelector: '.results'
      },
      {
        name: 'Baidu',
        text: 'Baidu',
        resultSelector: '.card-list, .soutu-section, #layout'
      }
    ];

    for (const engine of engineConfigs) {
      try {
        console.log(`--- [${engine.name}] ---`);

        // 在 ginifab 頁面上找到對應引擎按鈕
        const [linkEl] = await page.$x(`//a[contains(text(),"${engine.text}")]`);
        if (!linkEl) {
          console.warn(`[${engine.name}] link not found => skip`);
          foundLinks.push(`Possible match => (No link for ${engine.name})`);
          continue;
        }

        // 監聽 popup
        const [popupPage] = await Promise.all([
          page.waitForEvent('popup'),
          linkEl.click()
        ]);

        // 等待彈窗載入完成
        // 若引擎載入很慢，可適度調大 timeout
        await popupPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
          .catch(err => {
            console.warn(`[${engine.name}] popup navigation error =>`, err.message);
          });

        // 此時截圖 => debug_popup_${engine.name}.png
        const popupScreenshot = path.join(debugDir, `debug_popup_${engine.name}.png`);
        await popupPage.screenshot({ path: popupScreenshot, fullPage: true });

        // 也把 HTML 存成檔案 => debug_html_${engine.name}.txt
        const pageHTML = await popupPage.content();
        fs.writeFileSync(
          path.join(debugDir, `debug_html_${engine.name}.txt`),
          pageHTML,
          'utf-8'
        );

        // 隱藏搜尋引擎 UI
        try {
          await popupPage.addStyleTag({
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
        } catch (hideErr) {
          console.warn(`[${engine.name}] hide UI fail =>`, hideErr.message);
        }

        // 等一下下讓畫面重繪
        await popupPage.waitForTimeout(1000);

        // 取得結果區域
        let screenshotPath = '';
        const regionHandle = await popupPage.$(engine.resultSelector);
        if (regionHandle) {
          // 截取指定區域
          screenshotPath = path.join(debugDir, `searchResult_${fileId}_${engine.name}.png`);
          await regionHandle.screenshot({ path: screenshotPath });
        } else {
          // 截整頁
          console.warn(`[${engine.name}] resultSelector not found => ${engine.resultSelector}`);
          screenshotPath = path.join(debugDir, `searchResult_${fileId}_${engine.name}_full.png`);
          await popupPage.screenshot({ path: screenshotPath, fullPage: true });
        }

        // 若有截圖檔 => 上傳 IPFS & 區塊鏈
        if (fs.existsSync(screenshotPath)) {
          let ipfsHash = null;
          try {
            ipfsHash = await ipfsService.saveFile(screenshotPath);
            console.log(`[${engine.name}] IPFS =>`, ipfsHash);
          } catch (eIPFS) {
            console.error(`[${engine.name}] IPFS error =>`, eIPFS);
          }
          if (ipfsHash) {
            try {
              const chainRec = await chain.storeRecord(ipfsHash);
              const txHash = chainRec?.transactionHash || null;
              console.log(`[${engine.name}] chain =>`, txHash);
            } catch (eChain) {
              console.error(`[${engine.name}] chain error =>`, eChain);
            }
          }
        }

        // 解析所有 <a> => "Possible match => link"
        const pageLinks = await popupPage.$$eval('a', (as) =>
          as.map(a => a.href).filter(h => h && !h.includes('javascript'))
        );

        for (const link of pageLinks) {
          foundLinks.push(`Possible match => ${link}`);
        }

        // 關閉彈窗
        await popupPage.close();
        // 回到主頁
        await page.bringToFront();
        await page.waitForTimeout(500);

      } catch (errEngine) {
        console.error(`[doMultiReverseImage] [${engine.name}] =>`, errEngine);
        foundLinks.push(`Possible match => (Error on ${engine.name})`);
      }
    }

  } catch (err) {
    console.error('[doMultiReverseImage error]', err);
  } finally {
    // 關閉瀏覽器
    if (browser) {
      await browser.close().catch(() => { });
    }
  }

  console.log(`[multiEngineReverseImage] done => found ${foundLinks.length} links`);

  return foundLinks;
}

module.exports = { doMultiReverseImage };
