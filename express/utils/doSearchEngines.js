/**
 * express/utils/doSearchEngines.js
 *
 * 功能：
 *   1. 打開 Ginifab (只開一次、不關閉該主頁)，在同一個分頁可多次「Choose File / 指定圖片網址」上傳。
 *   2. 每次搜尋完，依序點 Bing/TinEye/Baidu => 開新分頁；抓外部連結後立刻關閉該分頁；回到 Ginifab 主頁。
 *   3. 若 aggregator 全部沒搜到 => fallbackDirectEngines (直接開 Bing/TinEye/Baidu 上傳)。
 *
 * 實作詳情：
 *   - aggregatorSearchGinifabPersistent(tasks) 會在同一個 browser + ginifabPage 上連續處理多張。
 *   - fallbackDirectEngines() 與 Bing/TinEye/Baidu 的 directSearchXXX()。
 *   - doSearchEngines() 可一次只丟一張 (localFilePath, aggregatorImageUrl)，
 *     或多張(若您改寫)；然後先 aggregator => 如果搜不到任何連結 => fallback。
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');

// ---------------------- 工具函式：若您需要本機PNG / 公開URL ----------------------
async function prepareImageForSearch(filePath) {
  // 若是影片 => 擷取第一秒 => 再轉PNG
  // 若是圖片(非png) => 轉png
  // 若已是png => 直接用
  const ext = path.extname(filePath).toLowerCase();
  const isVideo = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.webm'].includes(ext);
  if (isVideo) {
    const framePath = filePath + '_frame.png';
    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .on('error', reject)
        .on('end', resolve)
        .screenshots({
          count: 1,
          timemarks: ['1'],
          filename: path.basename(framePath),
          folder: path.dirname(framePath)
        });
    });
    // 再壓成 PNG
    const finalPng = framePath + '_convert.png';
    await sharp(framePath).png().toFile(finalPng);
    return finalPng;
  } else {
    if (ext !== '.png') {
      const outPng = filePath + '_convert.png';
      await sharp(filePath).png().toFile(outPng);
      return outPng;
    }
    return filePath;
  }
}

// ---------------------- aggregatorSearchGinifabPersistent：核心「單一 Ginifab 頁面」 ----------------------
/**
 * aggregatorSearchGinifabPersistent
 *
 * @param {Array<{ filePath?:string, url?:string }>} tasks - 要搜尋的多筆 (可能只丟一筆也行)
 * @returns {Array<{bing:string[], tineye:string[], baidu:string[]}>} - 與 tasks 順序一致
 *
 * 流程：
 *   1) 打開瀏覽器 + Ginifab 主頁
 *   2) 逐筆：
 *      - 如果有 filePath => 先轉PNG => 上傳 ("Choose File")
 *      - 否則若有 url => "指定圖片網址"
 *      - 點 Bing / TinEye / Baidu => 收集外部連結 => 關分頁 => 回 Ginifab 頁
 *   3) 結束後關瀏覽器 (若不想關，可加參數 keepOpen)
 */
