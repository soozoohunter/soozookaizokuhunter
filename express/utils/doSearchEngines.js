// express/utils/doSearchEngines.js

const path = require('path');
const puppeteerExtra = require('./puppeteerExtra');

//==================================================//
// 1) Direct Engines: Bing / TinEye / Baidu (保留基礎邏輯)
//==================================================//

/**
 * Bing: 進入 bing.com/images => 點攝影機(#sb_sbi) => waitForFileChooser => upload
 */
async function directSearchBing(browser, imagePath){
  const ret = { success:false, links:[], screenshot:'' };
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 });
    await page.goto('https://www.bing.com/images', { waitUntil:'domcontentloaded', timeout:20000 });
    await page.waitForTimeout(2000);

    const [fc] = await Promise.all([
      page.waitForFileChooser({ timeout:10000 }),
      page.click('#sb_sbi').catch(()=>{}) // 攝影機 icon
    ]);
    await fc.accept([imagePath]);
    // 等待結果頁
    await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
    await page.waitForTimeout(3000);

    // 截圖
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
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

/**
 * TinEye: 進入 tineye.com => input[type=file] => uploadFile
 */
async function directSearchTinEye(browser, imagePath){
  const ret = { success:false, links:[], screenshot:'' };
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://tineye.com/', { waitUntil:'domcontentloaded', timeout:20000 });
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
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

/**
 * Baidu: 有您特別提到「再次進入 baidu 圖搜頁面後再次點選...」
 * 此示範: 
 *   1) 進入 image.baidu.com => 點相機(.soutu-btn)
 *   2) uploadFile => 等結果
 *   3) (可選) 再次進入 image.baidu.com => 再次點相機 => ...
 */
async function directSearchBaidu(browser, imagePath){
  const ret = { success:false, links:[], screenshot:'' };
  let page;
  try {
    // 第一次
    page = await browser.newPage();
    await page.setViewport({width:1280, height:800});
    await page.goto('https://image.baidu.com/', { waitUntil:'domcontentloaded', timeout:20000 });
    await page.waitForTimeout(2000);

    // 點相機
    const cameraBtn = await page.$('span.soutu-btn');
    if(cameraBtn) {
      await cameraBtn.click();
      await page.waitForTimeout(1000);
    }

    // 上傳檔案
    const fileInput = await page.waitForSelector('input#uploadImg, input[type=file]', {timeout:8000});
    await fileInput.uploadFile(imagePath);
    await page.waitForTimeout(4000);

    // 截圖
    const shot1 = path.join(__dirname, `../../uploads/baidu_direct_1_${Date.now()}.png`);
    await page.screenshot({ path:shot1, fullPage:true }).catch(()=>{});

    // 這裡示範「再次」進入 image.baidu.com
    // 若您不需要可註解掉
    await page.goto('https://image.baidu.com/', { waitUntil:'domcontentloaded', timeout:20000 });
    await page.waitForTimeout(2000);
    const cameraBtn2 = await page.$('span.soutu-btn');
    if(cameraBtn2) {
      await cameraBtn2.click();
      await page.waitForTimeout(1000);
    }
    // 再傳一次
    const fileInput2 = await page.$('input#uploadImg, input[type=file]');
    if(fileInput2) {
      await fileInput2.uploadFile(imagePath);
      await page.waitForTimeout(3000);
    }

    // 最後截圖
    const shot2 = path.join(__dirname, `../../uploads/baidu_direct_2_${Date.now()}.png`);
    await page.screenshot({ path:shot2, fullPage:true }).catch(()=>{});
    ret.screenshot = shot2;

    // 收集連結 (排除含 baidu.com)
    let hrefs = await page.$$eval('a', as => as.map(a=> a.href));
    hrefs = hrefs.filter(x=> x && !x.includes('baidu.com'));
    ret.links = [...new Set(hrefs)].slice(0,5);
    ret.success = true;
  } catch(e){
    console.error('[directSearchBaidu] fail =>', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

//============================================================//
// 2) Aggregator: iOS / Android / Desktop - ginifab + fallback
//============================================================//

/** 關閉廣告 */
async function tryCloseAd(page){
  try {
    await page.waitForTimeout(2000);
    const closeBtn = await page.$('.adCloseBtn');
    if(closeBtn){
      await closeBtn.click();
      await page.waitForTimeout(1000);
      console.log('[tryCloseAd] ad closed');
      return true;
    }
  } catch(e){
    console.warn('[tryCloseAd] error =>', e);
  }
  return false;
}

/** 滑動後點擊 */
async function safeClick(page, el){
  if(!el) return;
  await page.evaluate(elem => {
    elem.scrollIntoView({ block:'center', inline:'center', behavior:'instant' });
  }, el);
  await el.click({ delay:100 });
}

/** 
 * iOS 流程：上傳本機圖片 => 選擇檔案 => 照片圖庫 => 完成 => input[type=file]
 */
async function tryGinifabUploadLocal_iOS(page, localImagePath){
  console.log('[tryGinifabUploadLocal_iOS] Start iOS-like flow...');
  try {
    await tryCloseAd(page);
    // 1) 上傳本機圖片
    const [uploadLink] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if(!uploadLink) throw new Error('No "上傳本機圖片" link for iOS flow');
    await safeClick(page, uploadLink);
    await page.waitForTimeout(1000);

    // 2) 選擇檔案
    const [chooseFileBtn] = await page.$x("//a[contains(text(),'選擇檔案') or contains(text(),'挑選檔案')]");
    if(!chooseFileBtn) throw new Error('No "選擇檔案" link for iOS flow');
    await safeClick(page, chooseFileBtn);
    await page.waitForTimeout(1000);

    // 3) 照片圖庫
    const [photoBtn] = await page.$x("//a[contains(text(),'照片圖庫') or contains(text(),'相簿') or contains(text(),'Photo Library')]");
    if(!photoBtn) throw new Error('No "照片圖庫/相簿/Photo Library" link for iOS flow');
    await safeClick(page, photoBtn);
    await page.waitForTimeout(2000);

    // 4) 完成
    const [finishBtn] = await page.$x("//a[contains(text(),'完成') or contains(text(),'Done') or contains(text(),'OK')]");
    if(finishBtn){
      await safeClick(page, finishBtn);
      await page.waitForTimeout(1000);
    }

    // 5) input[type=file]
    const fileInput = await page.$('input[type=file]');
    if(!fileInput) throw new Error('No input[type=file] for iOS flow');
    await safeClick(page, fileInput);
    await fileInput.uploadFile(localImagePath);

    await page.waitForTimeout(2000);
    console.log('[tryGinifabUploadLocal_iOS] success');
    return true;
  } catch(e){
    console.warn('[tryGinifabUploadLocal_iOS] fail =>', e.message);
    return false;
  }
}

/** 
 * Android 流程：上傳本機圖片 => 選擇檔案 => 直接彈出相簿 => (無完成) => input[type=file]
 */
async function tryGinifabUploadLocal_Android(page, localImagePath){
  console.log('[tryGinifabUploadLocal_Android] Start Android-like flow...');
  try {
    await tryCloseAd(page);
    // 1) 上傳本機圖片
    const [uploadLink] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if(!uploadLink) throw new Error('No "上傳本機圖片" link for Android flow');
    await safeClick(page, uploadLink);
    await page.waitForTimeout(1000);

    // 2) 選擇檔案
    const [chooseFileBtn] = await page.$x("//a[contains(text(),'選擇檔案') or contains(text(),'挑選檔案')]");
    if(!chooseFileBtn) throw new Error('No "選擇檔案" link for Android flow');
    await safeClick(page, chooseFileBtn);
    await page.waitForTimeout(2000);

    // (Android 多半系統會直接彈出相簿 / 檔案管理器, puppeteer 無法操作, 這裡只做網頁DOM層)
    // 3) input[type=file]
    const fileInput = await page.$('input[type=file]');
    if(!fileInput) throw new Error('No input[type=file] for Android flow');
    await safeClick(page, fileInput);
    await fileInput.uploadFile(localImagePath);

    await page.waitForTimeout(2000);
    console.log('[tryGinifabUploadLocal_Android] success');
    return true;
  } catch(e){
    console.warn('[tryGinifabUploadLocal_Android] fail =>', e.message);
    return false;
  }
}

/** 
 * Desktop 流程：上傳本機圖片 => input[type=file] 可能直接顯示 => 直接 uploadFile
 */
async function tryGinifabUploadLocal_Desktop(page, localImagePath){
  console.log('[tryGinifabUploadLocal_Desktop] Start Desktop-like flow...');
  try {
    await tryCloseAd(page);
    // 1) 上傳本機圖片
    const [uploadLink] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'Upload from PC')]");
    if(!uploadLink) throw new Error('No "上傳本機圖片" link for Desktop flow');
    await safeClick(page, uploadLink);
    await page.waitForTimeout(1000);

    // 2) input[type=file]
    const fileInput = await page.$('input[type=file]');
    if(!fileInput) throw new Error('No input[type=file] in Desktop flow');
    await safeClick(page, fileInput);
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
 * 針對 ginifab 做「本機上傳」的三合一函式：
 *  1) 先嘗試 iOS flow
 *  2) 若失敗 => Android flow
 *  3) 若再失敗 => Desktop flow
 *  (只要有一種成功就回傳 true)
 */
async function tryGinifabUploadLocal_AllInOne(page, localImagePath){
  console.log('[tryGinifabUploadLocal_AllInOne] Attempt iOS => Android => Desktop...');
  
  // iOS
  let ok = await tryGinifabUploadLocal_iOS(page, localImagePath);
  if(ok) return true;

  // Android
  ok = await tryGinifabUploadLocal_Android(page, localImagePath);
  if(ok) return true;

  // Desktop
  ok = await tryGinifabUploadLocal_Desktop(page, localImagePath);
  if(ok) return true;

  // 全部失敗
  return false;
}

// aggregatorSearchGinifab: 整合
async function aggregatorSearchGinifab(browser, localImagePath, publicImageUrl){
  const ret = { 
    bing:{ success:false, links:[], screenshot:'' }, 
    tineye:{ success:false, links:[], screenshot:'' }, 
    baidu:{ success:false, links:[], screenshot:'' }
  };
  let page;
  try {
    // 打開 ginifab
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    await page.setViewport({ width:1280, height:800 });

    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'domcontentloaded', timeout:20000
    });
    await page.waitForTimeout(2000);

    // 先嘗試 [iOS => Android => Desktop]
    let ok = await tryGinifabUploadLocal_AllInOne(page, localImagePath);
    if(!ok){
      console.log('[aggregatorSearchGinifab] local upload fail => try URL...');
      // 如果 local 全 fail => 指定圖片網址
      ok = await tryGinifabWithUrl(page, publicImageUrl);
    }

    // 如果還是失敗 => google fallback
    if(!ok){
      console.warn('[aggregatorSearchGinifab] local+URL both fail => goto google fallback...');
      await page.close().catch(()=>{});
      page=null;

      const newPage = await browser.newPage();
      await newPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      await newPage.setViewport({ width:1280, height:800 });

      // google => ginifab
      const googleOk = await gotoGinifabViaGoogle(newPage);
      if(!googleOk){
        console.warn('[aggregatorSearchGinifab] google also fail => aggregator stop');
        await newPage.close().catch(()=>{});
        return ret;
      }
      page = newPage;

      let ok2 = await tryGinifabUploadLocal_AllInOne(page, localImagePath);
      if(!ok2){
        ok2 = await tryGinifabWithUrl(page, publicImageUrl);
      }
      if(!ok2){
        console.warn('[aggregatorSearchGinifab] still fail => aggregator stop');
        await page.close().catch(()=>{});
        return ret;
      }
    }

    // 如果能跑到這 => 上傳成功 => 順序點 Bing/TinEye/Baidu
    const engList = [
      { key:'bing',   label:['微軟必應','Bing'] },
      { key:'tineye', label:['錫眼睛','TinEye'] },
      { key:'baidu',  label:['百度','Baidu'] }
    ];
    for(const eng of engList){
      try {
        // 監聽 newTab
        const newTab = new Promise(resolve => {
          browser.once('targetcreated', async t => resolve(await t.page()));
        });
        await page.evaluate(labels => {
          const as = [...document.querySelectorAll('a')];
          for(const lab of labels){
            const found = as.find(x => x.innerText.includes(lab));
            if(found) {
              found.scrollIntoView({behavior:'instant', block:'center', inline:'center'});
              found.click();
              return;
            }
          }
        }, eng.label);

        const popup = await newTab;
        await popup.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        await popup.setViewport({ width:1280, height:800 });
        await popup.waitForTimeout(3000);

        // 截圖
        const shot = path.join(__dirname, `../../uploads/agg_${eng.key}_${Date.now()}.png`);
        await popup.screenshot({ path:shot, fullPage:true }).catch(()=>{});
        ret[eng.key].screenshot = shot;

        let hrefs= await popup.$$eval('a', as => as.map(a=> a.href));
        hrefs= hrefs.filter(h=>
          h && !h.includes('ginifab') &&
          !h.includes('bing.com') &&
          !h.includes('tineye.com') &&
          !h.includes('baidu.com')
        );
        ret[eng.key].links = hrefs.slice(0,5);
        ret[eng.key].success = (ret[eng.key].links.length>0);

        await popup.close();
      } catch(subErr){
        console.error(`[aggregatorSearchGinifab => ${eng.key}]`, subErr);
      }
    }

  } catch(e){
    console.error('[aggregatorSearchGinifab error]', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

//==================================================//
// 3) doSearchEngines: 主入口, fallback direct if aggregator fails
//==================================================//
async function doSearchEngines(imagePath, aggregatorFirst, aggregatorImageUrl=''){
  const puppeteer = require('./puppeteerExtra');
  const browser = await puppeteer.launch({
    headless:true,
    args:['--no-sandbox','--disable-setuid-sandbox']
  });

  let final = {
    bing:{ success:false, links:[], screenshot:'' },
    tineye:{ success:false, links:[], screenshot:'' },
    baidu:{ success:false, links:[], screenshot:'' }
  };

  try {
    if(aggregatorFirst && aggregatorImageUrl){
      // 先 aggregator
      const aggRes = await aggregatorSearchGinifab(browser, imagePath, aggregatorImageUrl);
      const total = aggRes.bing.links.length 
                  + aggRes.tineye.links.length 
                  + aggRes.baidu.links.length;
      if(total>0){
        final = aggRes;
      } else {
        console.log('[doSearchEngines] aggregator fail => fallback direct');
        // direct
        const [rBing, rTine, rBaidu] = await Promise.all([
          directSearchBing(browser, imagePath),
          directSearchTinEye(browser, imagePath),
          directSearchBaidu(browser, imagePath)
        ]);
        final.bing   = rBing;
        final.tineye = rTine;
        final.baidu  = rBaidu;
      }
    } else {
      // 純 direct
      const [rBing, rTine, rBaidu] = await Promise.all([
        directSearchBing(browser, imagePath),
        directSearchTinEye(browser, imagePath),
        directSearchBaidu(browser, imagePath)
      ]);
      final.bing   = rBing;
      final.tineye = rTine;
      final.baidu  = rBaidu;
    }
  } catch(e){
    console.error('[doSearchEngines error]', e);
  } finally {
    await browser.close().catch(()=>{});
  }
  return final;
}

//-------------------------------------------------//
// 4) module.exports
//-------------------------------------------------//
module.exports = {
  directSearchBing,
  directSearchTinEye,
  directSearchBaidu,
  aggregatorSearchGinifab,
  doSearchEngines
};
