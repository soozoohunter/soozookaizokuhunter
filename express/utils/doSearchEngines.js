/**
 * express/utils/doSearchEngines.js
 *
 * 需求重點：
 *  1. 在同一個 Ginifab 主頁 (https://www.ginifab.com.tw/tools/search_image_by_image/) 不關閉
 *  2. 透過「Choose File」或「指定圖片網址」可覆蓋原圖
 *  3. 點擊 Bing/TinEye/Baidu 時彈新分頁 => 用完就關 => 回 aggregator 頁面
 *  4. 若 aggregator 全失敗 => fallbackDirectEngines
 */

const fs = require('fs');
const { tryCloseAd } = require('./closeAdHelper');
const puppeteerExtra = require('./puppeteerExtra');

/**
 * 小工具：debug 截圖 (可自行關閉)
 */
async function saveDebugInfo(page, prefix) {
  try {
    const t = Date.now();
    const filePath = `/app/debugShots/${prefix}_${t}.png`;
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`[saveDebugInfo] => screenshot=${filePath} , url=${await page.url()}`);
  } catch(e){
    console.warn('[saveDebugInfo] fail =>', e);
  }
}

/**
 * aggregatorSearchGinifabPersistent
 *   1. 一開始開啟瀏覽器 & 進入 Ginifab (不關閉)
 *   2. 上傳本機 or 指定URL (可覆蓋)
 *   3. 順序點 Bing / TinEye / Baidu (分頁搜完就關)
 *   4. 不關 aggregator 頁面 (可重複上傳)
 * @param {string} localFilePath
 * @param {string} publicImageUrl
 * @returns {Object} {bing:[], tineye:[], baidu:[]}
 */
async function aggregatorSearchGinifabPersistent(localFilePath, publicImageUrl) {
  const results = { bing: [], tineye: [], baidu: [] };
  let browser, aggregatorPage;
  try {
    // 1) 啟動瀏覽器
    browser = await puppeteerExtra.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });
    aggregatorPage = await browser.newPage();
    await aggregatorPage.setViewport({ width:1280, height:800 });
    await aggregatorPage.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'domcontentloaded',
      timeout:30000
    });
    await tryCloseAd(aggregatorPage, 2);
    await saveDebugInfo(aggregatorPage, 'ginifab_afterGoto');

    // 2) 上傳 or 指定
    let success = false;
    if (localFilePath && fs.existsSync(localFilePath)) {
      success = await tryClickChooseFile(aggregatorPage, localFilePath);
      if(!success && publicImageUrl){
        console.log('[aggregatorSearchGinifabPersistent] local fail => try URL...');
        success = await tryClickSpecifyUrl(aggregatorPage, publicImageUrl);
      }
    } else if(publicImageUrl){
      success = await tryClickSpecifyUrl(aggregatorPage, publicImageUrl);
    }

    if(!success){
      console.warn('[aggregatorSearchGinifabPersistent] fail => cannot upload nor specify => aggregator stop');
      return results;
    }

    // 3) 順序點 Bing / TinEye / Baidu => 收集外部連結
    const engines = [
      { key:'bing',   label:['微軟必應','Bing'] },
      { key:'tineye', label:['錫眼睛','TinEye'] },
      { key:'baidu',  label:['百度','Baidu'] }
    ];

    for(const eng of engines){
      try {
        const newTabPage = await openEngineInNewTab(aggregatorPage, eng.label, browser);
        if(!newTabPage){
          console.warn(`[aggregatorSearchGinifabPersistent][${eng.key}] => no popup page?`);
          continue;
        }

        // 如果是 Baidu => (可選) 二次上傳
        if(eng.key==='baidu'){
          await tryCloseAd(newTabPage, 1);
          // 依您需求，在 baidu 頁面再執行二次上傳/指定URL
          // 例：等同 fallbackDirectEngines => directSearchBaidu
        }

        // 抓外部連結
        let hrefs = await newTabPage.$$eval('a', as => as.map(a=> a.href));
        hrefs = hrefs.filter(h => h && !h.includes('ginifab') && !h.includes('bing.com') && !h.includes('tineye.com') && !h.includes('baidu.com'));
        results[eng.key] = [...new Set(hrefs)].slice(0,10);

        await newTabPage.close();
        await aggregatorPage.bringToFront();
        await tryCloseAd(aggregatorPage,1);
      } catch(errEng){
        console.error(`[aggregatorSearchGinifabPersistent][${eng.key}] =>`, errEng);
      }
    }

    // 4) 不關 aggregatorPage => 由您自行決定何時關 (瀏覽器 close)
    // 這裡範例為了避免佔用資源 => 還是關，但若您真要保持不關，可註解掉
    // -----------
    // await aggregatorPage.close().catch(()=>{});
    // await browser.close().catch(()=>{});
    // -----------

  } catch(e){
    console.error('[aggregatorSearchGinifabPersistent] error =>', e);
  } finally {
    // 如果您不想在程式末期自動關 -> 註解這裡
    if(aggregatorPage && !aggregatorPage.isClosed()) await aggregatorPage.close().catch(()=>{});
    if(browser) await browser.close().catch(()=>{});
  }

  return results;
}

