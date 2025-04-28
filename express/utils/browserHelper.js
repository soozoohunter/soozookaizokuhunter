// express/utils/browserHelper.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// 使用 Stealth Plugin，降低被反爬蟲偵測
puppeteer.use(StealthPlugin());

/**
 * 統一啟動 Puppeteer（加上 Stealth）
 * 若您在 Docker 中無法 headful, 可保持 headless:true
 */
async function launchBrowser() {
  // 可透過環境變數控制:  docker run -e PPTR_HEADLESS=false ...
  const HEADLESS = process.env.PPTR_HEADLESS === 'false' ? false : true;
  console.log('[browserHelper] Launching Puppeteer... headless=', HEADLESS);

  return await puppeteer.launch({
    headless: HEADLESS ? 'new' : false,  // puppeteer v19+ 可用 'new'
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-blink-features=AutomationControlled'
    ],
    defaultViewport: { width:1280, height:800 }
  });
}

module.exports = { launchBrowser };
