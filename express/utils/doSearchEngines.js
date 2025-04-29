// express/utils/doSearchEngines.js

const path = require('path');
const fs = require('fs');
const puppeteerExtra = require('./puppeteerExtra'); // 你原本的 puppeteer extra
// ... 若有其他 require，也一併保留

//==================================================//
// (1) 新增輔助函式: 儲存截圖 + HTML dump 到 /app/debugShots
//==================================================//
async function saveDebugInfo(page, tag){
  try {
    const debugDir = '/app/debugShots'; 
    const now = Date.now();

    const shotPath = path.join(debugDir, `debug_${tag}_${now}.png`);
    await page.screenshot({ path: shotPath, fullPage:true }).catch(err=>{
      console.warn('[saveDebugInfo] screenshot fail =>', err);
    });

    const html = await page.content().catch(()=>'<html>fail to get content</html>');
    const htmlPath = path.join(debugDir, `debug_${tag}_${now}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');

    const currentUrl = page.url();
    const currentTitle = await page.title().catch(()=>null);
    console.log(`[saveDebugInfo] => screenshot=${shotPath} url=${currentUrl} title=${currentTitle}`);
  } catch(e){
    console.warn('[saveDebugInfo] error =>', e);
  }
}

//==================================================//
// (2) Direct Engines: Bing / TinEye / Baidu
//    (在每個try-catch中加入 saveDebugInfo 可視需要自行取名)
//==================================================//

async function directSearchBing(browser, imagePath){
  const ret = { success:false, links:[], screenshot:'' };
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 });

    await page.goto('https://www.bing.com/images', {
      waitUntil:'domcontentloaded', 
      timeout:20000
    });

    // ★ goto後先截圖
    await saveDebugInfo(page, 'bing_afterGoto');

    await page.waitForTimeout(2000);

    const [fc] = await Promise.all([
      page.waitForFileChooser({ timeout:10000 }),
      page.click('#sb_sbi').catch(()=>{}) // 攝影機 icon
    ]);
    await fc.accept([imagePath]);
    await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
    await page.waitForTimeout(3000);

    // 再次截圖 (可自由調整是否需要)
    const shot = path.join(__dirname, `../../uploads/bing_direct_${Date.now()}.png`);
    await page.screenshot({ path:shot, fullPage:true }).catch(()=>{});
    ret.screenshot = shot;

    // 抓連結 (排除含bing.com)
    let hrefs = await page.$$eval('a', as => as.map(a => a.href));
    hrefs = hrefs.filter(x => x && !x.includes('bing.com'));
    ret.links = [...new Set(hrefs)].slice(0,5);
    ret.success = true;

  } catch(e){
    console.error('[directSearchBing] fail =>', e);
    if(page) await saveDebugInfo(page, 'bing_error');
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

async function directSearchTinEye(browser, imagePath){
  const ret = { success:false, links:[], screenshot:'' };
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://tineye.com/', {
      waitUntil:'domcontentloaded', 
      timeout:20000
    });

    // ★ goto後先截圖
    await saveDebugInfo(page, 'tineye_afterGoto');

    await page.waitForTimeout(1500);

    const fileInput = await page.waitForSelector('input[type=file]', { timeout:8000 });
    await fileInput.uploadFile(imagePath);

    // 等結果
    await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
    await page.waitForTimeout(3000);

    const shot = path.join(__dirname, `../../uploads/tineye_direct_${Date.now()}.png`);
    await page.screenshot({ path:shot, fullPage:true }).catch(()=>{});
    ret.screenshot = shot;

    let hrefs = await page.$$eval('a', as => as.map(a=> a.href));
    hrefs = hrefs.filter(x=> x && !x.includes('tineye.com'));
    ret.links = [...new Set(hrefs)].slice(0,5);
    ret.success = true;

  } catch(e){
    console.error('[directSearchTinEye] fail =>', e);
    if(page) await saveDebugInfo(page, 'tineye_error');
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

async function directSearchBaidu(browser, imagePath){
  const ret = { success:false, links:[], screenshot:'' };
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({width:1280, height:800});

    // 1) 先進入 image.baidu.com
    await page.goto('https://image.baidu.com/', {
      waitUntil:'domcontentloaded', 
      timeout:20000
    });

    // ★ goto後先截圖
    await saveDebugInfo(page, 'baidu_afterGoto');

    await page.waitForTimeout(2000);

    // 點相機
    const cameraBtn = await page.$('span.soutu-btn');
    if(cameraBtn) {
      await cameraBtn.click();
      await page.waitForTimeout(1000);
    }

    const fileInput = await page.waitForSelector('input#uploadImg, input[type=file]', {timeout:8000});
    await fileInput.uploadFile(imagePath);
    await page.waitForTimeout(4000);

    // (可選) 再次進入 image.baidu.com => 再次點相機 => ...
    await page.goto('https://image.baidu.com/', { waitUntil:'domcontentloaded', timeout:20000 });
    await page.waitForTimeout(2000);
    const cameraBtn2 = await page.$('span.soutu-btn');
    if(cameraBtn2) {
      await cameraBtn2.click();
      await page.waitForTimeout(1000);
    }
    const fileInput2 = await page.$('input#uploadImg, input[type=file]');
    if(fileInput2) {
      await fileInput2.uploadFile(imagePath);
      await page.waitForTimeout(3000);
    }

    // 再次截圖
    const shot2 = path.join(__dirname, `../../uploads/baidu_direct_2_${Date.now()}.png`);
    await page.screenshot({ path:shot2, fullPage:true }).catch(()=>{});
    ret.screenshot = shot2;

    let hrefs = await page.$$eval('a', as => as.map(a=> a.href));
    hrefs = hrefs.filter(x=> x && !x.includes('baidu.com'));
    ret.links = [...new Set(hrefs)].slice(0,5);
    ret.success = true;

  } catch(e){
    console.error('[directSearchBaidu] fail =>', e);
    if(page) await saveDebugInfo(page, 'baidu_error');
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

//============================================================//
// (3) Aggregator: iOS / Android / Desktop - ginifab + fallback
//    (★ 需搭配 tryCloseAd, tryGinifabUploadLocal_iOS/Android/Desktop 等邏輯)
//============================================================//

/** 假設在 aggregatorSearchGinifab 需要關廣告/彈窗 */
async function tryCloseAd(page){
  try {
    await page.waitForTimeout(2000);
    const adCloseBtn = await page.$('.adCloseBtn, .close, button.ad-close');
    if(adCloseBtn){
      await adCloseBtn.click();
      await page.waitForTimeout(1000);
      console.log('[tryCloseAd] closed an ad popup');
      return true;
    }
  } catch(err){
    console.warn('[tryCloseAd] fail =>', err);
  }
  return false;
}

/** 
 * iOS/Android/Desktop 模擬上傳 
 * (各版本若找不到對應DOM即回傳false) 
 */
async function tryGinifabUploadLocal_iOS(page, localImagePath){
  console.log('[tryGinifabUploadLocal_iOS] Start iOS flow...');
  try {
    // 先關廣告
    await tryCloseAd(page);

    const [linkiOS] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if(!linkiOS) throw new Error('no "上傳本機圖片" link for iOS flow');
    await linkiOS.click();
    await page.waitForTimeout(1000);

    const [chooseFileBtn] = await page.$x("//a[contains(text(),'選擇檔案') or contains(text(),'挑選檔案')]");
    if(!chooseFileBtn) throw new Error('no "選擇檔案" link for iOS flow');
    await chooseFileBtn.click();
    await page.waitForTimeout(1000);

    const [photoBtn] = await page.$x("//a[contains(text(),'照片圖庫') or contains(text(),'相簿') or contains(text(),'Photo Library')]");
    if(!photoBtn) throw new Error('no "照片圖庫/相簿/Photo Library" link for iOS flow');
    await photoBtn.click();
    await page.waitForTimeout(1500);

    const [finishBtn] = await page.$x("//a[contains(text(),'完成') or contains(text(),'Done') or contains(text(),'OK')]");
    if(finishBtn){
      await finishBtn.click();
      await page.waitForTimeout(800);
    }

    const fileInput = await page.$('input[type=file]');
    if(!fileInput) throw new Error('no fileInput in iOS flow');
    await fileInput.uploadFile(localImagePath);
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal_iOS] success');
    return true;
  } catch(e){
    console.warn('[tryGinifabUploadLocal_iOS] fail =>', e.message);
    return false;
  }
}

async function tryGinifabUploadLocal_Android(page, localImagePath){
  console.log('[tryGinifabUploadLocal_Android] Start Android flow...');
  try {
    await tryCloseAd(page);

    const [linkAndroid] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if(!linkAndroid) throw new Error('no "上傳本機圖片" link for Android flow');
    await linkAndroid.click();
    await page.waitForTimeout(1000);

    const [chooseFileBtn] = await page.$x("//a[contains(text(),'選擇檔案') or contains(text(),'挑選檔案')]");
    if(!chooseFileBtn) throw new Error('no "選擇檔案" link for Android flow');
    await chooseFileBtn.click();
    await page.waitForTimeout(1000);

    const fileInput = await page.$('input[type=file]');
    if(!fileInput) throw new Error('no fileInput in Android flow');
    await fileInput.uploadFile(localImagePath);
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal_Android] success');
    return true;
  } catch(e){
    console.warn('[tryGinifabUploadLocal_Android] fail =>', e.message);
    return false;
  }
}

async function tryGinifabUploadLocal_Desktop(page, localImagePath){
  console.log('[tryGinifabUploadLocal_Desktop] Start Desktop flow...');
  try {
    await tryCloseAd(page);

    const [linkDesktop] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'Upload from PC')]");
    if(!linkDesktop) throw new Error('no "上傳本機圖片" link for Desktop flow');
    await linkDesktop.click();
    await page.waitForTimeout(1000);

    const fileInput = await page.$('input[type=file]');
    if(!fileInput) throw new Error('no fileInput in Desktop flow');
    await fileInput.uploadFile(localImagePath);
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal_Desktop] success');
    return true;
  } catch(e){
    console.warn('[tryGinifabUploadLocal_Desktop] fail =>', e.message);
    return false;
  }
}

/**
 * 三合一 => iOS -> Android -> Desktop
 * 只要一種成功就 return true
 */
async function tryGinifabUploadLocalAllFlow(page, localImagePath){
  if(await tryGinifabUploadLocal_iOS(page, localImagePath)) return true;
  if(await tryGinifabUploadLocal_Android(page, localImagePath)) return true;
  if(await tryGinifabUploadLocal_Desktop(page, localImagePath)) return true;
  return false;
}

//============================================================//
// aggregatorSearchGinifab(…) -- 參考 protect.js 版本
//============================================================//
async function aggregatorSearchGinifab(browser, localImagePath, publicImageUrl){
  // 這裡示範「完整 aggregator」，若您已有部署可整合
  // 僅示範加上 try-catch + saveDebugInfo
  const ret = {
    bing:   { success:false, links:[] },
    tineye: { success:false, links:[] },
    baidu:  { success:false, links:[] }
  };

  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 });
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'domcontentloaded',
      timeout:20000
    });

    await saveDebugInfo(page, 'ginifab_afterGoto');
    await page.waitForTimeout(2000);

    // 1) 先嘗試 iOS->Android->Desktop
    let successLocal = await tryGinifabUploadLocalAllFlow(page, localImagePath);
    if(!successLocal){
      // fallback 既有的 tryGinifabUploadLocal
      console.log('[aggregator] allFlow fail => fallback tryGinifabUploadLocal...');
      successLocal = await tryGinifabUploadLocal(page, localImagePath);
    }

    // 2) 若本機失敗 => try 指定圖片網址
    if(!successLocal){
      console.log('[aggregator] local fail => try url =>', publicImageUrl);
      await tryCloseAd(page);
      successLocal = await tryGinifabWithUrl(page, publicImageUrl);
    }

    // 3) 若仍失敗 => aggregator fail (可再做 google fallback)
    if(!successLocal){
      console.warn('[aggregator] all local/url fail => return ret');
      await saveDebugInfo(page, 'ginifab_fail');
      return ret;
    }

    // === 如果成功上傳 => 順序點 Bing / TinEye / Baidu
    const engines = [
      { key:'bing', label:['Bing','微軟必應'] },
      { key:'tineye', label:['TinEye','錫眼睛'] },
      { key:'baidu', label:['Baidu','百度'] }
    ];
    for(const eng of engines){
      try {
        // 監聽新tab
        const newTab = new Promise(resolve => {
          browser.once('targetcreated', async t => {
            const p = await t.page();
            resolve(p);
          });
        });
        // 找到對應按鈕
        await page.evaluate(engineLabels => {
          const as = [...document.querySelectorAll('a')];
          for(const lb of engineLabels){
            const found = as.find(a => a.innerText.includes(lb));
            if(found){ found.click(); return; }
          }
        }, eng.label);

        // 等新視窗
        const popup = await newTab;
        await popup.waitForTimeout(3000);

        // 截圖
        await saveDebugInfo(popup, `agg_${eng.key}_popup`);

        let hrefs = await popup.$$eval('a', as => as.map(a => a.href));
        hrefs = hrefs.filter(x =>
          x && !x.includes('ginifab') &&
          !x.includes('bing.com') &&
          !x.includes('tineye.com') &&
          !x.includes('baidu.com')
        );
        ret[eng.key].links = hrefs.slice(0,5);
        ret[eng.key].success = (ret[eng.key].links.length>0);

        await popup.close();
      } catch(subErr){
        console.error(`[aggregatorSearchGinifab][${eng.key}] fail =>`, subErr);
        await saveDebugInfo(page, `agg_${eng.key}_error`);
      }
    }

  } catch(e){
    console.error('[aggregatorSearchGinifab] main catch =>', e);
    if(page) await saveDebugInfo(page, 'aggregatorSearchGinifab_error');
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

/** 
 * 需搭配 tryGinifabWithUrl 
*/
async function tryGinifabWithUrl(page, publicImageUrl){
  try {
    await page.waitForTimeout(1000);
    // 點「指定圖片網址」
    const clicked = await page.evaluate(() => {
      const el = [...document.querySelectorAll('a')]
        .find(a => a.innerText.includes('指定圖片網址'));
      if(el){ el.click(); return true; }
      return false;
    });
    if(!clicked) return false;

    await page.waitForSelector('input[type=text]', { timeout:5000 });
    await page.type('input[type=text]', publicImageUrl, { delay:50 });
    await page.waitForTimeout(1000);
    console.log('[tryGinifabWithUrl] typed =>', publicImageUrl);
    return true;
  } catch(e){
    console.warn('[tryGinifabWithUrl] fail =>', e.message);
    return false;
  }
}

//==================================================//
// (4) doSearchEngines: 主入口, fallback direct if aggregator fails
//==================================================//
async function doSearchEngines(imagePath, aggregatorFirst, aggregatorImageUrl){
  console.log('[doSearchEngines] => aggregatorFirst=', aggregatorFirst, ' aggregatorImageUrl=', aggregatorImageUrl);
  const final = {
    bing: {success:false, links:[]},
    tineye: {success:false, links:[]},
    baidu: {success:false, links:[]}
  };

  if(aggregatorFirst && aggregatorImageUrl){
    let browser;
    try {
      browser = await puppeteerExtra.launch({
        headless:true,
        args:['--no-sandbox','--disable-setuid-sandbox']
      });
      const aggRes = await aggregatorSearchGinifab(browser, imagePath, aggregatorImageUrl);
      const total = aggRes.bing.links.length 
                  + aggRes.tineye.links.length
                  + aggRes.baidu.links.length;
      if(total > 0){
        console.log('[doSearchEngines] aggregator success =>', aggRes);
        final.bing   = { success: true, links: aggRes.bing.links };
        final.tineye = { success: true, links: aggRes.tineye.links };
        final.baidu  = { success: true, links: aggRes.baidu.links };
      } else {
        console.log('[doSearchEngines] aggregator fail => fallback direct');
        const fb = await fallbackDirectEngines(imagePath);
        final.bing   = { success: fb.bing.length>0,   links: fb.bing };
        final.tineye = { success: fb.tineye.length>0, links: fb.tineye };
        final.baidu  = { success: fb.baidu.length>0,  links: fb.baidu };
      }
    } catch(e){
      console.error('[doSearchEngines aggregatorFirst catch]', e);
      if(browser){
        await saveDebugInfo(await browser.newPage().catch(()=>null), 'doSearchEngines_aggError');
      }
      // aggregator掛了 => fallback direct
      const fb = await fallbackDirectEngines(imagePath);
      final.bing   = { success: fb.bing.length>0,   links: fb.bing };
      final.tineye = { success: fb.tineye.length>0, links: fb.tineye };
      final.baidu  = { success: fb.baidu.length>0,  links: fb.baidu };
    } finally {
      if(browser) await browser.close().catch(()=>{});
    }
  } else {
    // 純 direct
    console.log('[doSearchEngines] aggregatorFirst=false => direct only');
    const fb = await fallbackDirectEngines(imagePath);
    final.bing   = { success: fb.bing.length>0,   links: fb.bing };
    final.tineye = { success: fb.tineye.length>0, links: fb.tineye };
    final.baidu  = { success: fb.baidu.length>0,  links: fb.baidu };
  }

  return final;
}

/**
 * fallbackDirectEngines
 * 若 aggregator失敗或沒開啟 => 同時抓 Bing/TinEye/Baidu
 */
async function fallbackDirectEngines(imagePath){
  const final = { bing:[], tineye:[], baidu:[] };
  let browser;
  try {
    browser = await puppeteerExtra.launch({
      headless:true,
      args:['--no-sandbox','--disable-setuid-sandbox']
    });

    console.log('[fallbackDirectEngines] started...');
    const [rBing, rTine, rBaidu] = await Promise.all([
      directSearchBing(browser, imagePath),
      directSearchTinEye(browser, imagePath),
      directSearchBaidu(browser, imagePath)
    ]);
    final.bing   = rBing.links;
    final.tineye = rTine.links;
    final.baidu  = rBaidu.links;
    console.log('[fallbackDirectEngines] done =>', final);
  } catch(e){
    console.error('[fallbackDirectEngines] error =>', e);
  } finally {
    if(browser) await browser.close().catch(()=>{});
  }
  return final;
}

//-------------------------------------------------//
// (5) module.exports
//-------------------------------------------------//
module.exports = {
  // 原本的 directSearchBing / directSearchTinEye / directSearchBaidu
  directSearchBing,
  directSearchTinEye,
  directSearchBaidu,

  // 新增/整合: aggregatorSearchGinifab, doSearchEngines
  aggregatorSearchGinifab,
  doSearchEngines
};
