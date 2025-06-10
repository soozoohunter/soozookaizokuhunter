// File: express/services/ginifabEngine.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');
const path = require('path');

const ENGINE_MAX_LINKS = parseInt(process.env.ENGINE_MAX_LINKS, 10) || 50;

// ============== fallback 直連 Bing/TinEye/Baidu ==============
async function fallbackDirectEngines(imagePath) {
  const results = {
    bing: [],
    tineye: [],
    baidu: []
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Bing
    try {
      const page = await browser.newPage();
      await page.goto('https://www.bing.com/images', {
        waitUntil:'domcontentloaded', timeout:20000
      });
      // 有時 Bing 頁面是 #sb_sbi ，有時是 input[type=file]，需自行嘗試
      const fileInput = await page.$('input[type=file]');
      if (fileInput) {
        await fileInput.uploadFile(imagePath);
        await page.waitForTimeout(5000);

        let links = await page.$$eval('a', as=> as.map(a=> a.href));
        links = links.filter(x=> x && !x.includes('bing.com'));
        results.bing.push(...links.slice(0, ENGINE_MAX_LINKS));
      }
      await page.close();
    } catch(e) {
      console.error('[fallback Bing error]', e);
    }

    // TinEye
    try {
      const page = await browser.newPage();
      await page.goto('https://tineye.com/', {
        waitUntil:'domcontentloaded', timeout:20000
      });
      const fileInput = await page.$('input[type=file]');
      if (fileInput) {
        await fileInput.uploadFile(imagePath);
        await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
        await page.waitForTimeout(3000);

        let links = await page.$$eval('a', as=> as.map(a=> a.href));
        links = links.filter(x=> x && !x.includes('tineye.com'));
        results.tineye.push(...links.slice(0, ENGINE_MAX_LINKS));
      }
      await page.close();
    } catch(e) {
      console.error('[fallback TinEye error]', e);
    }

    // Baidu
    try {
      const page = await browser.newPage();
      await page.goto('https://graph.baidu.com/', {
        waitUntil:'domcontentloaded', timeout:20000
      });
      const fileInput = await page.$('input[type=file]');
      if (fileInput) {
        await fileInput.uploadFile(imagePath);
        await page.waitForTimeout(5000);

        let links = await page.$$eval('a', as=> as.map(a=> a.href));
        links = links.filter(x=> x && !x.includes('baidu.com'));
        results.baidu.push(...links.slice(0, ENGINE_MAX_LINKS));
      }
      await page.close();
    } catch(e) {
      console.error('[fallback Baidu error]', e);
    }

  } catch(eAll){
    console.error('[fallbackDirectEngines error]', eAll);
  } finally {
    if(browser) await browser.close().catch(()=>{});
  }

  // 去重
  results.bing   = [...new Set(results.bing)];
  results.tineye = [...new Set(results.tineye)];
  results.baidu  = [...new Set(results.baidu)];
  return results;
}


// =============================
// Ginifab aggregator
// =============================

async function tryUploadLocalImage(page, localFilePath) {
  // 先嘗試點「上傳本機圖片」的連結
  await page.evaluate(()=>{
    const link = [...document.querySelectorAll('a')]
      .find(a => a.innerText.includes('上傳本機圖片') || a.innerText.includes('上傳本機') || a.innerText.includes('上傳照片'));
    if(link) link.click();
  });
  await page.waitForTimeout(2000);

  // 拿到 input[type="file"] → 上傳
  const fileInput = await page.$('input[type=file]');
  if(!fileInput) {
    console.warn('[tryUploadLocalImage] file input not found');
    return false;
  }
  await fileInput.uploadFile(localFilePath);
  await page.waitForTimeout(3000);

  // 等待網頁顯示預覽(可能再加檢查)
  return true;
}

async function tryUseImageUrl(page, aggregatorImageUrl) {
  // 點「指定圖片網址」
  await page.evaluate(()=>{
    const link = [...document.querySelectorAll('a')].find(a => a.innerText.includes('指定圖片網址'));
    if(link) link.click();
  });
  await page.waitForSelector('input[type="text"]', { timeout:8000 });
  // 輸入 URL
  await page.type('input[type="text"]', aggregatorImageUrl, { delay:50 });
  await page.waitForTimeout(1500);
  return true;
}

/**
 * 在 Baidu 新分頁內，再次上傳或輸入 URL
 * （Ginifab aggregator 對 Baidu 很可能只是單純開一個 "graph.baidu.com" 或 "image.baidu.com"）
 */
