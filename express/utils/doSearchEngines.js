/**
 * File: express/utils/doSearchEngines.js
 *
 * 負責「圖搜」邏輯：優先嘗試 aggregatorSearchGinifab + Bing/TinEye/Baidu 三連搜，
 * 若失敗則再 fallbackDirectEngines (直接打開 Bing/TinEye/Baidu)。
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// ---------------------------------------------------------
// 1) tryCloseAd - 自動關閉 Ginifab / 其它頁面上廣告
// ---------------------------------------------------------
/**
 * tryCloseAd - 嘗試關閉 Ginifab 或其它頁面上可能的廣告 (以「X」「×」「關閉」為例)
 * @param {object} page - puppeteer Page
 * @param {number} maxTimes - 最多嘗試次數
 * @returns {Promise<boolean>} - 是否成功關掉至少一次
 */
async function tryCloseAd(page, maxTimes = 2) {
  let closedCount = 0;
  for (let i = 0; i < maxTimes; i++) {
    try {
      // 用 XPath 嘗試抓到 含有「×」「X」「關閉」等文字的按鈕/Span/Div
      // 若你實際的廣告按鈕不在這些元素裡，請改成對應的 class/id/text
      const [closeBtn] = await page.$x(
        "//button[contains(text(),'×') or contains(text(),'X') or contains(text(),'關閉')]" +
        " | //span[contains(text(),'×') or contains(text(),'X') or contains(text(),'關閉')]" +
        " | //div[contains(text(),'×') or contains(text(),'X') or contains(text(),'關閉')]"
      );
      if (closeBtn) {
        console.log('[tryCloseAd] found ad close button => clicking...');
        await closeBtn.click();
        await page.waitForTimeout(1500);
        closedCount++;
      } else {
        // 找不到 => 不再繼續
        break;
      }
    } catch (e) {
      console.warn('[tryCloseAd] click fail =>', e);
      break;
    }
  }
  if (closedCount > 0) {
    console.log(`[tryCloseAd] total closed => ${closedCount}`);
    return true;
  }
  return false;
}

/**
 * 小工具: 截圖 & log
 */
async function saveDebugInfo(page, prefix) {
  try {
    const ts = Date.now();
    const fn = `/app/debugShots/${prefix}_${ts}.png`;
    await page.screenshot({ path: fn, fullPage: true });
    const url = page.url();
    const title = await page.title();
    console.log(`[saveDebugInfo] => screenshot=${fn}, url=${url}, title=${title}`);
  } catch (e) {
    console.warn('[saveDebugInfo] fail =>', e);
  }
}

// ---------------------------------------------------------
// 2) aggregatorSearchGinifabStrict
// ---------------------------------------------------------
/**
 * aggregatorSearchGinifabStrict
 *   1. 前往 Ginifab 主頁
 *   2. 關閉廣告
 *   3. 上傳圖片 or 指定圖片網址
 *   4. 順序點 Bing / TinEye / Baidu (各開新分頁)
 *   5. 每關完分頁，回到主頁再 tryCloseAd 一次
 *   6. 回傳三引擎抓到的外部連結
 */
