// express/utils/doSearchEngines.js

const path = require('path');
const puppeteerExtra = require('./puppeteerExtra');

//--------------------------------------------------
// 1) Direct Engines (Bing, TinEye, Baidu) - 原封不動
//--------------------------------------------------

// Bing
async function directSearchBing(browser, imagePath){
  const ret = { success:false, links:[], screenshot:'' };
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 });
    await page.goto('https://www.bing.com/images', { waitUntil:'domcontentloaded', timeout:20000 });
    await page.waitForTimeout(2000);

    // 可能 Bing 介面變動，要檢查 sb_sbi or .camera
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser({ timeout:10000 }),
      page.click('#sb_sbi').catch(()=>{}) // 攝影機 icon
    ]);
    await fileChooser.accept([imagePath]);
    await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
    await page.waitForTimeout(3000);

    const shot = path.join(__dirname, `../../uploads/bing_direct_${Date.now()}.png`);
    await page.screenshot({ path:shot, fullPage:true }).catch(()=>{});
    ret.screenshot = shot;

    let hrefs = await page.$$eval('a', as => as.map(a=> a.href));
    hrefs = hrefs.filter(h => h && !h.includes('bing.com'));
    ret.links = [...new Set(hrefs)].slice(0,5);
    ret.success = true;
  } catch(e){
    console.error('[directSearchBing] fail =>', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

// TinEye
async function directSearchTinEye(browser, imagePath){
  const ret = { success:false, links:[], screenshot:'' };
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://tineye.com/', { waitUntil:'domcontentloaded', timeout:20000 });
    await page.waitForTimeout(1500);

    const fileInput = await page.waitForSelector('input[type=file]', { timeout:8000 });
    await fileInput.uploadFile(imagePath);
    await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
    await page.waitForTimeout(3000);

    const shot = path.join(__dirname, `../../uploads/tineye_direct_${Date.now()}.png`);
    await page.screenshot({ path:shot, fullPage:true }).catch(()=>{});
    ret.screenshot = shot;

    let hrefs = await page.$$eval('a', as=> as.map(a=> a.href));
    hrefs = hrefs.filter(h=>h && !h.includes('tineye.com'));
    ret.links = [...new Set(hrefs)].slice(0,5);
    ret.success = true;
  } catch(e){
    console.error('[directSearchTinEye] fail =>', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

// Baidu
async function directSearchBaidu(browser, imagePath){
  const ret = { success:false, links:[], screenshot:'' };
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({width:1280, height:800});
    await page.goto('https://image.baidu.com/', {waitUntil:'domcontentloaded', timeout:20000});
    await page.waitForTimeout(2000);

    // 點相機 or soutu-btn
    const cameraBtn = await page.$('span.soutu-btn');
    if(cameraBtn) await cameraBtn.click();
    await page.waitForTimeout(1000);

    // file input
    const fileInput = await page.waitForSelector('input#uploadImg, input[type=file]', {timeout:8000});
    await fileInput.uploadFile(imagePath);
    await page.waitForTimeout(5000);

    const shot = path.join(__dirname, `../../uploads/baidu_direct_${Date.now()}.png`);
    await page.screenshot({ path:shot, fullPage:true }).catch(()=>{});
    ret.screenshot = shot;

    let hrefs = await page.$$eval('a', as=> as.map(a=> a.href));
    hrefs = hrefs.filter(h=>h && !h.includes('baidu.com'));
    ret.links = [...new Set(hrefs)].slice(0,5);
    ret.success = true;
  } catch(e){
    console.error('[directSearchBaidu] fail =>', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

//--------------------------------------------------
// 2) Aggregator Ginifab (多步驟) - 新增/覆蓋
//--------------------------------------------------

/** 嘗試在 ginifab 頁面尋找並關閉彈窗廣告(如有) */
async function tryCloseAd(page){
  try {
    // 範例：假設廣告的關閉按鈕是 .adCloseBtn
    // 實務需視 ginifab 實際 DOM 做調整
    await page.waitForTimeout(2000);
    const closeBtn = await page.$('.adCloseBtn');
    if(closeBtn){
      await closeBtn.click();
      await page.waitForTimeout(1000);
      console.log('[tryCloseAd] clicked ad close btn');
      return true;
    }
  } catch(e){
    console.warn('[tryCloseAd] no ad to close or error =>', e);
  }
  return false;
}

/**
 * 在 ginifab 頁面嘗試「本機檔案上傳」
 * 若成功 -> true, 否則 false
 */
async function tryGinifabUploadLocal(page, localImagePath){
  try {
    // 可能需要先點 "上傳本機圖片" 的按鈕(根據實際 DOM)
    // 以下示例：找文字 "上傳本機圖片"
    const [link] = await page.$x("//a[contains(text(),'上傳本機圖片')]");
    if(link){
      await link.click();
      await page.waitForTimeout(1000);
    }

    // 找到 input[type=file]
    const fileInput = await page.waitForSelector('input[type=file]', { timeout:5000 });
    await fileInput.uploadFile(localImagePath);

    // 等幾秒看是否上傳完成
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal] success =>', localImagePath);
    return true;
  } catch(e){
    console.warn('[tryGinifabUploadLocal] fail =>', e.message);
    return false;
  }
}

/** 在 ginifab 頁面嘗試「指定圖片網址」 */
async function tryGinifabWithUrl(page, publicImageUrl){
  try {
    await tryCloseAd(page);
    await page.waitForTimeout(1000);

    // 點擊 "指定圖片網址"
    const linkFound = await page.evaluate(()=>{
      const link = [...document.querySelectorAll('a')]
        .find(a => a.innerText.includes('指定圖片網址'));
      if(link) { link.click(); return true; }
      return false;
    });
    if(!linkFound){
      console.warn('[tryGinifabWithUrl] link not found');
      return false;
    }

    // 輸入 URL
    await page.waitForSelector('input[type=text]', { timeout:5000 });
    await page.type('input[type=text]', publicImageUrl, { delay:50 });
    await page.waitForTimeout(1000);

    console.log('[tryGinifabWithUrl] typed =>', publicImageUrl);
    return true;
  } catch(e){
    console.error('[tryGinifabWithUrl error]', e);
    return false;
  }
}

/** 在 ginifab 搜尋頁面失敗後，改走 google => 搜尋 ginifab => 再進去 */
async function gotoGinifabViaGoogle(page, publicImageUrl){
  try {
    await page.goto('https://www.google.com', {
      waitUntil:'domcontentloaded', timeout:20000
    });
    await page.waitForTimeout(2000);

    const q = await page.$('input[name="q"]');
    if(!q){
      console.warn('[gotoGinifabViaGoogle] google search box not found');
      return false;
    }
    await q.type('圖搜引擎', { delay:50 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    const links = await page.$$eval('a', as => as.map(a => a.href || ''));
    const target = links.find(h => h.includes('ginifab.com.tw'));
    if(!target) {
      console.warn('[gotoGinifabViaGoogle] no ginifab link found');
      return false;
    }

    await page.goto(target, { waitUntil:'domcontentloaded', timeout:20000 });
    await page.waitForTimeout(2000);

    // 再嘗試本機或網址 => 這裡只回傳 true，讓外層去決定
    return true;
  } catch(e){
    console.error('[gotoGinifabViaGoogle error]', e);
    return false;
  }
}

/**
 * aggregatorSearchGinifab:
 *  1. 打開 ginifab
 *  2. 先嘗試本機上傳 -> 失敗則改用指定圖片網址
 *  3. 若都失敗 => google fallback => 再嘗試
 *  4. 成功後，順序點擊 Bing/TinEye/Baidu
 */
async function aggregatorSearchGinifab(browser, localImagePath, publicImageUrl){
  const ret = {
    bing:   { success:false, links:[], screenshot:'' },
    tineye: { success:false, links:[], screenshot:'' },
    baidu:  { success:false, links:[], screenshot:'' }
  };

  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'domcontentloaded',
      timeout:20000
    });
    await page.waitForTimeout(2000);

    // 先本機檔案上傳
    let localOk = await tryGinifabUploadLocal(page, localImagePath);
    // 若失敗 => 用指定圖片網址
    if(!localOk){
      console.log('[aggregatorSearchGinifab] local upload fail => try URL...');
      localOk = await tryGinifabWithUrl(page, publicImageUrl);
    }

    // 若還是失敗 => 關頁 => google => 再進 ginifab
    if(!localOk){
      console.warn('[aggregatorSearchGinifab] local+URL both fail => goto google fallback...');
      await page.close().catch(()=>{});
      page = null;

      const newPage = await browser.newPage();
      const googleOk = await gotoGinifabViaGoogle(newPage, publicImageUrl);
      if(!googleOk) {
        console.warn('[aggregatorSearchGinifab] google path also fail => give up aggregator');
        await newPage.close().catch(()=>{});
        return ret;
      } else {
        page = newPage;
        // 這裡可再嘗試 local / url
        let retryOk = await tryGinifabUploadLocal(page, localImagePath);
        if(!retryOk){
          retryOk = await tryGinifabWithUrl(page, publicImageUrl);
        }
        if(!retryOk) {
          console.warn('[aggregatorSearchGinifab] still fail even after google => give up');
          await page.close().catch(()=>{});
          return ret;
        }
      }
    }

    // 若能到這，表示已成功進入 ginifab 並可操作 => 逐一點 Bing / TinEye / Baidu
    const engList = [
      { key:'bing',   label:['微軟必應','Bing'] },
      { key:'tineye', label:['錫眼睛','TinEye'] },
      { key:'baidu',  label:['百度','Baidu'] }
    ];
    for(const eng of engList){
      try {
        const newTab = new Promise(resolve=>{
          browser.once('targetcreated', async t => resolve(await t.page()));
        });
        await page.evaluate((labels)=>{
          const as= [...document.querySelectorAll('a')];
          for(const lab of labels){
            const found= as.find(x=> x.innerText.includes(lab));
            if(found){ found.click(); return; }
          }
        }, eng.label);

        const popup= await newTab;
        await popup.waitForTimeout(3000);

        // 可擷取 screenshot
        const shotPath = path.join(__dirname, `../../uploads/agg_${eng.key}_${Date.now()}.png`);
        await popup.screenshot({ path:shotPath, fullPage:true }).catch(()=>{});
        ret[eng.key].screenshot = shotPath;

        let hrefs= await popup.$$eval('a', as=> as.map(a=> a.href));
        hrefs= hrefs.filter(h=>
          h && !h.includes('ginifab') &&
          !h.includes('bing.com') &&
          !h.includes('tineye.com') &&
          !h.includes('baidu.com')
        );
        ret[eng.key].links= hrefs.slice(0,5);
        ret[eng.key].success= ret[eng.key].links.length>0;
        await popup.close();
      } catch(eSub){
        console.error(`[Ginifab aggregator sub-engine fail => ${eng.key}]`, eSub);
      }
    }

  } catch(e){
    console.error('[aggregatorSearchGinifab fail]', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}


//--------------------------------------------------
// 3) 主函式 doSearchEngines - 保持結構, 只增/改 aggregator 呼叫
//--------------------------------------------------

/**
 * aggregatorFirst=true => 先 aggregator => 若失敗再 direct
 * aggregatorFirst=false => 全 direct
 */
async function doSearchEngines(imagePath, aggregatorFirst, aggregatorImageUrl='') {
  const puppeteer = require('./puppeteerExtra'); // 也可在檔案最上頭 import
  const browser = await puppeteer.launch({
    headless:true,
    args:['--no-sandbox','--disable-setuid-sandbox']
  });

  // 預設回傳
  let final = {
    bing:{ success:false, links:[], screenshot:'' },
    tineye:{ success:false, links:[], screenshot:'' },
    baidu:{ success:false, links:[], screenshot:'' }
  };

  try {
    if(aggregatorFirst && aggregatorImageUrl){
      // aggregator path
      const aggRes = await aggregatorSearchGinifab(browser, imagePath, aggregatorImageUrl);
      // 判斷 aggregator 是否成功
      const totalLinks = aggRes.bing.links.length + aggRes.tineye.links.length + aggRes.baidu.links.length;
      if(totalLinks > 0) {
        final = aggRes; // aggregator 就成功了
      } else {
        // aggregator fail => fallback direct
        console.log('[doSearchEngines] aggregator fail => fallback direct...');
        const [rBing, rTineye, rBaidu] = await Promise.all([
          directSearchBing(browser, imagePath),
          directSearchTinEye(browser, imagePath),
          directSearchBaidu(browser, imagePath)
        ]);
        final.bing = rBing;
        final.tineye = rTineye;
        final.baidu = rBaidu;
      }
    } else {
      // purely direct
      const [rBing, rTineye, rBaidu] = await Promise.all([
        directSearchBing(browser, imagePath),
        directSearchTinEye(browser, imagePath),
        directSearchBaidu(browser, imagePath)
      ]);
      final.bing = rBing;
      final.tineye = rTineye;
      final.baidu = rBaidu;
    }
  } catch(e){
    console.error('[doSearchEngines error]', e);
  } finally {
    await browser.close();
  }

  return final;
}

//--------------------------------------------------
// 4) 匯出
//--------------------------------------------------
module.exports = {
  directSearchBing,
  directSearchTinEye,
  directSearchBaidu,
  aggregatorSearchGinifab,
  doSearchEngines
};
