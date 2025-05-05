/**
 * express/utils/doSearchEngines.js
 *
 * 寫死邏輯：
 *   1) 一開始固定打開 https://www.ginifab.com.tw/tools/search_image_by_image/
 *   2) 透過點擊「Choose File / 上傳本機圖片」來上傳檔案；或點「指定圖片網址」輸入URL
 *   3) Bing / TinEye / Baidu 三大引擎皆由同一 Ginifab 主頁彈出新分頁做搜尋。
 *   4) 保留 Ginifab 主頁不關閉，只關每次彈出的分頁 => 可反覆上傳/指定URL再搜。
 *
 * 匯出四個主要函式：
 *   - initGinifab()
 *   - uploadToGinifab()
 *   - specifyUrlOnGinifab()
 *   - clickEngineAndGetLinks()
 *
 * 使用範例(在 routes/protect.js or other):
 * ------------------------------------------------
 *   const { initGinifab, uploadToGinifab, specifyUrlOnGinifab, clickEngineAndGetLinks } = require('../utils/doSearchEngines');
 *
 *   app.get('/testGinifab', async(req,res)=>{
 *     const { browser, ginifabPage } = await initGinifab();
 *
 *     // 第一次：上傳某張檔案
 *     await uploadToGinifab(ginifabPage, '/path/to/localFile.jpg');
 *     // 分別點擊 Bing / TinEye / Baidu
 *     const bingLinks   = await clickEngineAndGetLinks(ginifabPage, browser, 'bing');
 *     const tineyeLinks = await clickEngineAndGetLinks(ginifabPage, browser, 'tineye');
 *     const baiduLinks  = await clickEngineAndGetLinks(ginifabPage, browser, 'baidu');
 *
 *     // 再次換另一張檔案 or 指定網址
 *     await uploadToGinifab(ginifabPage, '/path/to/another.jpg');
 *     const newBingLinks = await clickEngineAndGetLinks(ginifabPage, browser, 'bing');
 *
 *     // 結束 => browser.close()
 *     await browser.close();
 *
 *     return res.json({ bingLinks, tineyeLinks, baiduLinks, newBingLinks });
 *   });
 * ------------------------------------------------
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// 使用 StealthPlugin，降低被偵測
puppeteer.use(StealthPlugin());

/** 
 * 若您想真的關閉廣告，可改寫此函式，
 * 若確定 Ginifab 不會再跳廣告也可留空。
 */
async function tryCloseAd(page) {
  try {
    // 假設廣告只會第一次載入時彈出 => 留空或少量 try-catch
    // const closeBtn = await page.$('.adCloseBtn, button.close');
    // if(closeBtn) {
    //   await closeBtn.click();
    //   await page.waitForTimeout(1000);
    // }
    return false;
  } catch(e) {
    console.warn('[tryCloseAd] error =>', e);
    return false;
  }
}

/**
 * Ginifab 主頁 (固定)
 */
const GINIFAB_URL = 'https://www.ginifab.com.tw/tools/search_image_by_image/';

/**
 * [1] initGinifab()
 *   - 打開瀏覽器 & Ginifab 主頁 (只做一次即可)
 */
async function initGinifab() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security'
    ]
  });

  const ginifabPage = await browser.newPage();
  await ginifabPage.setViewport({ width:1280, height:800 });
  // 前往 Ginifab
  await ginifabPage.goto(GINIFAB_URL, {
    waitUntil:'domcontentloaded',
    timeout:30000
  });

  // 關一次廣告
  await tryCloseAd(ginifabPage);

  return { browser, ginifabPage };
}

/**
 * [2] uploadToGinifab()
 *   - 寫死：必須點擊「Choose File / 上傳本機圖片 / 選擇檔案」按鈕 => 再找 <input type="file"> => uploadFile
 *   - 若實際 DOM 與示範不同，請修改選擇器
 */
async function uploadToGinifab(ginifabPage, localFilePath) {
  console.log('[uploadToGinifab] =>', localFilePath);
  // 先關一次廣告
  await tryCloseAd(ginifabPage);

  // 假設網頁上有一個連結/按鈕，文字包含「Choose File」或「上傳本機圖片」或「選擇檔案」等
  const [chooseFileBtn] = await ginifabPage.$x("//a[contains(text(),'Choose File') or contains(text(),'上傳本機圖片') or contains(text(),'選擇檔案')]");
  if(!chooseFileBtn){
    throw new Error('cannot find "Choose File" link on Ginifab');
  }

  // 點它 => 顯示 <input type="file">
  await chooseFileBtn.evaluate(el => {
    el.scrollIntoView({ block:'center', inline:'center' });
    el.click();
  });
  await ginifabPage.waitForTimeout(1000);

  // 再找 input[type=file]
  const fileInput = await ginifabPage.$('input[type=file]');
  if(!fileInput){
    throw new Error('no <input type="file"> found after clicking "Choose File"');
  }
  // 上傳
  await fileInput.uploadFile(localFilePath);

  // 等待 1~2秒
  await ginifabPage.waitForTimeout(2000);
  console.log('[uploadToGinifab] done =>', localFilePath);
}