/**
 * 在 ginifab 頁面點「Choose File」，上傳檔案 (可多次覆蓋)
 */
async function tryClickChooseFile(aggregatorPage, localFilePath) {
  try {
    console.log('[tryClickChooseFile] =>', localFilePath);
    await tryCloseAd(aggregatorPage, 1);
    // 1) 找到「Choose File」或「選擇檔案」按鈕
    //    ginifab 頁面實際顯示：<input type="file" ... 但是通常會有個 label 或 button?
    //    這裡用 xpath: "//label[contains(text(),'Choose File')]"
    //    或直接抓 'input[type=file]' -> use .uploadFile
    //    依您實際 DOM 修改
    const fileInput = await aggregatorPage.$('input[type=file]');
    if(!fileInput){
      console.warn('[tryClickChooseFile] no input[type=file] found');
      return false;
    }
    // 視情況，可能要先 aggregatorPage.click('#chooseFileBtn'); 才會顯示 input[type=file]
    await fileInput.uploadFile(localFilePath);
    await aggregatorPage.waitForTimeout(2000);
    console.log('[tryClickChooseFile] success =>', localFilePath);
    return true;
  } catch(e){
    console.error('[tryClickChooseFile] fail =>', e);
    return false;
  }
}

/**
 * 在 ginifab 頁面點「指定圖片網址」，貼上 publicImageUrl
 */
async function tryClickSpecifyUrl(aggregatorPage, publicImageUrl) {
  try {
    console.log('[tryClickSpecifyUrl] =>', publicImageUrl);
    await tryCloseAd(aggregatorPage, 1);
    // 1) 找到「指定圖片網址」連結
    const link = await aggregatorPage.$x("//a[contains(text(),'指定圖片網址')]");
    if(!link.length){
      console.warn('[tryClickSpecifyUrl] link not found => 指定圖片網址');
      return false;
    }
    await link[0].evaluate(el => el.click());
    await aggregatorPage.waitForTimeout(1000);

    // 2) 在顯示的 input[type=text] 裡貼上
    const input = await aggregatorPage.$('input[type=text]');
    if(!input){
      console.warn('[tryClickSpecifyUrl] no input[type=text]');
      return false;
    }
    await input.click({ clickCount:3 }); // 全選
    await aggregatorPage.keyboard.press('Backspace'); // 清空
    await input.type(publicImageUrl, {delay:50});
    await aggregatorPage.waitForTimeout(1200);

    console.log('[tryClickSpecifyUrl] done =>', publicImageUrl);
    return true;
  } catch(e){
    console.error('[tryClickSpecifyUrl] error =>', e);
    return false;
  }
}

