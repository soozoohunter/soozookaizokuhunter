/**
 * express/utils/doSearchEngines.js
 *
 * 目標：同一個 Ginifab 主頁不關閉，可重複上傳/指定圖片，然後分別點 Bing/TinEye/Baidu。
 *
 * 使用方式：
 *   1) const { initGinifab, uploadToGinifab, specifyUrlOnGinifab, clickEngineAndGetLinks } = require('./doSearchEngines');
 *   2) const { browser, ginifabPage } = await initGinifab(); // 只做一次
 *   3) await uploadToGinifab(ginifabPage, '/path/to/local.jpg'); // or specifyUrlOnGinifab(ginifabPage, 'http://...')
 *   4) const bingLinks   = await clickEngineAndGetLinks(ginifabPage, browser, 'bing');
 *      const tineyeLinks = await clickEngineAndGetLinks(ginifabPage, browser, 'tineye');
 *      const baiduLinks  = await clickEngineAndGetLinks(ginifabPage, browser, 'baidu');
 *   5) [重複 3,4 若要換另一張圖片再搜...]
 *   6) 全部搜完 => await browser.close()（或保留，隨您）
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// 使用 StealthPlugin 降低被偵測
puppeteer.use(StealthPlugin());

// 如果有 closeAdHelper.js，可引入；若沒有，就示範空函式
async function tryCloseAd(page) {
  // 不做任何事，或真的去找廣告關閉按鈕
  return false;
}

// Ginifab 網址
const GINIFAB_URL = 'https://www.ginifab.com.tw/tools/search_image_by_image/';

// [A] 初始化：啟動瀏覽器 & 打開 Ginifab 主頁 (只做一次)
async function initGinifab() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox']
  });
  const ginifabPage = await browser.newPage();
  await ginifabPage.setViewport({ width: 1280, height: 800 });
  // 進入 ginifab 主頁
  await ginifabPage.goto(GINIFAB_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // 嘗試關閉一次廣告 (可能只會出現第一次)
  await tryCloseAd(ginifabPage);
  return { browser, ginifabPage };
}

// [B] 上傳本機圖片：
//   寫死「必須點擊 choose file / 選擇檔案」這個按鈕 => 再找到 <input type="file">
async function uploadToGinifab(ginifabPage, localFilePath) {
  console.log('[uploadToGinifab] =>', localFilePath);
  // 先關廣告
  await tryCloseAd(ginifabPage);

  // 找到 「上傳本機圖片」 或 「Choose File」的按鈕 — 請依實際DOM更改
  // 假設內文: <a id="chooseFileBtn">Choose File</a> => 只是示範
  const [chooseBtn] = await ginifabPage.$x("//a[contains(text(),'Choose File') or contains(text(),'上傳本機圖片') or contains(text(),'選擇檔案')]");
  if (!chooseBtn) {
    throw new Error('cannot find "Choose File" link on Ginifab');
  }
  // 點擊 => 顯示 <input type="file"> (通常同一個form裡)
  await chooseBtn.evaluate(el => el.click());
  await ginifabPage.waitForTimeout(1000);

  // 再找 <input type="file">
  const fileInput = await ginifabPage.$('input[type=file]');
  if (!fileInput) {
    throw new Error('No <input type="file"> found after clicking "Choose File"');
  }
  // 上傳
  await fileInput.uploadFile(localFilePath);
  await ginifabPage.waitForTimeout(1500);

  console.log('[uploadToGinifab] upload done =>', localFilePath);
}

// [C] 指定圖片網址 (若不用檔案上傳，而要貼 URL)
async function specifyUrlOnGinifab(ginifabPage, publicImageUrl) {
  console.log('[specifyUrlOnGinifab] =>', publicImageUrl);
  await tryCloseAd(ginifabPage);

  // 假設有個連結 <a id="specifyUrlBtn">指定圖片網址</a>
  const [urlBtn] = await ginifabPage.$x("//a[contains(text(),'指定圖片網址') or contains(text(),'URL')]");
  if(!urlBtn){
    throw new Error('cannot find "指定圖片網址" link on Ginifab');
  }
  await urlBtn.evaluate(el => el.click());
  await ginifabPage.waitForTimeout(1000);

  // 找到 <input id="img_url"> 之類
  const urlInput = await ginifabPage.$('input#img_url');
  if(!urlInput){
    throw new Error('cannot find input#img_url for specifying URL');
  }
  // 清空後輸入
  await urlInput.click({ clickCount: 3 });
  await urlInput.type(publicImageUrl, { delay: 50 });
  await ginifabPage.waitForTimeout(500);

  console.log('[specifyUrlOnGinifab] done =>', publicImageUrl);
}

// [D] 點選 Bing / TinEye / Baidu => 開新分頁 => 取連結 => 關新分頁
//   - engine: 'bing' / 'tineye' / 'baidu'
async function clickEngineAndGetLinks(ginifabPage, browser, engine) {
  // 先關一次廣告
  await tryCloseAd(ginifabPage);
  console.log(`[clickEngineAndGetLinks] => engine=${engine}`);
  
  // map engine => selector text
  let label;
  if (engine === 'bing')   label = ['Bing','微軟必應'];
  if (engine === 'tineye') label = ['TinEye','錫眼睛'];
  if (engine === 'baidu')  label = ['Baidu','百度'];

  // 監聽新分頁 (popup)
  const newTabPromise = new Promise(resolve => {
    browser.once('targetcreated', async target => {
      const p = await target.page();
      resolve(p);
    });
  });

  // 在 ginifab 主頁找對應 label
  await ginifabPage.evaluate(labels => {
    const candidates = [...document.querySelectorAll('a,button,input')];
    for(const lab of labels){
      const found = candidates.find(el => el.innerText && el.innerText.includes(lab));
      if(found){
        found.scrollIntoView({ block:'center', inline:'center' });
        found.click();
        return;
      }
    }
  }, label);

  // 等待新分頁
  const popup = await newTabPromise;
  // 若 Baidu => 可能需要再上傳 or specify URL
  if(engine === 'baidu'){
    console.log('[clickEngineAndGetLinks] => Baidu second upload if needed...');
    // 這裡可以檢查 <input type="file"> or ...
    // e.g. const fileInput = await popup.$('input[type=file]');
    // if(fileInput) { ... }
  }

  // 等 3秒
  await popup.waitForTimeout(3000);

  // 抓外部連結 (排除 ginifab / bing.com / tineye.com / baidu.com)
  let hrefs = await popup.$$eval('a', as => as.map(a => a.href));
  const excludes = ['ginifab','bing.com','tineye.com','baidu.com'];
  hrefs = hrefs.filter(link => link && !excludes.some(ex => link.includes(ex)));
  // 關閉新分頁
  await popup.close();
  
  console.log(`[clickEngineAndGetLinks] => engine=${engine}, found links=`, hrefs.length);
  return hrefs;
}

// [E] 匯出

module.exports = {
  initGinifab,            // 開瀏覽器 + Ginifab
  uploadToGinifab,        // "Choose File" => input[type=file] => 上傳
  specifyUrlOnGinifab,    // 指定圖片網址
  clickEngineAndGetLinks, // 點 Bing/TinEye/Baidu => parse link
};
