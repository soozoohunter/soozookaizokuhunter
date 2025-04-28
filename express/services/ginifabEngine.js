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
      await page.goto('https://www.bing.com/images', { waitUntil:'domcontentloaded', timeout:20000 });
      // Bing 搜圖的「相機按鈕」或 input[type=file] 可能動態
      // 這裡假設可以直接選到 input[type=file]
      const fileInput = await page.$('input[type=file]');
      if (fileInput) {
        await fileInput.uploadFile(imagePath);
        await page.waitForTimeout(4000);
        // 抓外部連結
        let links = await page.$$eval('a', as => as.map(a => a.href));
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
      await page.goto('https://tineye.com/', { waitUntil:'domcontentloaded', timeout:20000 });
      const fileInput = await page.$('input[type=file]');
      if (fileInput) {
        await fileInput.uploadFile(imagePath);
        await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 }).catch(()=>{});
        await page.waitForTimeout(2000);

        let links = await page.$$eval('a', as => as.map(a => a.href));
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
      // 有時可能需要 "https://graph.baidu.com/pcpage/index?tpl_from=pc"...
      await page.goto('https://graph.baidu.com/', { waitUntil:'domcontentloaded', timeout:20000 });
      const baiduFile = await page.$('input[type=file]');
      if (baiduFile) {
        await baiduFile.uploadFile(imagePath);
        await page.waitForTimeout(5000);
        let links = await page.$$eval('a', as => as.map(a => a.href));
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
  results.bing = [...new Set(results.bing)];
  results.tineye = [...new Set(results.tineye)];
  results.baidu = [...new Set(results.baidu)];
  return results;
}

/**
 * 使用「Ginifab Aggregator」：指定圖片 URL → 依序點擊 Bing / TinEye / Baidu
 * @param {string} publicImageUrl - 可公開存取的圖片網址 (e.g. Cloudinary URL / IPFS Gateway / ...)
 * @returns {Promise<{bing:string[], tineye:string[], baidu:string[]}>}
 */
async function aggregatorSearchGinifab(publicImageUrl) {
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
    const page = await browser.newPage();
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'domcontentloaded',
      timeout:20000
    });
    await page.waitForTimeout(1000);

    // 點擊「指定圖片網址」
    await page.evaluate(() => {
      const link = [...document.querySelectorAll('a')]
        .find(a => a.innerText.includes('指定圖片網址'));
      if (link) link.click();
    });
    await page.waitForSelector('input[type=text]', { timeout:5000 });
    await page.type('input[type=text]', publicImageUrl, { delay:50 });
    await page.waitForTimeout(1500);

    // 順序點擊三個搜索 (Bing / TinEye / Baidu)
    const engines = [
      { key:'bing',   label:['微軟必應','Microsoft Bing','Bing'] },
      { key:'tineye', label:['錫眼睛','TinEye'] },
      { key:'baidu',  label:['百度','Baidu'] }
    ];

    for (let eng of engines) {
      try {
        const newTab = new Promise(resolve => {
          browser.once('targetcreated', async t => resolve(await t.page()));
        });
        // 在 ginifab 主頁點擊對應文字
        await page.evaluate((labels) => {
          const as = [...document.querySelectorAll('a')];
          for (let lab of labels) {
            const a = as.find(x => x.innerText.includes(lab));
            if(a) { a.click(); return; }
          }
        }, eng.label);
        const subPage = await newTab;
        await subPage.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 }).catch(()=>{});
        await subPage.waitForTimeout(2000);

        // 抓外部連結
        let links = await subPage.$$eval('a[href]', as => as.map(a => a.href));
        // 過濾 ginifab / bing / tineye / baidu 自身
        links = links.filter(l => l && !l.includes('bing.com') && !l.includes('tineye.com') && !l.includes('baidu.com') && !l.includes('ginifab.com'));
        results[eng.key].push(...links);
        await subPage.close();
      } catch(subErr) {
        console.error(`[aggregatorSearchGinifab][${eng.key}] err =>`, subErr);
      }
    }

  } catch(err) {
    console.error('[aggregatorSearchGinifab] fail =>', err);
    throw err;
  } finally {
    if(browser) await browser.close();
  }

  // 去重
  results.bing = [...new Set(results.bing)];
  results.tineye = [...new Set(results.tineye)];
  results.baidu = [...new Set(results.baidu)];
  return results;
}

/**
 * 綜合「aggregator + fallbackDirect」的搜尋邏輯：
 * 1. 若 aggregatorFirst=true & 提供 aggregatorUrl => 先 aggregator
 * 2. 若 aggregator 出錯或無結果，可進 fallbackDirectEngines
 * 3. 若 aggregatorFirst=false 則直接 fallback
 *
 * @param {string} localFilePath - 本地圖片/影片幀 路徑
 * @param {boolean} aggregatorFirst - 是否先試 aggregator
 * @param {string} aggregatorImageUrl - 可公開圖片URL
 * @returns {Promise<{bing: string[], tineye:string[], baidu: string[]}>}
 */
async function searchImagesWithFallback(localFilePath, aggregatorFirst=false, aggregatorImageUrl='') {
  let final = {
    bing: [],
    tineye: [],
    baidu: []
  };

  // aggregator
  if (aggregatorFirst && aggregatorImageUrl) {
    try {
      const aggRes = await aggregatorSearchGinifab(aggregatorImageUrl);
      final.bing.push(...aggRes.bing);
      final.tineye.push(...aggRes.tineye);
      final.baidu.push(...aggRes.baidu);
    } catch(eAgg) {
      console.error('[searchImagesWithFallback aggregator error]', eAgg);
    }
    // fallback => 若 aggregator 全部都沒抓到
    const totalFound = final.bing.length + final.tineye.length + final.baidu.length;
    if (totalFound === 0) {
      console.log('[searchImagesWithFallback] aggregator no result => fallback direct');
      const fb = await fallbackDirectEngines(localFilePath);
      final.bing.push(...fb.bing);
      final.tineye.push(...fb.tineye);
      final.baidu.push(...fb.baidu);
    }
  } else {
    // 直接 fallback
    console.log('[searchImagesWithFallback] direct fallback only');
    const fb = await fallbackDirectEngines(localFilePath);
    final.bing.push(...fb.bing);
    final.tineye.push(...fb.tineye);
    final.baidu.push(...fb.baidu);
  }

  // 去重
  final.bing = [...new Set(final.bing)];
  final.tineye = [...new Set(final.tineye)];
  final.baidu = [...new Set(final.baidu)];

  return final;
}

module.exports = {
  fallbackDirectEngines,
  aggregatorSearchGinifab,
  searchImagesWithFallback
};
