// express/services/ginifabEngine.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * 直接對 Bing/TinEye/Baidu 做「上傳本地檔案」式以圖搜 (fallback)
 * @param {string} imagePath - 本地圖片路徑
 * @returns {Promise<{bing:string[], tineye:string[], baidu:string[]}>}
 */
async function fallbackDirectEngines(imagePath) {
  const results = {
    bing: [],
    tineye: [],
    baidu: []
  };
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    // Bing
    try {
      const page = await browser.newPage();
      await page.goto('https://www.bing.com/images', {
        waitUntil:'domcontentloaded', timeout:20000
      });
      const fileInput = await page.$('input[type=file]');
      if (fileInput) {
        await fileInput.uploadFile(imagePath);
        await page.waitForTimeout(4000);
        let links = await page.$$eval('a', as => as.map(a=>a.href));
        // 過濾非 Bing.com
        links = links.filter(l => l && !l.includes('bing.com'));
        results.bing.push(...links);
      }
      await page.close();
    } catch(eBing) {
      console.error('[fallback Bing error]', eBing);
    }

    // TinEye
    try {
      const page = await browser.newPage();
      await page.goto('https://tineye.com/', {
        waitUntil:'domcontentloaded', timeout:20000
      });
      const fileInput = await page.$('input[type=file]');
      if (fileInput) {
        await fileInput.uploadFile(imagePath);
        await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 }).catch(()=>{});
        await page.waitForTimeout(2000);

        let links = await page.$$eval('a', as => as.map(a=>a.href));
        // 過濾非 tineye.com
        links = links.filter(l => l && !l.includes('tineye.com'));
        results.tineye.push(...links);
      }
      await page.close();
    } catch(eTine) {
      console.error('[fallback TinEye error]', eTine);
    }

    // Baidu
    try {
      const page = await browser.newPage();
      await page.goto('https://graph.baidu.com/', {
        waitUntil:'domcontentloaded', timeout:20000
      });
      const baiduFile = await page.$('input[type=file]');
      if (baiduFile) {
        await baiduFile.uploadFile(imagePath);
        await page.waitForTimeout(5000);
        let links = await page.$$eval('a', as => as.map(a=>a.href));
        // 過濾非 baidu.com
        links = links.filter(l => l && !l.includes('baidu.com'));
        results.baidu.push(...links);
      }
      await page.close();
    } catch(eBaidu) {
      console.error('[fallback Baidu error]', eBaidu);
    }

  } catch(allErr) {
    console.error('[fallbackDirectEngines error]', allErr);
  } finally {
    if (browser) await browser.close();
  }

  // 去重
  results.bing   = [...new Set(results.bing)];
  results.tineye = [...new Set(results.tineye)];
  results.baidu  = [...new Set(results.baidu)];
  return results;
}

/**
 * 使用「Ginifab Aggregator」：指定圖片 URL → 依序點擊 Bing / TinEye / Baidu
 * @param {string} publicImageUrl - 可公開存取的圖片網址
 * @returns {Promise<{bing:{links:string[]}, tineye:{links:string[]}, baidu:{links:string[]}}>}
 */
async function aggregatorSearchGinifab(publicImageUrl) {
  const results = {
    bing: { links: [] },
    tineye: { links: [] },
    baidu: { links: [] }
  };
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });
    const page = await browser.newPage();
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'domcontentloaded', timeout:20000
    });
    await page.waitForTimeout(1000);

    // 點擊「指定圖片網址」
    await page.evaluate(() => {
      const link = [...document.querySelectorAll('a')]
        .find(a => a.innerText.includes('指定圖片網址'));
      if (link) link.click();
    });
    await page.waitForSelector('input[type=text]', { timeout:8000 });
    await page.type('input[type=text]', publicImageUrl, { delay:50 });
    await page.waitForTimeout(1500);

    // 順序點擊 Bing / TinEye / Baidu
    const engines = [
      { key:'bing',   label:['微軟必應','Bing'] },
      { key:'tineye', label:['錫眼睛','TinEye'] },
      { key:'baidu',  label:['百度','Baidu'] }
    ];

    for (let eng of engines){
      try {
        const newTab = new Promise(resolve => {
          browser.once('targetcreated', async t => resolve(await t.page()));
        });
        await page.evaluate(labels => {
          const as = [...document.querySelectorAll('a')];
          for(const lab of labels){
            const found = as.find(x=> x.innerText.includes(lab));
            if(found) { found.click(); return; }
          }
        }, eng.label);

        const popup = await newTab;
        await popup.waitForTimeout(3000);

        let hrefs = await popup.$$eval('a', as => as.map(a => a.href));
        hrefs = hrefs.filter(h =>
          h && !h.includes('ginifab') &&
          !h.includes('bing.com') &&
          !h.includes('tineye.com') &&
          !h.includes('baidu.com')
        );
        results[eng.key].links = hrefs.slice(0, 5);
        await popup.close();
      } catch(eSub){
        console.error(`[aggregatorSearchGinifab][${eng.key}] =>`, eSub);
      }
    }

  } catch(err) {
    console.error('[aggregatorSearchGinifab] fail =>', err);
    throw err;
  } finally {
    if(browser) await browser.close();
  }
  return results;
}

/**
 * (可選) 同時具備 aggregator + fallback
 * @param {string} localFilePath
 * @param {boolean} aggregatorFirst
 * @param {string} aggregatorImageUrl
 */
async function searchImagesWithFallback(localFilePath, aggregatorFirst=false, aggregatorImageUrl='') {
  const final = { bing: [], tineye: [], baidu: [] };

  if(aggregatorFirst && aggregatorImageUrl){
    try {
      const aggRes = await aggregatorSearchGinifab(aggregatorImageUrl);
      final.bing.push(...aggRes.bing.links);
      final.tineye.push(...aggRes.tineye.links);
      final.baidu.push(...aggRes.baidu.links);
    } catch(eAgg){
      console.error('[searchImagesWithFallback aggregator error]', eAgg);
    }
    const total = final.bing.length + final.tineye.length + final.baidu.length;
    if(total === 0){
      // fallback
      const fb = await fallbackDirectEngines(localFilePath);
      final.bing.push(...fb.bing);
      final.tineye.push(...fb.tineye);
      final.baidu.push(...fb.baidu);
    }
  } else {
    const fb = await fallbackDirectEngines(localFilePath);
    final.bing.push(...fb.bing);
    final.tineye.push(...fb.tineye);
    final.baidu.push(...fb.baidu);
  }

  final.bing   = [...new Set(final.bing)];
  final.tineye = [...new Set(final.tineye)];
  final.baidu  = [...new Set(final.baidu)];
  return final;
}

module.exports = {
  fallbackDirectEngines,
  aggregatorSearchGinifab,
  searchImagesWithFallback
};
