// express/utils/doSearchEngines.js

const path = require('path');
const puppeteerExtra = require('./puppeteerExtra');

//============================//
// 1) Direct Engines (原封不動)
//============================//

// Bing
async function directSearchBing(browser, imagePath){
  const ret = { success:false, links:[], screenshot:'' };
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 });
    await page.goto('https://www.bing.com/images', { waitUntil:'domcontentloaded', timeout:20000 });
    await page.waitForTimeout(2000);

    // 可能 Bing 介面變動，要檢查 #sb_sbi 或攝影機icon
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser({ timeout:10000 }),
      page.click('#sb_sbi').catch(()=>{}) // 攝影機 icon
    ]);
    await fileChooser.accept([imagePath]);
    await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
    await page.waitForTimeout(3000);

    // 截圖(可省略)
    const shot = path.join(__dirname, `../../uploads/bing_direct_${Date.now()}.png`);
    await page.screenshot({ path:shot, fullPage:true }).catch(()=>{});
    ret.screenshot = shot;

    let hrefs = await page.$$eval('a', as=> as.map(a=>a.href));
    hrefs = hrefs.filter(h=> h && !h.includes('bing.com'));
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

    // 點相機或 .soutu-btn
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


//=====================================//
// 2) Aggregator: Ginifab + Google備援
//=====================================//

/** 嘗試關閉廣告(如有) */
async function tryCloseAd(page){
  try {
    await page.waitForTimeout(2000);
    // 例如：.adCloseBtn
    const closeBtn = await page.$('.adCloseBtn');
    if(closeBtn){
      await closeBtn.click();
      await page.waitForTimeout(1000);
      console.log('[tryCloseAd] ad closed');
      return true;
    }
  } catch(e){
    console.warn('[tryCloseAd] no ad or error =>', e);
  }
  return false;
}

/** 在 ginifab 頁面嘗試「上傳本機圖片」 */
async function tryGinifabUploadLocal(page, localImagePath) {
  try {
    // 可能需要點擊「上傳本機圖片」按鈕
    // 假設文字是「上傳本機圖片」
    const [uploadLink] = await page.$x("//a[contains(text(),'上傳本機圖片')]");
    if(uploadLink){
      await uploadLink.click();
      await page.waitForTimeout(1000);
    }

    // 找 input[type=file]
    const fileInput = await page.waitForSelector('input[type=file]', { timeout:5000 });
    await fileInput.uploadFile(localImagePath);

    // 等2秒看是否成功
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

    // 點「指定圖片網址」
    const foundLink = await page.evaluate(()=>{
      const link = [...document.querySelectorAll('a')]
        .find(a => a.innerText.includes('指定圖片網址'));
      if(link){ link.click(); return true; }
      return false;
    });
    if(!foundLink) {
      console.warn('[tryGinifabWithUrl] can not find link for URL');
      return false;
    }

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

/** google fallback => 搜尋 "圖搜引擎" => 進 ginifab */
async function gotoGinifabViaGoogle(page, publicImageUrl){
  try {
    await page.goto('https://www.google.com', { waitUntil:'domcontentloaded', timeout:20000 });
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
    if(!target){
      console.warn('[gotoGinifabViaGoogle] no ginifab link found');
      return false;
    }

    await page.goto(target, { waitUntil:'domcontentloaded', timeout:20000 });
    await page.waitForTimeout(2000);

    // 不在這裡直接上傳, 只先回傳 true
    return true;
  } catch(e){
    console.error('[gotoGinifabViaGoogle] error =>', e);
    return false;
  }
}

/**
 * aggregatorSearchGinifab:
 *  1) 打開 ginifab
 *  2) 先嘗試本機上傳 -> 若失敗 -> 指定圖片網址
 *  3) 都失敗 -> google fallback -> 再試一次
 *  4) 成功 => 順序點 Bing/TinEye/Baidu
 */
async function aggregatorSearchGinifab(browser, localImagePath, publicImageUrl){
  const ret = {
    bing:   { success:false, links:[], screenshot:'' },
    tineye: { success:false, links:[], screenshot:'' },
    baidu:  { success:false, links:[], screenshot:'' }
  };

  let page;
  try {
    // 1) 打開 ginifab
    page = await browser.newPage();
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'domcontentloaded', timeout:20000
    });
    await page.waitForTimeout(2000);

    // 2) 先嘗試本機上傳
    let ok = await tryGinifabUploadLocal(page, localImagePath);
    if(!ok){
      console.log('[aggregatorSearchGinifab] local upload fail => try url...');
      ok = await tryGinifabWithUrl(page, publicImageUrl);
    }

    // 3) 若仍失敗 => google fallback
    if(!ok){
      console.warn('[aggregatorSearchGinifab] local+url both fail => google fallback...');
      await page.close().catch(()=>{});
      page = null;

      const newPage = await browser.newPage();
      const googleOk = await gotoGinifabViaGoogle(newPage, publicImageUrl);
      if(!googleOk){
        console.warn('[aggregatorSearchGinifab] google also fail => stop aggregator');
        await newPage.close().catch(()=>{});
        return ret;
      } else {
        page = newPage;
        // google 進 ginifab 後, 再嘗試 local / url
        let ok2 = await tryGinifabUploadLocal(page, localImagePath);
        if(!ok2){
          ok2 = await tryGinifabWithUrl(page, publicImageUrl);
        }
        if(!ok2){
          console.warn('[aggregatorSearchGinifab] still fail => give up aggregator');
          await page.close().catch(()=>{});
          return ret;
        }
      }
    }

    // 4) 成功 => 依序點 Bing/TinEye/Baidu
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

        const popup = await newTab;
        await popup.waitForTimeout(3000);

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
      } catch(subErr){
        console.error(`[Ginifab aggregator sub-engine fail => ${eng.key}]`, subErr);
      }
    }

  } catch(e){
    console.error('[aggregatorSearchGinifab fail]', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }

  return ret;
}


//==========================================//
// 3) doSearchEngines - 整合 aggregator + direct
//==========================================//

/**
 * aggregatorFirst=true => 先 aggregator => 若失敗再 direct
 * aggregatorFirst=false => 直接走 direct
 */
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
      // 1) aggregator => ginifab
      const aggRes = await aggregatorSearchGinifab(browser, imagePath, aggregatorImageUrl);
      const total = aggRes.bing.links.length + aggRes.tineye.links.length + aggRes.baidu.links.length;
      if(total > 0){
        final = aggRes; // aggregator 成功
      } else {
        // aggregator 失敗 => fallback direct
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
      // 2) 完全 direct
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


//=====================//
// 4) module exports
//=====================//
module.exports = {
  directSearchBing,
  directSearchTinEye,
  directSearchBaidu,
  aggregatorSearchGinifab,
  doSearchEngines
};