async function aggregatorSearchGinifabPersistent(tasks, keepOpen = false) {
  const results = [];

  let browser;
  let ginifabPage;
  try {
    // 1) 啟動瀏覽器
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security'
      ]
    });

    // 2) 打開 Ginifab 主頁 (不關)
    ginifabPage = await browser.newPage();
    await ginifabPage.setViewport({ width: 1280, height: 800 });
    await ginifabPage.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('[aggregatorSearchGinifabPersistent] Ginifab page loaded.');

    // 內部函式：針對單筆 => doOneImageSearch
    async function doOneImageSearch(item) {
      const ret = { bing: [], tineye: [], baidu: [] };
      // (A) 準備 localPng / publicUrl
      let localPngPath = '';
      let url = '';
      if (item.filePath) {
        localPngPath = await prepareImageForSearch(item.filePath);
      } else if (item.url) {
        url = item.url;
      }
      // (B) Choose File or Specify URL
      if (localPngPath) {
        const fileInput = await ginifabPage.$('#upload_img'); 
        if (!fileInput) {
          throw new Error('找不到 #upload_img input[type=file]');
        }
        // 上傳
        await fileInput.uploadFile(localPngPath);
        await ginifabPage.waitForTimeout(1500);
      } else if (url) {
        // 指定圖片網址
        const showUrlBtn = await ginifabPage.$('a[href^="#urlBox"], a[onclick*="switch_contral_panel"][onclick*="2"]');
        if (showUrlBtn) {
          await showUrlBtn.click();
          await ginifabPage.waitForTimeout(500);
        }
        const urlInput = await ginifabPage.$('#img_url');
        if (!urlInput) {
          throw new Error('找不到 input#img_url');
        }
        await urlInput.click({ clickCount: 3 });
        await urlInput.type(url, { delay: 50 });
        await ginifabPage.waitForTimeout(1000);
        // 有些時候需要呼叫 window.change_url() 之類
        await ginifabPage.evaluate(()=>{
          if(window.change_url) window.change_url();
        });
        await ginifabPage.waitForTimeout(1000);
      } else {
        throw new Error('既無 filePath 也無 url => 無法執行');
      }

      // (C) 點擊 Bing/TinEye/Baidu => 每個都開新分頁 => 取外部連結 => 關
      // 幫忙過濾
      function filterLinks(all, excludes) {
        const set = new Set();
        for(const link of all){
          if(!link) continue;
          let skip=false;
          for(const ex of excludes){
            if(link.includes(ex)) { skip=true; break; }
          }
          if(!skip) set.add(link);
        }
        return [...set];
      }
      const engineList = [
        { key:'bing',   label:['Bing','微軟必應'], excludes:['ginifab','bing.com'] },
        { key:'tineye', label:['TinEye','錫眼睛'], excludes:['ginifab','tineye.com'] },
        { key:'baidu',  label:['Baidu','百度'],    excludes:['ginifab','baidu.com'] }
      ];
      for(const eng of engineList){
        try {
          // 監聽新分頁
          const newTabPromise = new Promise(resolve => {
            browser.once('targetcreated', async t => resolve(await t.page()));
          });
          // 在 ginifab 頁面找對應 label 的元素 => click
          await ginifabPage.evaluate((labels)=>{
            const els = [...document.querySelectorAll('a, input, button')];
            for(const lab of labels){
              const found = els.find(el => el.innerText && el.innerText.includes(lab));
              if(found){ found.click(); return; }
            }
          }, eng.label);

          const popPage = await newTabPromise;
          await popPage.setViewport({ width:1280, height:800 });
          await popPage.waitForTimeout(3000);

          // 如果是 Baidu => 可再度上傳 localPng (示範)
          if(eng.key==='baidu' && localPngPath){
            const bdInput = await popPage.$('input[type=file]');
            if(bdInput){
              await bdInput.uploadFile(localPngPath);
              await popPage.waitForTimeout(3000);
            }
          }

          // 擷取外部連結
          let links = await popPage.$$eval('a', as=>as.map(a=>a.href));
          links = filterLinks(links, eng.excludes);
          ret[eng.key] = links;

          await popPage.close();
          await ginifabPage.bringToFront();
        } catch(eEngine){
          console.error(`[aggregator][${eng.key}] error =>`, eEngine);
        }
      }

      return ret;
    }

    // 3) 逐筆 tasks 執行
    for (let i=0; i<tasks.length; i++){
      console.log(`\n[aggregatorSearchGinifabPersistent] #${i+1}`, tasks[i]);
      try {
        const r = await doOneImageSearch(tasks[i]);
        results.push(r);
      } catch(eOne){
        console.warn('[aggregatorSearchGinifabPersistent][oneImageSearch] fail =>', eOne);
        results.push({ bing:[], tineye:[], baidu:[] });
      }
    }

  } catch(e){
    console.error('[aggregatorSearchGinifabPersistent] main error =>', e);
  } finally {
    if(!keepOpen){
      // 預設：全部做完後關
      if(ginifabPage && !ginifabPage.isClosed()) await ginifabPage.close().catch(()=>{});
      if(browser) await browser.close().catch(()=>{});
    }
  }

  return results;
}

// ---------------------- fallbackDirectEngines：若 aggregator 失敗 => 直接 Bing/TinEye/Baidu 上傳 ----------------------

async function fallbackDirectEngines(localPngPath) {
  const result = { bing: [], tineye: [], baidu: [] };
  let browser;
  try {
    browser = await puppeteer.launch({ headless:true, args:['--no-sandbox','--disable-setuid-sandbox'] });
    console.log('[fallbackDirectEngines] browser launched...');

    // 同一個 browser 下，順序 or 並行
    result.bing   = await directSearchBing(browser, localPngPath);
    result.tineye = await directSearchTinEye(browser, localPngPath);
    result.baidu  = await directSearchBaidu(browser, localPngPath);

  } catch(e){
    console.error('[fallbackDirectEngines] error =>', e);
  } finally {
    if(browser) await browser.close().catch(()=>{});
  }
  return result;
}