/**
 * [3] specifyUrlOnGinifab()
 *   - 寫死：點擊「指定圖片網址」 => 在 input#img_url 貼上公開URL
 */
async function specifyUrlOnGinifab(ginifabPage, publicImageUrl) {
  console.log('[specifyUrlOnGinifab] =>', publicImageUrl);
  // 關一次廣告
  await tryCloseAd(ginifabPage);

  // 找到「指定圖片網址」連結 (示範：文字包含「指定圖片網址」)
  const [urlBtn] = await ginifabPage.$x("//a[contains(text(),'指定圖片網址') or contains(text(),'URL')]");
  if(!urlBtn){
    throw new Error('cannot find link "指定圖片網址" on Ginifab');
  }
  await urlBtn.evaluate(el => {
    el.scrollIntoView({ block:'center', inline:'center' });
    el.click();
  });
  await ginifabPage.waitForTimeout(1000);

  // 再找 input#img_url
  const urlInput = await ginifabPage.$('input#img_url');
  if(!urlInput){
    throw new Error('no <input#img_url> found after clicking "指定圖片網址"');
  }
  // 清除 & 輸入
  await urlInput.click({ clickCount:3 });
  await urlInput.type(publicImageUrl, { delay:50 });
  await ginifabPage.waitForTimeout(500);

  console.log('[specifyUrlOnGinifab] done => typed URL');
}

/**
 * [4] clickEngineAndGetLinks()
 *   - 在 Ginifab 主頁點「Bing/TinEye/Baidu」 => 開新分頁 => 解析外部連結 => 關閉分頁 => 回傳
 *   - engine: 'bing' / 'tineye' / 'baidu'
 */
async function clickEngineAndGetLinks(ginifabPage, browser, engine) {
  console.log('[clickEngineAndGetLinks] =>', engine);

  // 先關一次廣告
  await tryCloseAd(ginifabPage);

  // 對應按鈕文字
  let label;
  if(engine==='bing')   label=['Bing','微軟必應'];
  if(engine==='tineye') label=['TinEye','錫眼睛'];
  if(engine==='baidu')  label=['Baidu','百度'];
  if(!label){
    throw new Error(`unknown engine => ${engine}`);
  }

  // 等待彈出分頁
  const newTabPromise = new Promise(resolve => {
    browser.once('targetcreated', async target => {
      const p = await target.page();
      resolve(p);
    });
  });

  // 在 ginifabPage 找到該引擎連結
  await ginifabPage.evaluate(labels => {
    const allEls = [...document.querySelectorAll('a,button,input')];
    for(const lab of labels){
      const found = allEls.find(el => el.innerText && el.innerText.includes(lab));
      if(found){
        found.scrollIntoView({ block:'center', inline:'center' });
        found.click();
        return;
      }
    }
  }, label);

  const popup = await newTabPromise; 
  await popup.bringToFront();
  await popup.setViewport({ width:1280, height:800 });
  // 等幾秒
  await popup.waitForTimeout(3000);

  // 若 baidu 需要再上傳 => 在這裡寫
  if(engine==='baidu'){
    console.log('[clickEngineAndGetLinks] => Baidu second upload if needed...');
    // const fileInput = await popup.$('input[type=file]');
    // if(fileInput){
    //   await fileInput.uploadFile('/path/to/localFileAgain.png');
    //   await popup.waitForTimeout(2000);
    // }
  }

  // 抓所有超連結 -> 過濾 ginifab / 自身域名
  let hrefs = await popup.$$eval('a', as=> as.map(a=> a.href));
  const excludes= ['ginifab','bing.com','tineye.com','baidu.com'];
  hrefs = hrefs.filter(link => 
    link && !excludes.some(ex => link.includes(ex))
  );

  // 關閉分頁
  await popup.close();
  console.log(`[clickEngineAndGetLinks] => engine=${engine}, got => ${hrefs.length} links`);

  return hrefs;
}

// 匯出
module.exports = {
  initGinifab,
  uploadToGinifab,
  specifyUrlOnGinifab,
  clickEngineAndGetLinks
};
