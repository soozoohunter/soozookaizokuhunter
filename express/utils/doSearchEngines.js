/**
 * File: express/utils/doSearchEngines.js
 *
 * 專門負責「圖搜」邏輯：一定從 Ginifab 進去 + Bing / TinEye / Baidu 三連搜，
 * 若失敗則進行 fallbackDirectEngines (直接打開 Bing / TinEye / Baidu 上傳)。
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

/**
 * [A] fallbackDirectEngines
 *  若 aggregatorSearchGinifab 全部失敗 -> 再逐一打開 Bing / TinEye / Baidu 嘗試上傳檔案。
 *
 *  此版本針對 Baidu 直接進 https://graph.baidu.com/
 *   - 强制 desktop user-agent, headless: 'new'
 *   - Bing: 等待相機按鈕 -> page.waitForFileChooser -> 上傳
 *   - TinEye: 直接有 input[type=file]
 *   - Baidu(graph.baidu): 直接有 input[type=file]
 */

async function fallbackDirectEngines(imagePath) {
  console.log('[fallbackDirectEngines] start =>', imagePath);
  const results = {
    bing: [],
    tineye: [],
    baidu: []
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    // --------------------------------------------------------------------------------
    // Bing
    // --------------------------------------------------------------------------------
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
      await page.goto('https://www.bing.com/images', {
        waitUntil:'domcontentloaded', timeout:30000
      });
      await page.waitForTimeout(3000);

      // 為了除錯，先截圖
      await saveDebugInfo(page, 'debug_bing_afterGoto');

      // 1) 找相機按鈕並點擊
      //    Bing 可能會有 .micsvc_lpicture, .ib_drop, .btnSe, or .ico_img... 
      //    這裡用嘗試做 waitForFileChooser
      try {
        const [fileChooser] = await Promise.all([
          page.waitForFileChooser({ timeout: 30000 }),
          // Bing 頁面常見 class => .micsvc_lpicture
          page.click('.micsvc_lpicture, #sbi_b'),
        ]);
        // 2) 上傳檔案
        await fileChooser.accept([ imagePath ]);
      } catch (bingWaitErr) {
        console.error('[directSearchBing] fail =>', bingWaitErr);
      }

      // 等待幾秒再收集連結
      await page.waitForTimeout(5000);
      let links = await page.$$eval('a', as => as.map(a => a.href));
      links = links.filter(l => l && !l.includes('bing.com'));
      results.bing = [...new Set(links)].slice(0, 8);

      await page.close();
    } catch(eBing) {
      console.error('[fallback Bing error]', eBing);
    }

    // --------------------------------------------------------------------------------
    // TinEye
    // --------------------------------------------------------------------------------
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
      await page.goto('https://tineye.com/', {
        waitUntil:'domcontentloaded', timeout:30000
      });
      await page.waitForTimeout(2000);

      await saveDebugInfo(page, 'debug_tineye_afterGoto');

      const fileInput = await page.$('input[type=file]');
      if (fileInput) {
        await fileInput.uploadFile(imagePath);
        // TinEye 會自動跳轉搜索
        await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 }).catch(()=>{});
        await page.waitForTimeout(3000);

        let links = await page.$$eval('a', as => as.map(a => a.href));
        links = links.filter(l => l && !l.includes('tineye.com'));
        results.tineye = [...new Set(links)].slice(0,8);
      }
      await page.close();
    } catch(eTine) {
      console.error('[fallback TinEye error]', eTine);
    }

    // --------------------------------------------------------------------------------
    // Baidu
    // --------------------------------------------------------------------------------
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
      await page.goto('https://graph.baidu.com/', {
        waitUntil:'domcontentloaded', timeout:30000
      });
      await page.waitForTimeout(3000);

      await saveDebugInfo(page, 'debug_baidu_afterGoto');

      // 找 input[type=file]
      const fInput = await page.$('input[type=file]');
      if (!fInput) {
        await saveDebugInfo(page, 'debug_baidu_error');
        throw new Error('Baidu input[type=file] not found');
      }
      await fInput.uploadFile(imagePath);
      await page.waitForTimeout(5000);

      let links = await page.$$eval('a', as => as.map(a => a.href));
      links = links.filter(l => l && !l.includes('baidu.com'));
      results.baidu = [...new Set(links)].slice(0,8);

      await page.close();
    } catch(eBaidu) {
      console.error('[fallback Baidu error]', eBaidu);
    }

  } catch(allErr) {
    console.error('[fallbackDirectEngines error]', allErr);
  } finally {
    if (browser) await browser.close().catch(()=>{});
  }

  console.log('[fallbackDirectEngines] done =>', results);
  return results;
}

