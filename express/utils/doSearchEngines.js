/**
 * express/utils/doSearchEngines.js
 *
 * 負責「以圖搜」核心邏輯：包括
 *   1) aggregatorSearchGinifab：嘗試 ginifab 網站「聚合」搜索 (上傳檔案 or 指定網址)，
 *      成功後自動點擊 Bing/TinEye/Baidu 三大連結，擷取外部連結。
 *   2) fallbackDirectEngines：直接在 Bing、TinEye、Baidu 上各自打開並上傳檔案。
 * 若 aggregator 部分都沒找到任何結果，就會使用 fallbackDirectEngines。
 */

const path = require('path');
const fs = require('fs');

// 若您有專門的 closeAdHelper 檔案可引入：
// const { tryCloseAd } = require('./closeAdHelper');
//
// 若直接引用此檔案最上方的 tryCloseAd 也行，但這裡示範引用單獨檔:
const { tryCloseAd } = require('./closeAdHelper');

// 使用 puppeteerExtra (帶 stealth) 而非純 puppeteer
const puppeteerExtra = require('./puppeteerExtra');

/**
 * 若您有單獨的 saveDebug.js，可直接 import
 * 這裡示範一個內建截圖小工具 doScreenshot
 */
async function doScreenshot(page, prefix) {
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

// ----------------------------------------------------------------------
// 1) aggregatorSearchGinifab - 上傳(或輸入URL) + 點擊 Bing/TinEye/Baidu
// ----------------------------------------------------------------------
async function aggregatorSearchGinifab(localFilePath, publicImageUrl) {
  console.log('[aggregatorSearchGinifab] => localFilePath=', localFilePath, ' publicImageUrl=', publicImageUrl);
  const results = { bing: [], tineye: [], baidu: [] };

  let browser;
  let page;
  try {
    // 啟動有 Stealth Plugin 的 Puppeteer
    browser = await puppeteerExtra.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113 Safari/537.36');

    // 前往 ginifab
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil: 'domcontentloaded',
      timeout: 25000
    });
    await doScreenshot(page, 'ginifab_afterGoto');
    await page.waitForTimeout(2000);

    // 嘗試關閉廣告
    await tryCloseAd(page, 2);

    // 嘗試上傳 (多種流程 iOS/Android/Desktop) 或 輸入 URL
    let finalSuccess = false;
    if (localFilePath) {
      // 先嘗試多版本：iOS/Android/Desktop
      finalSuccess = await tryGinifabUploadLocalAllFlow(page, localFilePath);
      if (!finalSuccess && publicImageUrl) {
        console.log('[aggregatorSearchGinifab] local upload fail => try specifyImageUrl...');
        const urlOk = await tryGinifabWithUrl(page, publicImageUrl);
        finalSuccess = urlOk;
      }
    } else if (publicImageUrl) {
      finalSuccess = await tryGinifabWithUrl(page, publicImageUrl);
    }

    // 都失敗 => 可能網頁改版或載入問題 => 改用 Google 搜 ginifab
    if (!finalSuccess) {
      console.warn('[aggregatorSearchGinifab] local+URL both fail => goto google fallback...');
      const googleOk = await gotoGinifabViaGoogle(page, publicImageUrl);
      if (!googleOk) {
        console.warn('[aggregatorSearchGinifab] google path also fail => aggregator stop');
        await doScreenshot(page, 'ginifab_googleAlsoFail');
        return results;
      }
    }

    // 全部就緒 => 順序點 Bing / TinEye / Baidu
    const aggregatorLinks = await doAggregatorMultiEngines(page, browser);
    results.bing   = aggregatorLinks.bing;
    results.tineye = aggregatorLinks.tineye;
    results.baidu  = aggregatorLinks.baidu;

  } catch (err) {
    console.error('[aggregatorSearchGinifab] error =>', err);
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }

  return results;
}

// 1-1) 多種上傳流程 (iOS / Android / Desktop)，僅做示範
async function tryGinifabUploadLocalAllFlow(page, localFilePath) {
  if (!localFilePath) return false;

  console.log('[tryGinifabUploadLocalAllFlow] => file=', localFilePath);
  // iOS
  try {
    if (await tryGinifabUploadLocal_iOS(page, localFilePath)) return true;
  } catch (e) {
    console.warn('[tryGinifabUploadLocal_iOS] fail =>', e.message);
  }

  // Android
  try {
    if (await tryGinifabUploadLocal_Android(page, localFilePath)) return true;
  } catch (e) {
    console.warn('[tryGinifabUploadLocal_Android] fail =>', e.message);
  }

  // Desktop
  try {
    if (await tryGinifabUploadLocal_Desktop(page, localFilePath)) return true;
  } catch (e) {
    console.warn('[tryGinifabUploadLocal_Desktop] fail =>', e.message);
  }

  // 全都失敗 => 回退到舊版簡單 selector
  console.warn('[tryGinifabUploadLocalAllFlow] allFlow fail => fallback old tryGinifabUploadLocal');
  try {
    const oldOk = await tryGinifabUploadLocal(page, localFilePath);
    return oldOk;
  } catch (oldE) {
    console.warn('[tryGinifabUploadLocal] fail =>', oldE.message);
  }

  // 完全失敗
  return false;
}