async function aggregatorSearchGinifabStrict(localFilePath = '', publicImageUrl = '') {
  console.log('[aggregatorSearchGinifabStrict] => file=', localFilePath, ' url=', publicImageUrl);

  const results = { bing: [], tineye: [], baidu: [] };
  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113 Safari/537.36');

    // 前往 ginifab
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    await page.waitForTimeout(2000);

    // 關閉廣告
    await tryCloseAd(page, 2);

    // 上傳 or 指定URL
    let ok = false;
    if (localFilePath) {
      ok = await tryClickUploadLocal(page, localFilePath);
      if (!ok && publicImageUrl) {
        console.warn('[aggregatorSearchGinifabStrict] local fail => try specify URL...');
        ok = await tryClickSpecifyImageUrl(page, publicImageUrl);
      }
    } else if (publicImageUrl) {
      ok = await tryClickSpecifyImageUrl(page, publicImageUrl);
    }

    if (!ok) {
      console.warn('[aggregatorSearchGinifabStrict] both local & URL fail => aggregator stop');
      return results;
    }

    // 順序點 Bing / TinEye / Baidu
    const engines = [
      { key: 'bing',   label: ['Bing', '微軟必應'] },
      { key: 'tineye', label: ['TinEye', '錫眼睛'] },
      { key: 'baidu',  label: ['Baidu', '百度'] }
    ];

    for (const eng of engines) {
      try {
        console.log(`[aggregatorSearchGinifabStrict] click => ${eng.key}`);

        // 準備等待新分頁
        const newTab = new Promise(resolve => {
          browser.once('targetcreated', async target => {
            const pop = await target.page();
            resolve(pop);
          });
        });

        // 先關一次廣告
        await tryCloseAd(page, 2);
        // 再點擊對應文字鏈結
        await page.evaluate(labels => {
          const as = [...document.querySelectorAll('a')];
          for (const lab of labels) {
            const found = as.find(a => a.innerText.includes(lab));
            if (found) {
              found.click();
              return;
            }
          }
        }, eng.label);

        // 取得彈出分頁
        const popup = await newTab;
        await popup.bringToFront();
        await popup.setViewport({ width: 1280, height: 800 });
        await popup.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/113 Safari/537.36');
        await popup.waitForTimeout(3000);

        // 若是 Baidu => 再關廣告、或做二次上傳
        if (eng.key === 'baidu') {
          await tryCloseAd(popup, 2);
          // 此處可再做 baidu 二次上傳
        }

        // 抓取外部連結(非 ginifab/bing/tineye/baidu)
        let hrefs = await popup.$$eval('a', as => as.map(a => a.href));
        hrefs = hrefs.filter(l =>
          l && !l.includes('ginifab') &&
          !l.includes('bing.com') &&
          !l.includes('tineye.com') &&
          !l.includes('baidu.com')
        );
        results[eng.key] = [...new Set(hrefs)].slice(0, 8);

        await popup.close();

        // 回到 ginifab 主頁，再關一次廣告
        await page.bringToFront();
        await tryCloseAd(page, 2);

      } catch (errEng) {
        console.error(`[aggregatorSearchGinifabStrict][${eng.key}] =>`, errEng);
      }
    }

  } catch (err) {
    console.error('[aggregatorSearchGinifabStrict] error =>', err);
  } finally {
    if (page) await page.close().catch(()=>{});
    if (browser) await browser.close().catch(()=>{});
  }

  return results;
}

/**
 * tryClickUploadLocal - 上傳本機圖片
 */
async function tryClickUploadLocal(page, localFilePath) {
  try {
    console.log('[tryClickUploadLocal] =>', localFilePath);
    await tryCloseAd(page, 2);

    // 找「上傳本機圖片」/「上傳照片」等文字
    const [link] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if (!link) {
      console.warn('[tryClickUploadLocal] link not found => 上傳本機圖片');
      return false;
    }
    await link.click();
    await page.waitForTimeout(1000);

    // 找 input[type=file]
    const fileInput = await page.$('input[type=file]');
    if (!fileInput) {
      console.warn('[tryClickUploadLocal] input[type=file] not found');
      return false;
    }
    await fileInput.uploadFile(localFilePath);
    await page.waitForTimeout(2000);

    console.log('[tryClickUploadLocal] upload done');
    return true;
  } catch (e) {
    console.error('[tryClickUploadLocal] error =>', e);
    return false;
  }
}

/**
 * tryClickSpecifyImageUrl - 指定圖片網址
 */
async function tryClickSpecifyImageUrl(page, publicImageUrl) {
  try {
    console.log('[tryClickSpecifyImageUrl] =>', publicImageUrl);
    await tryCloseAd(page, 2);

    // 找「指定圖片網址」連結
    const [link2] = await page.$x("//a[contains(text(),'指定圖片網址')]");
    if (!link2) {
      console.warn('[tryClickSpecifyImageUrl] link not found => 指定圖片網址');
      return false;
    }
    await link2.click();
    await page.waitForTimeout(1000);

    // 輸入框
    const input = await page.waitForSelector('input[type=text]', { timeout: 5000 });
    await input.type(publicImageUrl, { delay: 50 });
    await page.waitForTimeout(1500);

    return true;
  } catch (e) {
    console.error('[tryClickSpecifyImageUrl] error =>', e);
    return false;
  }
}

