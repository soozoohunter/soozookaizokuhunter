// express/utils/doSearchEngines.js
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin= require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { tryCloseAd } = require('./closeAdHelper'); // 從 (A) 匯入
// 你也可依需求 require fallback helper

/**
 * tryClickUploadLocal, tryClickSpecifyImageUrl
 * 以示範方式寫在這，實際你也可拆去別的檔案
 */
async function tryClickUploadLocal(page, localFilePath){
  try {
    await tryCloseAd(page,2);

    const link = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if(link.length>0){
      await link[0].click();
      await page.waitForTimeout(1500);
    } else {
      console.warn('[tryClickUploadLocal] "上傳本機圖片" link not found');
      return false;
    }

    const fileInput = await page.$('input[type=file]');
    if(!fileInput){
      console.warn('[tryClickUploadLocal] input[type=file] not found');
      return false;
    }
    await fileInput.uploadFile(localFilePath);
    await page.waitForTimeout(2000);

    console.log('[tryClickUploadLocal] done =>', localFilePath);
    return true;
  } catch(e){
    console.error('[tryClickUploadLocal] error =>', e);
    return false;
  }
}

async function tryClickSpecifyImageUrl(page, publicImageUrl){
  try {
    await tryCloseAd(page,2);

    const link2 = await page.$x("//a[contains(text(),'指定圖片網址')]");
    if(link2.length>0){
      await link2[0].click();
      await page.waitForTimeout(1000);
    } else {
      console.warn('[tryClickSpecifyImageUrl] link not found => 指定圖片網址');
      return false;
    }

    const input = await page.waitForSelector('input[type=text]', { timeout:5000 });
    await input.type(publicImageUrl, { delay:50 });
    await page.waitForTimeout(1000);

    console.log('[tryClickSpecifyImageUrl] done =>', publicImageUrl);
    return true;
  } catch(e){
    console.error('[tryClickSpecifyImageUrl] error =>', e);
    return false;
  }
}

/** aggregatorSearchGinifabStrict */
async function aggregatorSearchGinifabStrict(localFilePath='', publicImageUrl='') {
  console.log('[aggregatorSearchGinifabStrict] => file=', localFilePath, ' url=', publicImageUrl);
  const results = { bing: [], tineye: [], baidu: [] };

  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args:['--no-sandbox','--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    );

    // 1) 前往 ginifab
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'domcontentloaded', timeout:30000
    });
    await page.waitForTimeout(2000);

    // 關閉廣告
    await tryCloseAd(page,2);

    // 2) 上傳 or 指定 URL
    let ok = false;
    if(localFilePath){
      ok = await tryClickUploadLocal(page, localFilePath);
      if(!ok && publicImageUrl){
        console.log('[aggregatorSearchGinifabStrict] local upload fail => try specify URL...');
        ok = await tryClickSpecifyImageUrl(page, publicImageUrl);
      }
    } else if(publicImageUrl){
      ok = await tryClickSpecifyImageUrl(page, publicImageUrl);
    }
    if(!ok){
      console.warn('[aggregatorSearchGinifabStrict] local+URL both fail => empty result');
      return results;
    }

    // 3) 順序點 Bing / TinEye / Baidu
    const engines = [
      { key:'bing',   label:['Bing','微軟必應'] },
      { key:'tineye', label:['TinEye','錫眼睛'] },
      { key:'baidu',  label:['Baidu','百度'] }
    ];
    for(const eng of engines){
      try {
        console.log(`[aggregatorSearchGinifabStrict] => click ${eng.key}`);
        const newTab = new Promise(resolve => {
          browser.once('targetcreated', async t => resolve(await t.page()));
        });
        // 點擊
        await page.evaluate(labels => {
          const as = [...document.querySelectorAll('a')];
          for(const lab of labels){
            const found = as.find(x=> x.innerText.includes(lab));
            if(found){
              found.click();
              return;
            }
          }
        }, eng.label);

        // popup
        const popup = await newTab;
        await popup.setViewport({ width:1280, height:800 });
        await popup.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
        );
        await popup.waitForTimeout(3000);

        // 再次關廣告
        await tryCloseAd(popup,2);

        // 若是 Baidu => 再做二階段上傳
        if(eng.key === 'baidu'){
          console.log('[aggregatorSearchGinifabStrict] Baidu => second step...');
          await tryCloseAd(popup,2);
          // const baifile = await popup.$('input[type=file]');
          // if(baifile) { await baifile.uploadFile(localFilePath); ...}
        }

        // 抓 popup 裡非 ginifab/bing/tineye/baidu
        let hrefs = await popup.$$eval('a', as => as.map(a => a.href));
        hrefs = hrefs.filter(l =>
          l && !l.includes('ginifab') &&
          !l.includes('bing.com') &&
          !l.includes('tineye.com') &&
          !l.includes('baidu.com')
        );
        results[eng.key] = [...new Set(hrefs)].slice(0,10);

        await popup.close();
        // 回到 ginifab 主頁面再關廣告
        await page.bringToFront();
        await tryCloseAd(page,2);

      } catch(eSub){
        console.error(`[aggregatorSearchGinifabStrict][${eng.key}] fail =>`, eSub);
      }
    }

  } catch(e){
    console.error('[aggregatorSearchGinifabStrict] error =>', e);
  } finally {
    if(page) await page.close().catch(()=>{});
    if(browser) await browser.close().catch(()=>{});
  }
  return results;
}

/** fallbackDirectEngines => Bing / TinEye / Baidu 各自直接上傳 */
async function fallbackDirectEngines(imagePath) {
  console.log('[fallbackDirectEngines] =>', imagePath);
  const results = { bing:[], tineye:[], baidu:[] };
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args:['--no-sandbox','--disable-setuid-sandbox']
    });

    // (1) Bing
    results.bing = await directSearchBing(browser, imagePath);
    // (2) TinEye
    results.tineye = await directSearchTinEye(browser, imagePath);
    // (3) Baidu
    results.baidu = await directSearchBaidu(browser, imagePath);

  } catch(e){
    console.error('[fallbackDirectEngines] error =>', e);
  } finally {
    if(browser) await browser.close().catch(()=>{});
  }
  return results;
}

// directSearchBing / directSearchTinEye / directSearchBaidu 省略，您可保留原本做法

async function doSearchEngines(localFilePath, aggregatorFirst=true, aggregatorImageUrl='') {
  console.log('[doSearchEngines] aggregatorFirst=', aggregatorFirst, ' aggregatorUrl=', aggregatorImageUrl);

  let aggregatorOK = false;
  let aggregatorRes = { bing:[], tineye:[], baidu:[] };

  if(aggregatorFirst){
    try {
      aggregatorRes = await aggregatorSearchGinifabStrict(localFilePath, aggregatorImageUrl);
      const total = aggregatorRes.bing.length
                  + aggregatorRes.tineye.length
                  + aggregatorRes.baidu.length;
      aggregatorOK = (total>0);
    } catch(e){
      console.error('[doSearchEngines][aggregator] error =>', e);
    }
  }

  if(!aggregatorOK){
    console.warn('[doSearchEngines] aggregator fail => fallback...');
    const fb = await fallbackDirectEngines(localFilePath);
    return {
      bing: fb.bing||[],
      tineye: fb.tineye||[],
      baidu: fb.baidu||[]
    };
  }
  return {
    bing: aggregatorRes.bing||[],
    tineye: aggregatorRes.tineye||[],
    baidu: aggregatorRes.baidu||[]
  };
}

module.exports = {
  doSearchEngines
};