// iOS 模擬: 假設 ID = #ios_file_btn
async function tryGinifabUploadLocal_iOS(page, localFilePath) {
  await tryCloseAd(page, 1);
  const iOSBtn = await page.$('#ios_file_btn'); // 請依實際 DOM 修改
  if (!iOSBtn) throw new Error('Node is either not clickable or not an HTMLElement');
  await iOSBtn.evaluate(el => {
    el.scrollIntoView({ block: 'center', inline: 'center' });
    el.click();
  });
  await page.waitForTimeout(1000);

  const fileInput = await page.$('input[type=file]');
  if (!fileInput) throw new Error('input[type=file] not found');
  await fileInput.uploadFile(localFilePath);
  await page.waitForTimeout(2000);

  console.log('[tryGinifabUploadLocal_iOS] success');
  return true;
}

// Android 模擬
async function tryGinifabUploadLocal_Android(page, localFilePath) {
  await tryCloseAd(page, 1);
  const androidBtn = await page.$('#android_file_btn');
  if (!androidBtn) throw new Error('Node is either not clickable or not an HTMLElement');
  await androidBtn.evaluate(el => {
    el.scrollIntoView({ block: 'center', inline: 'center' });
    el.click();
  });
  await page.waitForTimeout(1000);

  const fileInput = await page.$('input[type=file]');
  if (!fileInput) throw new Error('input[type=file] not found');
  await fileInput.uploadFile(localFilePath);
  await page.waitForTimeout(2000);

  console.log('[tryGinifabUploadLocal_Android] success');
  return true;
}

// Desktop 模擬
async function tryGinifabUploadLocal_Desktop(page, localFilePath) {
  await tryCloseAd(page, 1);
  const desktopBtn = await page.$('#pc_file_btn');
  if (!desktopBtn) throw new Error('Node is either not clickable or not an HTMLElement');
  await desktopBtn.evaluate(el => {
    el.scrollIntoView({ block: 'center', inline: 'center' });
    el.click();
  });
  await page.waitForTimeout(1000);

  const fileInput = await page.$('input[type=file]');
  if (!fileInput) throw new Error('input[type=file] not found');
  await fileInput.uploadFile(localFilePath);
  await page.waitForTimeout(2000);

  console.log('[tryGinifabUploadLocal_Desktop] success');
  return true;
}

// 舊版簡易：透過文字「上傳本機圖片」/「上傳照片」
async function tryGinifabUploadLocal(page, localFilePath) {
  await tryCloseAd(page, 1);
  const [link] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
  if (!link) throw new Error('link not found => 上傳本機圖片 / 上傳照片');
  await link.evaluate(el => {
    el.scrollIntoView({ block: 'center', inline: 'center' });
    el.click();
  });
  await page.waitForTimeout(1000);

  const fileInput = await page.$('input[type=file]');
  if (!fileInput) throw new Error('input[type=file] not found');
  await fileInput.uploadFile(localFilePath);
  await page.waitForTimeout(2000);

  console.log('[tryGinifabUploadLocal] upload done');
  return true;
}

// 1-2) 指定圖片網址
async function tryGinifabWithUrl(page, publicImageUrl) {
  await tryCloseAd(page, 1);
  const [link] = await page.$x("//a[contains(text(),'指定圖片網址')]");
  if (!link) throw new Error('指定圖片網址 link not found');
  await link.evaluate(el => {
    el.scrollIntoView({ block: 'center', inline: 'center' });
    el.click();
  });
  await page.waitForTimeout(1000);

  // 輸入框
  const input = await page.waitForSelector('input[type=text]', { visible: true, timeout: 10000 });
  await input.type(publicImageUrl, { delay: 50 });
  await page.waitForTimeout(1500);

  console.log('[tryGinifabWithUrl] success => typed URL');
  return true;
}