/**
 * [B] aggregatorSearchGinifabStrict
 *  必須「先進入 https://www.ginifab.com.tw/tools/search_image_by_image/」
 *  → 上傳本機圖片 or 指定圖片網址
 *  → 依序點 Bing, TinEye, Baidu
 *  → Baidu 裡面要再手動「上傳/輸入 URL」才真正開始搜尋
 */
async function aggregatorSearchGinifabStrict(localFilePath='', publicImageUrl='') {
  console.log('[aggregatorSearchGinifabStrict] => file=', localFilePath, ' url=', publicImageUrl);
  if(!localFilePath && !publicImageUrl){
    throw new Error('No localFilePath or publicImageUrl provided');
  }

  const results = {
    bing: [],
    tineye: [],
    baidu: []
  };

  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');

    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(2000);

    // 1) 上傳本機 OR 指定圖片網址
    if(localFilePath){
      const success = await tryClickUploadLocal(page, localFilePath);
      if(!success){
        console.warn('[aggregatorSearchGinifabStrict] local upload fail => try URL fallback');
        if(publicImageUrl) {
          await tryClickSpecifyImageUrl(page, publicImageUrl);
        } else {
          throw new Error('Both local upload & publicImageUrl fail');
        }
      }
    } else if(publicImageUrl){
      // 只走 URL
      await tryClickSpecifyImageUrl(page, publicImageUrl);
    }
    await page.waitForTimeout(1500);

    // 2) 順序點 Bing → TinEye → Baidu
    const engines = [
      { key:'bing',   label:['微軟必應','Bing'] },
      { key:'tineye', label:['錫眼睛','TinEye'] },
      { key:'baidu',  label:['百度','Baidu'] }
    ];

    for (let eng of engines){
      try {
        console.log(`[aggregatorSearchGinifabStrict] clicking => ${eng.key}`);
        const newTab = new Promise(resolve => {
          browser.once('targetcreated', async t => resolve(await t.page()));
        });

        // 點擊
        await page.evaluate(labels => {
          const as = [...document.querySelectorAll('a')];
          for(const lab of labels){
            const found = as.find(x=> x.innerText.includes(lab));
            if(found){ found.click(); return; }
          }
        }, eng.label);

        const popup = await newTab; // 等待新 tab
        await popup.bringToFront();
        await popup.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
        await popup.waitForTimeout(3000);

        if(eng.key==='baidu'){
          // ★ 在 Baidu 頁面裡面，再做一次手動上傳 or 貼公開URL
          console.log('[aggregatorSearchGinifabStrict] Baidu => second upload step...');
          await tryBaiduUpload(popup, localFilePath, publicImageUrl);
        }

        // 取得連結(排除 ginifab/bing/tineye/baidu 自家域名)
        let hrefs = await popup.$$eval('a', as => as.map(a => a.href));
        hrefs = hrefs.filter(h =>
          h && !h.includes('ginifab') &&
          !h.includes('bing.com') &&
          !h.includes('tineye.com') &&
          !h.includes('baidu.com')
        );
        results[eng.key] = [...new Set(hrefs)].slice(0, 10);

        await popup.close();
      } catch(eSub){
        console.error(`[aggregatorSearchGinifabStrict][${eng.key}] fail =>`, eSub);
      }
    }
  } catch(e){
    console.error('[aggregatorSearchGinifabStrict] error =>', e);
    throw e;
  } finally {
    if(page) await page.close().catch(()=>{});
    if(browser) await browser.close().catch(()=>{});
  }
  return results;
}

/** 
 * 上傳本機圖片 flow 
 */
async function tryClickUploadLocal(page, localFilePath) {
  try {
    await page.waitForTimeout(1000);

    // 找「上傳本機圖片」 / "上傳照片" 文字鏈結
    await page.evaluate(() => {
      const link = [...document.querySelectorAll('a')]
        .find(a => /上傳(本機)?(圖片|照片)/.test(a.innerText));
      if(link) link.click();
    });
    await page.waitForTimeout(1500);

    // 找 input[type=file]
    const fileInput = await page.$('input[type=file]');
    if(!fileInput){
      console.warn('[tryClickUploadLocal] no file input');
      return false;
    }
    await fileInput.uploadFile(localFilePath);
    console.log('[tryClickUploadLocal] uploaded =>', localFilePath);

    await page.waitForTimeout(2000);
    return true;
  } catch(err){
    console.error('[tryClickUploadLocal] error =>', err);
    return false;
  }
}

