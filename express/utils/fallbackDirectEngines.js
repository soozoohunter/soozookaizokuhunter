/**
 * fallbackDirectEngines.js
 * 
 * 若 aggregator 失敗 => 後端再自行開 Bing / TinEye / Baidu 進行「本機上傳」。
 */

async function directSearchBing(browser, imagePath) {
  // ...
  // [簡化範例] => 等同您原先對 Bing 直接上傳檔案的流程
  // ...
}

async function directSearchTinEye(browser, imagePath) {
  // ...
}

async function directSearchBaidu(browser, imagePath) {
  // ...
}

async function fallbackDirectEngines(imagePath) {
  const ret = { bing:[], tineye:[], baidu:[] };
  let browser;
  try {
    // 開啟
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });

    // 並行
    const [rBing, rTine, rBaidu] = await Promise.all([
      directSearchBing(browser, imagePath),
      directSearchTinEye(browser, imagePath),
      directSearchBaidu(browser, imagePath)
    ]);

    ret.bing   = [...new Set(rBing)];
    ret.tineye = [...new Set(rTine)];
    ret.baidu  = [...new Set(rBaidu)];

  } catch (e) {
    console.error('[fallbackDirectEngines] error =>', e);
  } finally {
    if (browser) await browser.close().catch(()=>{});
  }
  return ret;
}

module.exports = { fallbackDirectEngines };
