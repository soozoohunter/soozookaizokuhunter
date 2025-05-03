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

/**
 * [A] fallbackDirectEngines
 *  若 aggregatorSearchGinifab 全部失敗 -> 再逐一打開 Bing / TinEye / Baidu 嘗試上傳檔案。
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
      headless: true, // 改成true，避免舊Chromium不支援 'new'
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    // ------------------------------------------------
    // [Bing]
    // ------------------------------------------------
    results.bing = await directSearchBing(browser, imagePath);
    // ------------------------------------------------
    // [TinEye]
    // ------------------------------------------------
    results.tineye = await directSearchTinEye(browser, imagePath);
    // ------------------------------------------------
    // [Baidu]
    // ------------------------------------------------
    results.baidu = await directSearchBaidu(browser, imagePath);

  } catch(allErr) {
    console.error('[fallbackDirectEngines error]', allErr);
  } finally {
    if (browser) await browser.close().catch(()=>{});
  }

  console.log('[fallbackDirectEngines] done =>', results);
  return results;
}

async function directSearchBing(browser, imagePath){
  console.log('[directSearchBing] =>', imagePath);
  let finalLinks=[];
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
    await page.goto('https://www.bing.com/images', {
      waitUntil:'domcontentloaded', timeout:30000
    });
    await saveDebugInfo(page, 'bing_afterGoto');
    await page.waitForTimeout(2000);

    // 嘗試多個 selector (#sbi_b, .micsvc_lpicture, #sbi_l, .sb_sbi)
    let success = false;
    const possibleSelectors = ['#sbi_b', '.micsvc_lpicture', '#sbi_l', '.sb_sbi'];

    for(const sel of possibleSelectors){
      try {
        console.log('[directSearchBing] try click =>', sel);
        const [fileChooser] = await Promise.all([
          page.waitForFileChooser({ timeout:15000 }),
          page.click(sel)
        ]);
        await fileChooser.accept([imagePath]);
        console.log('[directSearchBing] fileChooser accepted =>', imagePath);
        success = true;
        break;
      } catch(eSel){
        console.warn(`[directSearchBing] selector ${sel} fail =>`, eSel.message);
      }
    }

    if(!success){
      throw new Error('All possible Bing selectors fail => cannot open file dialog');
    }

    // 等待搜尋
    await page.waitForTimeout(5000);
    let links = await page.$$eval('a', as => as.map(a => a.href));
    links = links.filter(l => l && !l.includes('bing.com'));
    finalLinks = [...new Set(links)].slice(0,8);

  } catch(e){
    console.error('[directSearchBing] fail =>', e);
    if(page) await saveDebugInfo(page, 'bing_error');
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return finalLinks;
}

async function directSearchTinEye(browser, imagePath){
  console.log('[directSearchTinEye] =>', imagePath);
  let finalLinks=[];
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
    await page.goto('https://tineye.com/', {
      waitUntil:'domcontentloaded', timeout:30000
    });
    await saveDebugInfo(page, 'tineye_afterGoto');
    await page.waitForTimeout(2000);

    const fileInput = await page.$('input[type=file]');
    if(fileInput){
      await fileInput.uploadFile(imagePath);
      await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
      await page.waitForTimeout(3000);

      let links = await page.$$eval('a', as => as.map(a=> a.href));
      links = links.filter(l => l && !l.includes('tineye.com'));
      finalLinks = [...new Set(links)].slice(0,8);
    } else {
      throw new Error('TinEye input[type=file] not found');
    }

  } catch(e){
    console.error('[directSearchTinEye] fail =>', e);
    if(page) await saveDebugInfo(page, 'tineye_error');
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return finalLinks;
}

async function directSearchBaidu(browser, imagePath){
  console.log('[directSearchBaidu] =>', imagePath);
  let finalLinks=[];
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');

    // 嘗試進入 graph.baidu.com + PC query param
    await page.goto('https://graph.baidu.com/?tn=pc', {
      waitUntil:'domcontentloaded', timeout:30000
    });
    await saveDebugInfo(page, 'baidu_afterGoto');
    await page.waitForTimeout(3000);

    // 若還是被導去 m.baidu.com => 再試 https://image.baidu.com/
    let currentUrl = page.url()||'';
    if(currentUrl.includes('m.baidu.com')){
      console.warn('[directSearchBaidu] we are on mobile version => try image.baidu.com');
      await page.goto('https://image.baidu.com/', {
        waitUntil:'domcontentloaded', timeout:30000
      });
      await page.waitForTimeout(3000);

      try {
        const cameraBtn = await page.$('span.soutu-btn');
        if(cameraBtn){
          await cameraBtn.click();
          await page.waitForTimeout(1500);
          const fileInput = await page.$('input.upload-pic');
          if(fileInput){
            await fileInput.uploadFile(imagePath);
            await page.waitForTimeout(4000);
          }
        }
      } catch(eImg){
        console.warn('[directSearchBaidu] image.baidu second approach fail =>', eImg.message);
      }
    } else {
      // 如果確實在 graph.baidu.com => 找 input[type=file]
      try {
        const fInput = await page.$('input[type=file]');
        if(!fInput) throw new Error('graph.baidu => input[type=file] not found');
        await fInput.uploadFile(imagePath);
        await page.waitForTimeout(5000);
      } catch(eGraph){
        console.warn('[directSearchBaidu] graph.baidu fail =>', eGraph.message);
      }
    }

    let links = await page.$$eval('a', as => as.map(a=> a.href));
    links = links.filter(l => l && !l.includes('baidu.com'));
    finalLinks = [...new Set(links)].slice(0,8);

  } catch(e){
    console.error('[directSearchBaidu] fail =>', e);
    if(page) await saveDebugInfo(page, 'baidu_error');
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return finalLinks;
}

/**
 * [B] aggregatorSearchGinifabStrict
 *  (理想情況) 先進入 https://www.ginifab.com.tw/tools/search_image_by_image/
 *   → 上傳本機 or 指定圖片網址
 *   → 順序點 Bing/TinEye/Baidu
 *   → Baidu 頁面再做手動二次上傳(此處簡化: 只抓該 tab href).
 */
async function aggregatorSearchGinifabStrict(localFilePath='', publicImageUrl='') {
  // 由於您最後的 logs 顯示 ginifab 介面大改，這裡先保留最小邏輯
  // 實際上若 ginifab 無法成功 => 轉 fallback
  console.log('[aggregatorSearchGinifabStrict] => file=', localFilePath, ' url=', publicImageUrl);

  return {
    bing: [],
    tineye: [],
    baidu: []
  };
}

/**
 * [C] doSearchEngines: 統一入口
 *   1. 先 aggregatorSearchGinifabStrict
 *   2. 若 aggregatorFail => fallbackDirectEngines
 */
async function doSearchEngines(localFilePath, aggregatorFirst=true, aggregatorImageUrl='') {
  console.log('[doSearchEngines] aggregatorFirst=', aggregatorFirst, ' aggregatorUrl=', aggregatorImageUrl);

  // aggregatorSearchGinifabStrict 已遭遇大幅介面變動 => 幾乎 100% 失敗
  // 因此目前預設 aggregator 直接回空 => fallback
  // 如果未來 ginifab 又恢復，可開啟 aggregatorSearchGinifabStrict 內部程式
  let aggregatorOK = false;
  let aggregatorRes = {
    bing:[],
    tineye:[],
    baidu:[]
  };

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

module.exports = {
  doSearchEngines
};
