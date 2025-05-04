// ========== 以下直接覆蓋 doSearchEngines.js 或對應檔案 ==========

const path = require('path');
const fs = require('fs');
// puppeteer 你已經在其他地方 require 了。
// 若需要 StealthPlugin, 請確保有 use
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { tryCloseAd } = require('./closeAdHelper');  // <-- 從第1步新增的檔案匯入
// 假設 fallbackDirectEngines 還是一樣

/**
 * aggregatorSearchGinifabStrict
 *  1. 前往 https://www.ginifab.com.tw/tools/search_image_by_image/
 *  2. 關閉可能的廣告
 *  3. 上傳本機 or 指定圖片網址
 *  4. 順序點擊 Bing/TinEye/Baidu (每個會開新 tab)
 *  5. 回到 ginifab 主頁後, 再次關閉廣告
 *  6. 整理三個引擎 popup 取得的連結
 */
async function aggregatorSearchGinifabStrict(localFilePath = '', publicImageUrl = '') {
  console.log('[aggregatorSearchGinifabStrict] => file=', localFilePath, ' url=', publicImageUrl);

  const results = {
    bing: [],
    tineye: [],
    baidu: []
  };

  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: true, 
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');

    // 前往 Ginifab
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    // 嘗試關閉廣告
    await tryCloseAd(page, 2);

    // 上傳 or 指定圖片網址 (簡化示例)
    let ok = false;
    if (localFilePath) {
      ok = await tryClickUploadLocal(page, localFilePath);
      if (!ok && publicImageUrl) {
        console.log('[aggregatorSearchGinifabStrict] local upload fail => try specify URL...');
        ok = await tryClickSpecifyImageUrl(page, publicImageUrl);
      }
    } else if (publicImageUrl) {
      ok = await tryClickSpecifyImageUrl(page, publicImageUrl);
    }

    if (!ok) {
      console.warn('[aggregatorSearchGinifabStrict] local+URL both fail => return empty');
      return results;
    }

    // 成功上傳/指定後 => 順序點 Bing / TinEye / Baidu
    const engines = [
      { key:'bing',   label:['Bing','微軟必應'] },
      { key:'tineye', label:['TinEye','錫眼睛'] },
      { key:'baidu',  label:['Baidu','百度'] },
    ];

    for (const eng of engines) {
      try {
        console.log(`[aggregatorSearchGinifabStrict] click => ${eng.key}`);
        // 等待新分頁
        const newTab = new Promise(resolve => {
          browser.once('targetcreated', async t => {
            const p = await t.page();
            resolve(p);
          });
        });

        // 在 ginifab 主頁面上找對應文字鏈結
        await page.evaluate(labels => {
          const as = [...document.querySelectorAll('a')];
          for(const lab of labels){
            const found = as.find(x => x.innerText.includes(lab));
            if(found){
              found.click();
              return;
            }
          }
        }, eng.label);

        const popup = await newTab;
        await popup.bringToFront();
        await popup.setViewport({ width:1280, height:800 });
        await popup.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
        await popup.waitForTimeout(3000);

        // 若是百度 => 再次嘗試關廣告、檔案上傳 (若需要)
        if(eng.key === 'baidu') {
          await tryCloseAd(popup, 2);
          // ...這邊可做二次上傳 if 介面需要
        }

        // 抓取 popup 裡不含 ginifab/bing/tineye/baidu.com 的連結 (僅供示範)
        let hrefs = await popup.$$eval('a', as => as.map(a => a.href));
        hrefs = hrefs.filter(link =>
          link && !link.includes('ginifab') &&
          !link.includes('bing.com') &&
          !link.includes('tineye.com') &&
          !link.includes('baidu.com')
        );
        results[eng.key] = [...new Set(hrefs)].slice(0,8);

        // 關閉該分頁
        await popup.close();

        // 回到 ginifab 主頁面，再次關閉廣告
        await page.bringToFront();
        await tryCloseAd(page, 2);

      } catch(eSub) {
        console.error(`[aggregatorSearchGinifabStrict][${eng.key}] fail =>`, eSub);
      }
    }

  } catch(e) {
    console.error('[aggregatorSearchGinifabStrict] error =>', e);
  } finally {
    if(page) await page.close().catch(()=>{});
    if(browser) await browser.close().catch(()=>{});
  }

  return results;
}

