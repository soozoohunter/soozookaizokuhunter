const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

/**
 * 嘗試關閉廣告 - 可根據實際網頁 HTML 結構修改 selector
 */
async function tryCloseAd(page, maxTimes=3) {
  let closedCount = 0;
  for (let i=0; i<maxTimes; i++){
    try {
      // 假設廣告容器為 <div id="ad_box"> 裡面有個 <button class="close">
      // 您需自行查看 ginifab 網站實際 DOM，改成對應的 selector
      const closeBtn = await page.$('div#ad_box button.close, span#ad_close_btn');
      if(closeBtn){
        logger.info('[tryCloseAd] found ad close button => clicking...');
        await closeBtn.click();
        await page.waitForTimeout(1000);
        closedCount++;
      } else {
        // 沒找到 => break
        break;
      }
    } catch(e){
      logger.warn('[tryCloseAd] click fail =>', e);
      break;
    }
  }
  if(closedCount>0){
    logger.info(`[tryCloseAd] total closed => ${closedCount}`);
    return true;
  }
  return false;
}

/**
 * 嘗試上傳本機圖片 - 您可再搭配 tryCloseAd(...)
 */
async function tryClickUploadLocal(page, localFilePath) {
  try {
    logger.info('[tryClickUploadLocal] => start...');
    // (1) 可能先關閉彈窗
    await tryCloseAd(page, 2);

    // (2) 找到「上傳本機圖片」/「上傳照片」連結並點擊
    const link = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if(link.length>0){
      await link[0].click();
      await page.waitForTimeout(1500);
    } else {
      logger.warn('[tryClickUploadLocal] "上傳本機圖片" link not found');
      return false;
    }

    // (3) 找 input[type=file] 並上傳
    const fileInput = await page.$('input[type=file]');
    if(!fileInput){
      logger.warn('[tryClickUploadLocal] input[type=file] not found');
      return false;
    }
    await fileInput.uploadFile(localFilePath);
    logger.info('[tryClickUploadLocal] uploaded =>', localFilePath);

    await page.waitForTimeout(2000);
    return true;

  } catch(err){
    logger.error('[tryClickUploadLocal] error =>', err);
    return false;
  }
}

/**
 * 指定圖片網址 - 同樣可在一開始先 tryCloseAd(...)
 */
async function tryClickSpecifyImageUrl(page, publicImageUrl) {
  try {
    logger.info('[tryClickSpecifyImageUrl] =>', publicImageUrl);
    await tryCloseAd(page, 2);

    // 找「指定圖片網址」文字鏈結
    const link2 = await page.$x("//a[contains(text(),'指定圖片網址')]");
    if(link2.length>0){
      await link2[0].click();
      await page.waitForTimeout(1000);
    } else {
      logger.warn('[tryClickSpecifyImageUrl] link not found');
      return false;
    }

    // 等待輸入框
    const input = await page.waitForSelector('input[type=text]', { timeout:5000 });
    await input.type(publicImageUrl, { delay:50 });
    logger.info('[tryClickSpecifyImageUrl] typed =>', publicImageUrl);
    await page.waitForTimeout(1500);

    return true;
  } catch(e){
    logger.error('[tryClickSpecifyImageUrl] error =>', e);
    return false;
  }
}

/**
 * aggregatorSearchGinifabStrict：嘗試先進入 Ginifab → (1) 關閉廣告 → (2) 上傳 or 指定URL → 
 * 依序點 Bing/TinEye/Baidu，最後在 Baidu 做二次上傳 (若介面可行)。
 */
async function aggregatorSearchGinifabStrict(localFilePath='', publicImageUrl='') {
  logger.info('[aggregatorSearchGinifabStrict] => file=', localFilePath, ' url=', publicImageUrl);

  const results = {
    bing: [],
    tineye: [],
    baidu: []
  };

  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: true, // 避免 'new' 相容問題
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 }); // 強制桌面尺寸
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');

    // 進入 Ginifab
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    await page.waitForTimeout(2000);

    // 先嘗試上傳本機
    let ok = false;
    if(localFilePath){
      ok = await tryClickUploadLocal(page, localFilePath);
      if(!ok && publicImageUrl){
        logger.info('[aggregatorSearchGinifabStrict] local upload fail => try publicImageUrl approach...');
        ok = await tryClickSpecifyImageUrl(page, publicImageUrl);
      }
    } else if(publicImageUrl){
      ok = await tryClickSpecifyImageUrl(page, publicImageUrl);
    }

    if(!ok){
      logger.warn('[aggregatorSearchGinifabStrict] both local & URL fail => aggregator stop');
      await page.close().catch(()=>{});
      await browser.close().catch(()=>{});
      return results; // 空
    }

    // 上傳或指定URL成功後 => 順序點 Bing / TinEye / Baidu
    const engines = [
      { key:'bing',   label:['微軟必應','Bing'] },
      { key:'tineye', label:['錫眼睛','TinEye'] },
      { key:'baidu',  label:['百度','Baidu'] }
    ];

    for(const eng of engines){
      try {
        logger.info(`[aggregatorSearchGinifabStrict] click => ${eng.key}`);
        const newTab = new Promise(resolve => {
          browser.once('targetcreated', async t => resolve(await t.page()));
        });

        // 在 Ginifab 主頁面上找對應文字鏈結
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

        const popup = await newTab;
        await popup.bringToFront();
        await popup.setViewport({ width:1280, height:800 });
        await popup.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
        await popup.waitForTimeout(3000);

        // 若是 Baidu => 二次上傳
        if(eng.key==='baidu'){
          logger.info('[aggregatorSearchGinifabStrict] Baidu second step => tryCloseAd or upload...');
          await tryCloseAd(popup, 2);
          // 如果 Baidu 有同樣 #input[type=file] => ...
          // 參考您 fallbackDirectEngines 的 logic
        }

        // 抓取 popup 裡不含 ginifab/bing/tineye/baidu.com 的連結
        let hrefs = await popup.$$eval('a', as=> as.map(a=> a.href));
        hrefs = hrefs.filter(link =>
          link && !link.includes('ginifab') &&
          !link.includes('bing.com') &&
          !link.includes('tineye.com') &&
          !link.includes('baidu.com')
        );
        results[eng.key] = [...new Set(hrefs)].slice(0,8);

        await popup.close();
      } catch(eSub){
        logger.error(`[aggregatorSearchGinifabStrict][${eng.key}] fail =>`, eSub);
      }
    }

  } catch(e){
    logger.error('[aggregatorSearchGinifabStrict] error =>', e);
  } finally {
    if(page) await page.close().catch(()=>{});
    if(browser) await browser.close().catch(()=>{});
  }

  return results;
}