// ---------------------------------------------------------
// 3) fallbackDirectEngines
// ---------------------------------------------------------
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
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('[fallbackDirectEngines] browser launched...');

    // 依序執行 Bing / TinEye / Baidu
    results.bing   = await directSearchBing(browser, imagePath);
    results.tineye = await directSearchTinEye(browser, imagePath);
    results.baidu  = await directSearchBaidu(browser, imagePath);

  } catch (allErr) {
    console.error('[fallbackDirectEngines error]', allErr);
  } finally {
    if (browser) await browser.close().catch(()=>{});
  }
  console.log('[fallbackDirectEngines] done =>', results);
  return results;
}

// directSearchBing
async function directSearchBing(browser, imagePath) {
  console.log('[directSearchBing] =>', imagePath);
  let finalLinks = [];
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');

    await page.goto('https://www.bing.com/images', { waitUntil:'domcontentloaded', timeout:30000 });
    await saveDebugInfo(page, 'bing_afterGoto');
    await page.waitForTimeout(2000);

    const possibleSelectors = ['#sbi_b', '.micsvc_lpicture', '#sbi_l', '.sb_sbi'];
    let success = false;
    for (const sel of possibleSelectors) {
      try {
        console.log('[directSearchBing] try click =>', sel);
        const [fileChooser] = await Promise.all([
          page.waitForFileChooser({ timeout: 10000 }),
          page.click(sel)
        ]);
        await fileChooser.accept([imagePath]);
        console.log('[directSearchBing] fileChooser accepted =>', imagePath);
        success = true;
        break;
      } catch (eSel) {
        console.warn(`[directSearchBing] selector ${sel} fail =>`, eSel.message);
      }
    }
    if(!success){
      throw new Error('All possible Bing selectors fail => cannot open file dialog');
    }
    await page.waitForTimeout(5000);

    let links = await page.$$eval('a', as => as.map(a=> a.href));
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

// directSearchTinEye
async function directSearchTinEye(browser, imagePath) {
  console.log('[directSearchTinEye] =>', imagePath);
  let finalLinks = [];
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');

    await page.goto('https://tineye.com/', { waitUntil:'domcontentloaded', timeout:30000 });
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

// directSearchBaidu
async function directSearchBaidu(browser, imagePath) {
  console.log('[directSearchBaidu] =>', imagePath);
  let finalLinks = [];
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');

    // 進入 graph.baidu
    await page.goto('https://graph.baidu.com/?tn=pc', { waitUntil:'domcontentloaded', timeout:30000 });
    await saveDebugInfo(page, 'baidu_afterGoto');
    await page.waitForTimeout(3000);

    let currentUrl = page.url() || '';
    if(currentUrl.includes('m.baidu.com')){
      console.warn('[directSearchBaidu] we are on mobile => try image.baidu.com');
      await page.goto('https://image.baidu.com/', { waitUntil:'domcontentloaded', timeout:30000 });
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
          } else {
            console.warn('[directSearchBaidu] no input.upload-pic');
          }
        }
      } catch(eImg){
        console.warn('[directSearchBaidu] image.baidu second approach fail =>', eImg.message);
      }
    } else {
      // graph.baidu.com => input[type=file]
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

// ---------------------------------------------------------
// 4) doSearchEngines (入口)
// ---------------------------------------------------------
/**
 * doSearchEngines
 *   1. 先 aggregatorSearchGinifabStrict
 *   2. 若 aggregator 全部沒搜到 => fallbackDirectEngines
 */
async function doSearchEngines(localFilePath, aggregatorFirst = true, aggregatorImageUrl = '') {
  console.log('[doSearchEngines] aggregatorFirst=', aggregatorFirst, ' aggregatorUrl=', aggregatorImageUrl);

  let aggregatorOK = false;
  let aggregatorRes = { bing: [], tineye: [], baidu: [] };

  // 先嘗試 aggregator
  if (aggregatorFirst) {
    try {
      aggregatorRes = await aggregatorSearchGinifabStrict(localFilePath, aggregatorImageUrl);
      const total = aggregatorRes.bing.length + aggregatorRes.tineye.length + aggregatorRes.baidu.length;
      aggregatorOK = (total > 0);
    } catch (eAgg) {
      console.error('[doSearchEngines][aggregator] error =>', eAgg);
    }
  }

  // 若 aggregator 沒成功，就 fallback
  if (!aggregatorOK) {
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