/**
 * tryClickUploadLocal - 用戶實際操作「上傳本機圖片」流程
 * @param {object} page 
 * @param {string} localFilePath 
 * @returns {Promise<boolean>}
 */
async function tryClickUploadLocal(page, localFilePath){
  try {
    await tryCloseAd(page, 2);

    // 找到「上傳本機圖片」或「上傳照片」連結並點擊
    const link = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if(link.length > 0){
      await link[0].click();
      await page.waitForTimeout(1500);
    } else {
      console.warn('[tryClickUploadLocal] link not found => "上傳本機圖片"');
      return false;
    }

    // 找 input[type=file] 並上傳
    const fileInput = await page.$('input[type=file]');
    if(!fileInput){
      console.warn('[tryClickUploadLocal] input[type=file] not found');
      return false;
    }
    await fileInput.uploadFile(localFilePath);
    await page.waitForTimeout(2000);

    console.log('[tryClickUploadLocal] done =>', localFilePath);
    return true;
  } catch(err){
    console.error('[tryClickUploadLocal] error =>', err);
    return false;
  }
}

/**
 * tryClickSpecifyImageUrl - 用戶實際操作「指定圖片網址」
 * @param {object} page 
 * @param {string} publicImageUrl 
 * @returns {Promise<boolean>}
 */
async function tryClickSpecifyImageUrl(page, publicImageUrl){
  try {
    await tryCloseAd(page, 2);

    // 找到「指定圖片網址」的文字鏈結
    const link2 = await page.$x("//a[contains(text(),'指定圖片網址')]");
    if(link2.length > 0){
      await link2[0].click();
      await page.waitForTimeout(1000);
    } else {
      console.warn('[tryClickSpecifyImageUrl] link not found => 指定圖片網址');
      return false;
    }

    // 輸入框
    const input = await page.waitForSelector('input[type=text]', { timeout: 5000 });
    await input.type(publicImageUrl, { delay: 50 });
    await page.waitForTimeout(1000);

    console.log('[tryClickSpecifyImageUrl] done =>', publicImageUrl);
    return true;
  } catch(e) {
    console.error('[tryClickSpecifyImageUrl] error =>', e);
    return false;
  }
}

/**
 * doSearchEngines - 統一入口
 *   1. 先 aggregatorSearchGinifabStrict
 *   2. 若失敗 => fallbackDirectEngines
 */
async function doSearchEngines(localFilePath, aggregatorFirst=true, aggregatorImageUrl='') {
  console.log('[doSearchEngines] aggregatorFirst=', aggregatorFirst, ' aggregatorUrl=', aggregatorImageUrl);

  let aggregatorRes = {
    bing:[],
    tineye:[],
    baidu:[]
  };
  let aggregatorOK = false;

  if(aggregatorFirst){
    try {
      aggregatorRes = await aggregatorSearchGinifabStrict(localFilePath, aggregatorImageUrl);
      const total = aggregatorRes.bing.length + aggregatorRes.tineye.length + aggregatorRes.baidu.length;
      aggregatorOK = (total>0);
    } catch(eAgg){
      console.error('[doSearchEngines][aggregator] error =>', eAgg);
    }
  }

  if(!aggregatorOK){
    console.warn('[doSearchEngines] aggregator fail => fallbackDirectEngines...');
    const fb = await fallbackDirectEngines(localFilePath);
    return {
      bing:   fb.bing   || [],
      tineye: fb.tineye || [],
      baidu:  fb.baidu  || []
    };
  } else {
    return aggregatorRes;
  }
}

// Fallback 邏輯保持不動 (directSearchBing/TinEye/Baidu)
// 只要在 "打開頁面後" 也可以呼叫一次 tryCloseAd(popup,2) 看是否有廣告

module.exports = {
  doSearchEngines,
  aggregatorSearchGinifabStrict // 若別處也要呼叫，可一併匯出
};