async function tryUploadOrUrlOnBaiduPopup(popup, localFilePath, aggregatorImageUrl) {
  try {
    // 1) 檢查 "graph.baidu.com" 頁面中是否有 input[type=file]
    const fileInput = await popup.$('input[type=file]');
    if(fileInput) {
      console.log('[Baidu Popup] found input[type=file], uploading local file...');
      await fileInput.uploadFile(localFilePath);
      await popup.waitForTimeout(5000);
      return true;
    }

    // 2) 若沒有 fileInput，可能要點「上傳圖片」按鈕後才出現？
    //    或者嘗試輸入 aggregatorImageUrl (若有)
    if(aggregatorImageUrl) {
      // 例如: 在 Baidu 圖搜欄位輸入 URL
      // 可能需要找特定 selector #kw / input[name="word"] ...
      // 這裡僅示範:
      await popup.evaluate((url)=>{
        const el = document.querySelector('input[type=text]');
        if(el) el.value = url;
      }, aggregatorImageUrl);
      await popup.waitForTimeout(2000);
      // 可能還要點一下 搜尋按鈕
      // ...
      return true;
    }
  } catch(e) {
    console.warn('[tryUploadOrUrlOnBaiduPopup] fail =>', e);
  }
  return false;
}

/**
 * aggregatorSearchGinifab
 * @param {string} localFilePath - 本地圖片檔
 * @param {string} aggregatorImageUrl - 如果要用「指定圖片網址」則傳此參數
 * @returns {Promise<{bing:{links:string[]}, tineye:{links:string[]}, baidu:{links:string[]}}>}
 */
async function aggregatorSearchGinifab(localFilePath, aggregatorImageUrl) {
  console.log('[aggregatorSearchGinifab] => localFilePath=', localFilePath, ' aggregatorImageUrl=', aggregatorImageUrl);

  const result = {
    bing:   { links: [] },
    tineye: { links: [] },
    baidu:  { links: [] }
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });
    const page = await browser.newPage();
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'domcontentloaded',
      timeout:30000
    });
    await page.waitForTimeout(2000);

    let uploaded = false;
    if (aggregatorImageUrl) {
      // 用「指定圖片網址」
      uploaded = await tryUseImageUrl(page, aggregatorImageUrl);
    } else {
      // 上傳本機檔
      uploaded = await tryUploadLocalImage(page, localFilePath);
    }
    if(!uploaded) {
      console.warn('[aggregatorSearchGinifab] upload fail => throw error');
      throw new Error('GiniFabUploadFail');
    }
    console.log('[aggregatorSearchGinifab] upload success => Next: click aggregator links...');

    // 等待三秒 讓 Ginifab 預覽成功
    await page.waitForTimeout(3000);

    // 順序點 Bing / TinEye / Baidu
    const engines = [
      { key: 'bing',   labels: ['微軟必應','Bing'] },
      { key: 'tineye', labels: ['錫眼睛','TinEye'] },
      { key: 'baidu',  labels: ['百度','Baidu'] }
    ];

    for(const eng of engines){
      try {
        // 監聽新頁籤
        const newTab = new Promise(resolve => {
          browser.once('targetcreated', async t => {
            const p = await t.page();
            resolve(p);
          });
        });

        // 點擊對應連結
        await page.evaluate((labels)=>{
          const as = [...document.querySelectorAll('a')];
          for (let lab of labels) {
            const found = as.find(a => a.innerText.includes(lab));
            if(found) { found.click(); return; }
          }
        }, eng.labels);

        const popup = await newTab;
        await popup.waitForTimeout(4000);

        // 若是 Baidu => 二次上傳
        if (eng.key === 'baidu') {
          console.log('[aggregatorSearchGinifab] Baidu => try re-upload or url...');
          await tryUploadOrUrlOnBaiduPopup(popup, localFilePath, aggregatorImageUrl);
          // 等個數秒讓畫面刷新
          await popup.waitForTimeout(5000);
        }

        // 擷取該 popup 頁面上的連結
        let hrefs = await popup.$$eval('a', as => as.map(a=>a.href));
        // 過濾掉 aggregator / 自家 domain
        hrefs = hrefs.filter(link=>{
          if(!link) return false;
          if(link.includes('ginifab')) return false;
          if(eng.key==='bing' && link.includes('bing.com')) return false;
          if(eng.key==='tineye' && link.includes('tineye.com')) return false;
          if(eng.key==='baidu' && link.includes('baidu.com')) return false;
          return true;
        });
        // 只取前 5
        result[eng.key].links = hrefs.slice(0, ENGINE_MAX_LINKS);

        await popup.close().catch(()=>{});
      } catch(eEng){
        console.error(`[aggregatorSearchGinifab][${eng.key}] => error`, eEng);
      }
    }

  } catch(err) {
    console.error('[aggregatorSearchGinifab fail]', err);
    throw err;
  } finally {
    if(browser) await browser.close().catch(()=>{});
  }

  return {
    bing:   { links: [...new Set(result.bing.links)] },
    tineye: { links: [...new Set(result.tineye.links)] },
    baidu:  { links: [...new Set(result.baidu.links)] }
  };
}


// 匯出
module.exports = {
  fallbackDirectEngines,
  aggregatorSearchGinifab
};