/** 
 * 指定圖片網址 => 使用「指定圖片網址」連結 => 輸入 publicImageUrl 
 */
async function tryClickSpecifyImageUrl(page, publicImageUrl) {
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const link = [...document.querySelectorAll('a')]
      .find(a => a.innerText.includes('指定圖片網址'));
    if(link) link.click();
  });
  await page.waitForSelector('input[type=text]', { timeout:10000 });
  await page.type('input[type=text]', publicImageUrl, { delay:50 });
  console.log('[tryClickSpecifyImageUrl] => typed URL =>', publicImageUrl);
  await page.waitForTimeout(1500);
}

/** 
 * Baidu 第二階段上傳/貼URL 
 */
async function tryBaiduUpload(page, localFilePath, publicImageUrl) {
  await page.waitForTimeout(3000);

  // Baidu 常見 input[type=file]
  try {
    const fileInput = await page.$('input[type=file]');
    if(fileInput && localFilePath){
      console.log('[tryBaiduUpload] uploading local =>', localFilePath);
      await fileInput.uploadFile(localFilePath);
      await page.waitForTimeout(4000);
      return;
    }
  } catch(eFile){
    console.warn('[tryBaiduUpload] local file fail =>', eFile);
  }

  // 再嘗試貼 URL
  if(publicImageUrl){
    try {
      const textInput = await page.$('input[type=text]');
      if(textInput){
        await textInput.type(publicImageUrl, { delay:30 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
      }
    } catch(eUrl){
      console.warn('[tryBaiduUpload] publicImageUrl fail =>', eUrl);
    }
  }
}

/**
 * [C] doSearchEngines: 統一入口
 *  1. 先 aggregatorSearchGinifabStrict
 *  2. 若整個 aggregator 失敗(或沒搜到任何連結)則 fallbackDirectEngines
 */
async function doSearchEngines(localFilePath, aggregatorFirst=true, aggregatorImageUrl='') {
  console.log('[doSearchEngines] => aggregatorFirst=', aggregatorFirst, ' aggregatorImageUrl=', aggregatorImageUrl);

  // 結果格式
  const final = {
    bing: { links: [] },
    tineye: { links: [] },
    baidu: { links: [] }
  };

  if(!aggregatorFirst){
    // 直接 fallback
    const fb = await fallbackDirectEngines(localFilePath);
    final.bing.links   = fb.bing;
    final.tineye.links = fb.tineye;
    final.baidu.links  = fb.baidu;
    return final;
  }

  let aggregatorOK = false;
  try {
    const aggregatorResult = await aggregatorSearchGinifabStrict(localFilePath, aggregatorImageUrl);
    const total = aggregatorResult.bing.length
                + aggregatorResult.tineye.length
                + aggregatorResult.baidu.length;
    if(total > 0){
      aggregatorOK = true;
      final.bing.links   = aggregatorResult.bing;
      final.tineye.links = aggregatorResult.tineye;
      final.baidu.links  = aggregatorResult.baidu;
    }
  } catch(e){
    console.error('[doSearchEngines][aggregator] error =>', e);
  }

  // aggregator沒成功 => fallback
  if(!aggregatorOK){
    console.warn('[doSearchEngines] aggregator fail => fallbackDirect');
    const fb = await fallbackDirectEngines(localFilePath);
    final.bing.links   = fb.bing;
    final.tineye.links = fb.tineye;
    final.baidu.links  = fb.baidu;
  }

  return final;
}

// 小工具: 截圖 & log
async function saveDebugInfo(page, prefix){
  try {
    const ts = Date.now();
    const fn = `/app/debugShots/${prefix}_${ts}.png`;
    await page.screenshot({ path: fn, fullPage:true });
    const url = page.url();
    const title = await page.title();
    console.log(`[saveDebugInfo] => screenshot=${fn}, url=${url}, title=${title}`);
  } catch(e){
    console.warn('[saveDebugInfo] fail =>', e);
  }
}

// 匯出
module.exports = {
  doSearchEngines
};