// 1-3) 若 ginifab 首頁都失敗 => 改用 Google 搜「ginifab」
async function gotoGinifabViaGoogle(page, publicImageUrl) {
  console.log('[gotoGinifabViaGoogle]');
  try {
    await page.goto('https://www.google.com/', { waitUntil: 'domcontentloaded', timeout: 25000 });
    await doScreenshot(page, 'google_afterGoto');
    await page.waitForTimeout(2000);

    const input = await page.$('input[name="q"]');
    if (!input) {
      console.warn('[gotoGinifabViaGoogle] google input not found');
      return false;
    }
    await input.type('以圖搜圖 ginifab', { delay: 50 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    // 找到搜索結果中符合 ginifab.com.tw
    const linkHandles = await page.$x("//a[contains(@href,'ginifab.com.tw')]");
    if (linkHandles.length === 0) {
      console.warn('[gotoGinifabViaGoogle] ginifab link not found');
      return false;
    }
    const hrefVal = await (await linkHandles[0].getProperty('href')).jsonValue();
    console.log(`[gotoGinifabViaGoogle] found => ${hrefVal}`);
    await linkHandles[0].evaluate(el => el.click());
    await page.waitForTimeout(3000);

    // 再次嘗試上傳 or 輸入URL
    await doScreenshot(page, 'google_gotoGinifab');
    await tryCloseAd(page, 2);

    if (publicImageUrl) {
      await tryGinifabWithUrl(page, publicImageUrl);
    }
    return true;
  } catch (e) {
    console.error('[gotoGinifabViaGoogle] fail =>', e);
    return false;
  }
}

// 1-4) 依序點「Bing / TinEye / Baidu」連結 -> 抓外部連結
async function doAggregatorMultiEngines(mainPage, browser) {
  const results = { bing: [], tineye: [], baidu: [] };
  const engineList = [
    { key: 'bing',   label: ['Bing', '微軟必應'] },
    { key: 'tineye', label: ['TinEye', '錫眼睛'] },
    { key: 'baidu',  label: ['Baidu', '百度'] }
  ];

  for (const eng of engineList) {
    try {
      console.log(`[doAggregatorMultiEngines] click => ${eng.key}`);
      // 準備等待新分頁
      const newTabPromise = new Promise(resolve => {
        browser.once('targetcreated', async target => {
          const popPage = await target.page();
          resolve(popPage);
        });
      });

      // 關廣告
      await tryCloseAd(mainPage, 1);

      // 在 ginifab 主頁依 label 找對應的 <a>
      await mainPage.evaluate(labels => {
        const as = [...document.querySelectorAll('a')];
        for (const lab of labels) {
          const found = as.find(a => a.innerText.includes(lab));
          if (found) {
            found.click();
            return;
          }
        }
      }, eng.label);

      // 取得新分頁
      const popup = await newTabPromise;
      await popup.bringToFront();
      await popup.setViewport({ width:1280, height:800 });
      await popup.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/113 Safari/537.36');
      await popup.waitForTimeout(3000);

      // 嘗試關閉子分頁的廣告
      await tryCloseAd(popup, 1);

      // 擷取外部連結 (排除 ginifab / bing / tineye / baidu)
      let hrefs = await popup.$$eval('a', as => as.map(a => a.href));
      hrefs = hrefs.filter(l => 
        l && !l.includes('ginifab') &&
        !l.includes('bing.com') &&
        !l.includes('tineye.com') &&
        !l.includes('baidu.com')
      );
      results[eng.key] = [...new Set(hrefs)].slice(0, 8);

      // 關閉子分頁
      await popup.close();

      // 回到 ginifab 主頁
      await mainPage.bringToFront();
      await tryCloseAd(mainPage, 1);

    } catch (err) {
      console.error(`[doAggregatorMultiEngines][${eng.key}] =>`, err);
    }
  }

  return results;
}

// ----------------------------------------------------------------------
// 2) fallbackDirectEngines - 分別打開 Bing / TinEye / Baidu
// ----------------------------------------------------------------------
async function fallbackDirectEngines(localFilePath) {
  console.log('[fallbackDirectEngines] start =>', localFilePath);
  const results = { bing: [], tineye: [], baidu: [] };
  let browser;
  try {
    browser = await puppeteerExtra.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('[fallbackDirectEngines] browser launched...');

    results.bing   = await directSearchBing(browser, localFilePath);
    results.tineye = await directSearchTinEye(browser, localFilePath);
    results.baidu  = await directSearchBaidu(browser, localFilePath);

  } catch (allErr) {
    console.error('[fallbackDirectEngines error]', allErr);
  } finally {
    if (browser) await browser.close().catch(() => {});
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
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113 Safari/537.36');

    await page.goto('https://www.bing.com/images', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await doScreenshot(page, 'bing_afterGoto');
    await page.waitForTimeout(2000);

    // 常見 Bing 圖片上傳按鈕 #sbi_b / .micsvc_lpicture / #sbi_l / .sb_sbi ...
    const possibleSelectors = ['#sbi_b', '.micsvc_lpicture', '#sbi_l', '.sb_sbi'];
    let success = false;
    for (const sel of possibleSelectors) {
      try {
        console.log('[directSearchBing] try click =>', sel);
        const [fileChooser] = await Promise.all([
          page.waitForFileChooser({ timeout: 10000 }),
          page.click(sel, { delay: 100 })
        ]);
        await fileChooser.accept([imagePath]);
        console.log('[directSearchBing] fileChooser accepted =>', imagePath);
        success = true;
        break;
      } catch (errSel) {
        console.warn(`[directSearchBing] selector ${sel} fail =>`, errSel.message);
      }
    }
    if (!success) {
      throw new Error('All possible Bing selectors fail => cannot open file dialog');
    }
    await page.waitForTimeout(5000);

    let links = await page.$$eval('a', as => as.map(a => a.href));
    links = links.filter(l => l && !l.includes('bing.com'));
    finalLinks = [...new Set(links)].slice(0, 8);

  } catch (e) {
    console.error('[directSearchBing] fail =>', e);
    if (page) await doScreenshot(page, 'bing_error');
  } finally {
    if (page) await page.close().catch(() => {});
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
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/113 Safari/537.36');

    await page.goto('https://tineye.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await doScreenshot(page, 'tineye_afterGoto');
    await page.waitForTimeout(2000);

    const fileInput = await page.$('input[type=file]');
    if (!fileInput) throw new Error('TinEye input[type=file] not found');

    await fileInput.uploadFile(imagePath);
    // 上傳後 Tineye 會自動跳轉
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);

    let links = await page.$$eval('a', as => as.map(a => a.href));
    links = links.filter(l => l && !l.includes('tineye.com'));
    finalLinks = [...new Set(links)].slice(0, 8);

  } catch (e) {
    console.error('[directSearchTinEye] fail =>', e);
    if (page) await doScreenshot(page, 'tineye_error');
  } finally {
    if (page) await page.close().catch(() => {});
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
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/113 Safari/537.36');

    // 先嘗試 graph.baidu.com (PC 版)，可能自動跳手機 => 再試 image.baidu.com
    await page.goto('https://graph.baidu.com/?tn=pc', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await doScreenshot(page, 'baidu_afterGoto');
    await page.waitForTimeout(3000);

    const currentUrl = page.url() || '';
    if (currentUrl.includes('m.baidu.com')) {
      console.warn('[directSearchBaidu] we are on mobile => try image.baidu.com');
      await page.goto('https://image.baidu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      // 嘗試點「相機」按鈕 => 上傳
      const cameraBtn = await page.$('span.soutu-btn');
      if (cameraBtn) {
        await cameraBtn.evaluate(el => el.click());
        await page.waitForTimeout(1500);

        const fileInput = await page.$('input.upload-pic');
        if (fileInput) {
          await fileInput.uploadFile(imagePath);
          await page.waitForTimeout(4000);
        }
      }
    } else {
      // graph.baidu.com => 檔案上傳
      const fInput = await page.$('input[type=file]');
      if (!fInput) throw new Error('graph.baidu => input[type=file] not found');
      await fInput.uploadFile(imagePath);
      await page.waitForTimeout(5000);
    }

    // 擷取結果連結
    let links = await page.$$eval('a', as => as.map(a => a.href));
    links = links.filter(l => l && !l.includes('baidu.com'));
    finalLinks = [...new Set(links)].slice(0, 8);

  } catch (e) {
    console.error('[directSearchBaidu] fail =>', e);
    if (page) await doScreenshot(page, 'baidu_error');
  } finally {
    if (page) await page.close().catch(() => {});
  }
  return finalLinks;
}

// ----------------------------------------------------------------------
// 3) 外部匯出入口
// ----------------------------------------------------------------------
/**
 * doSearchEngines
 *   1. 預設 aggregatorFirst=true => 先跑 aggregatorSearchGinifab
 *   2. 若 aggregator 結果都沒抓到 => fallbackDirectEngines
 */
async function doSearchEngines(localFilePath, aggregatorFirst = true, aggregatorUrl = '') {
  console.log('[doSearchEngines] aggregatorFirst=', aggregatorFirst, ' aggregatorUrl=', aggregatorUrl);

  let aggregatorOK = false;
  let aggregatorRes = { bing: [], tineye: [], baidu: [] };

  if (aggregatorFirst) {
    try {
      aggregatorRes = await aggregatorSearchGinifab(localFilePath, aggregatorUrl);
      const total = aggregatorRes.bing.length + aggregatorRes.tineye.length + aggregatorRes.baidu.length;
      aggregatorOK = (total > 0);
    } catch (e) {
      console.error('[doSearchEngines][aggregator] error =>', e);
    }
  }

  // 若 aggregator 沒成功 => fallback
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
