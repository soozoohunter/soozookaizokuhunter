// express/utils/doSearchEngines.js
const path = require('path');
const puppeteerExtra = require('./puppeteerExtra');

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

/**
 * 整合 aggregator(可選) + direct fallback
 */
async function aggregatorSearchGinifab(browser, imageUrl, fileId){
  const ret = {
    bing:{ success:false, links:[], screenshot:'' },
    tineye:{ success:false, links:[], screenshot:'' },
    baidu:{ success:false, links:[], screenshot:'' }
  };
  // 省略: 可直接 require('../services/ginifabEngine')
  // 這裡也可 inline  => 省略
  return ret;
}

/**
 * doSearchEngines
 * aggregatorFirst=true => 先 aggregator => 失敗再 fallback
 * aggregatorFirst=false => 全 direct
 */
async function doSearchEngines(imagePath, aggregatorFirst, aggregatorImageUrl=''){
  const puppeteer = require('./puppeteerExtra'); // or pass in
  const browser = await puppeteer.launch({
    headless:true,
    args:['--no-sandbox','--disable-setuid-sandbox']
  });
  let final = {
    bing:{ success:false, links:[], screenshot:'' },
    tineye:{ success:false, links:[], screenshot:'' },
    baidu:{ success:false, links:[], screenshot:'' }
  };
  if(aggregatorFirst && aggregatorImageUrl){
    // aggregator => ...
    // 省略(同 ginifabEngine)
  } else {
    // direct
    const [rBing, rTineye, rBaidu] = await Promise.all([
      directSearchBing(browser, imagePath),
      directSearchTinEye(browser, imagePath),
      directSearchBaidu(browser, imagePath)
    ]);
    final.bing = rBing;
    final.tineye = rTineye;
    final.baidu = rBaidu;
  }
  await browser.close();
  return final;
}

module.exports = {
  directSearchBing,
  directSearchTinEye,
  directSearchBaidu,
  doSearchEngines
};