async function directSearchBing(browser, imagePath) {
  console.log('[directSearchBing] =>', imagePath);
  let ret = [];
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://www.bing.com/images', { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForTimeout(2000);

    // 點相機 => waitForFileChooser => upload
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser({ timeout:10000 }),
      page.click('#sb_sbi, .micsvc_lpicture, .sb_sbi').catch(()=>{})
    ]);
    await fileChooser.accept([imagePath]);

    await page.waitForTimeout(5000);
    let links = await page.$$eval('a', as=> as.map(a=> a.href));
    links = links.filter(l=> l && !l.includes('bing.com'));
    ret = [...new Set(links)].slice(0,10);

  } catch(e){
    console.error('[directSearchBing] fail =>', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

async function directSearchTinEye(browser, imagePath){
  console.log('[directSearchTinEye] =>', imagePath);
  let ret = [];
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://tineye.com/', { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForTimeout(2000);

    const input = await page.$('input[type=file]');
    if(!input) throw new Error('TinEye input[type=file] not found');
    await input.uploadFile(imagePath);

    await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
    await page.waitForTimeout(2000);

    let links= await page.$$eval('a', as=> as.map(a=> a.href));
    links= links.filter(l=> l && !l.includes('tineye.com'));
    ret = [...new Set(links)].slice(0,10);

  } catch(e){
    console.error('[directSearchTinEye] fail =>', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

async function directSearchBaidu(browser, imagePath){
  console.log('[directSearchBaidu] =>', imagePath);
  let ret = [];
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://graph.baidu.com/', { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForTimeout(3000);

    // 在 graph.baidu.com 或 image.baidu.com 上上傳
    const fInput = await page.$('input[type=file]');
    if(fInput){
      await fInput.uploadFile(imagePath);
      await page.waitForTimeout(5000);
    }
    // 第二招： https://image.baidu.com/
    await page.goto('https://image.baidu.com/', { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForTimeout(3000);
    const cameraBtn = await page.$('span.soutu-btn');
    if(cameraBtn){
      await cameraBtn.click();
      await page.waitForTimeout(1500);
      const f2= await page.$('input.upload-pic');
      if(f2){
        await f2.uploadFile(imagePath);
        await page.waitForTimeout(3000);
      }
    }

    let links= await page.$$eval('a', as=> as.map(a=> a.href));
    links= links.filter(l=> l && !l.includes('baidu.com'));
    ret = [...new Set(links)].slice(0,10);

  } catch(e){
    console.error('[directSearchBaidu] fail =>', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

// ---------------------- 主入口：doSearchEngines ----------------------
/**
 * doSearchEngines
 * @param {string} localFilePath  - 本機檔案 (圖或影片)
 * @param {boolean} aggregatorFirst - 是否先嘗試 aggregator
 * @param {string} aggregatorImageUrl - 若 aggregator 要用「指定圖片網址」，可放這裡
 */
async function doSearchEngines(localFilePath, aggregatorFirst = true, aggregatorImageUrl = '') {
  console.log('[doSearchEngines] => localFilePath=', localFilePath, ' aggregatorUrl=', aggregatorImageUrl);

  // 先把本地檔案轉成 PNG (若是影片或非png圖)
  let finalPng = '';
  try {
    if(localFilePath && fs.existsSync(localFilePath)){
      finalPng = await prepareImageForSearch(localFilePath);
    }
  } catch(ePrep){
    console.error('[doSearchEngines] prepareImage fail =>', ePrep);
    // 反正後面 aggregator/fallback 都會檢查檔案是否存在
  }

  // aggregator
  let aggregatorOK = false;
  let aggregatorRes = { bing:[], tineye:[], baidu:[] };

  if(aggregatorFirst){
    console.log('[doSearchEngines] aggregatorFirst => start aggregatorSearchGinifabPersistent...');
    // 我們示範只搜尋 1 筆 => { filePath: finalPng } or { url: aggregatorImageUrl }
    // 也可以都帶 => if (finalPng) 就用 filePath: finalPng; else url: aggregatorImageUrl
    const tasks = [];
    if(finalPng) tasks.push({ filePath: localFilePath }); 
    else if(aggregatorImageUrl) tasks.push({ url: aggregatorImageUrl });
    if(!tasks.length){
      console.warn('[doSearchEngines] no local nor aggregatorUrl => aggregator skip.');
    } else {
      let searchArr = await aggregatorSearchGinifabPersistent(tasks, false); 
      // searchArr 是陣列 => 預期只有一個 => searchArr[0].bing / .tineye / .baidu
      if(searchArr.length>0){
        aggregatorRes.bing   = searchArr[0].bing   || [];
        aggregatorRes.tineye = searchArr[0].tineye || [];
        aggregatorRes.baidu  = searchArr[0].baidu  || [];
      }
      aggregatorOK = (
        aggregatorRes.bing.length + aggregatorRes.tineye.length + aggregatorRes.baidu.length
      ) > 0;
    }
  }

  if(!aggregatorOK){
    console.warn('[doSearchEngines] aggregator fail => fallbackDirect...');
    const fb = await fallbackDirectEngines(finalPng || localFilePath);
    aggregatorRes.bing   = fb.bing;
    aggregatorRes.tineye = fb.tineye;
    aggregatorRes.baidu  = fb.baidu;
  }

  // 刪除暫存檔 (如 _convert.png / _frame.png_convert.png)
  try {
    if(finalPng && finalPng !== localFilePath && fs.existsSync(finalPng)){
      fs.unlinkSync(finalPng);
    }
    const maybeFrame = localFilePath + '_frame.png';
    if(fs.existsSync(maybeFrame)) fs.unlinkSync(maybeFrame);
    if(fs.existsSync(maybeFrame + '_convert.png')) fs.unlinkSync(maybeFrame + '_convert.png');
  } catch(eDel){
    console.warn('[doSearchEngines] remove temp fail =>', eDel);
  }

  return {
    bing:   aggregatorRes.bing,
    tineye: aggregatorRes.tineye,
    baidu:  aggregatorRes.baidu
  };
}

// 匯出
module.exports = {
  doSearchEngines
};