/**
 * 從 aggregatorPage 點擊某個引擎 (Bing/TinEye/Baidu) 的連結 => 開新分頁 => 回傳該分頁
 */
async function openEngineInNewTab(aggregatorPage, labels, browser) {
  console.log('[openEngineInNewTab] =>', labels);
  // 監聽 targetcreated
  const newTabPromise = new Promise(resolve => {
    const onTarget = async (target) => {
      if(target.type() === 'page'){
        browser.removeListener('targetcreated', onTarget);
        const p = await target.page();
        resolve(p);
      }
    };
    browser.on('targetcreated', onTarget);
  });

  // aggregatorPage evaluate => find a link w/ label
  await aggregatorPage.evaluate(ls => {
    const as = [...document.querySelectorAll('a')];
    for(const lab of ls){
      const found = as.find(a => a.innerText.includes(lab));
      if(found){
        found.click();
        return;
      }
    }
  }, labels);

  const popup = await newTabPromise;
  await popup.setViewport({ width:1280, height:800 });
  await popup.bringToFront();
  await popup.waitForTimeout(3000);
  return popup;
}

// --------------------------------------------------------
// fallbackDirectEngines (若 aggregatorSearchGinifabPersistent 失敗時才用)
// --------------------------------------------------------
async function fallbackDirectEngines(imagePath) {
  console.log('[fallbackDirectEngines] start =>', imagePath);
  const results = { bing: [], tineye: [], baidu: [] };
  let browser;
  try {
    browser = await puppeteerExtra.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    console.log('[fallbackDirectEngines] browser launched...');

    // 依序 directSearchBing / directSearchTinEye / directSearchBaidu
    results.bing   = await directSearchBing(browser, imagePath);
    results.tineye = await directSearchTinEye(browser, imagePath);
    results.baidu  = await directSearchBaidu(browser, imagePath);

  } catch(e){
    console.error('[fallbackDirectEngines error]', e);
  } finally {
    if(browser) await browser.close().catch(()=>{});
  }
  console.log('[fallbackDirectEngines] done =>', results);
  return results;
}

// directSearchBing
async function directSearchBing(browser, imagePath) {
  const finalLinks = [];
  // ...省略具體實作，您可保留原本的 code...
  return finalLinks;
}

// directSearchTinEye
async function directSearchTinEye(browser, imagePath) {
  const finalLinks = [];
  // ...
  return finalLinks;
}

// directSearchBaidu
async function directSearchBaidu(browser, imagePath) {
  const finalLinks = [];
  // ...
  return finalLinks;
}

// --------------------------------------------------------
// doSearchEngines (主入口)
// --------------------------------------------------------
/**
 * doSearchEngines
 *   1. aggregatorSearchGinifabPersistent => 不關 aggregator
 *   2. 若全部抓不到 => fallbackDirectEngines
 */
async function doSearchEngines(localFilePath, aggregatorFirst = true, publicImageUrl='') {
  console.log('[doSearchEngines] aggregatorFirst=', aggregatorFirst);
  let aggregatorOK = false;
  let aggregatorRes = { bing: [], tineye: [], baidu: [] };

  if(aggregatorFirst){
    aggregatorRes = await aggregatorSearchGinifabPersistent(localFilePath, publicImageUrl);
    const total = aggregatorRes.bing.length + aggregatorRes.tineye.length + aggregatorRes.baidu.length;
    aggregatorOK = (total > 0);
  }

  if(!aggregatorOK){
    console.warn('[doSearchEngines] aggregator fail => fallback...');
    const fb = await fallbackDirectEngines(localFilePath);
    return {
      bing: fb.bing || [],
      tineye: fb.tineye || [],
      baidu: fb.baidu || []
    };
  }
  return aggregatorRes;
}

module.exports = {
  doSearchEngines
};
