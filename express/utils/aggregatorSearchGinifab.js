/**
 * aggregatorSearchGinifab.js
 *
 * 功能：
 *   1) 在 https://www.ginifab.com.tw/tools/search_image_by_image/ 中，
 *      嘗試「本機上傳 或 貼上publicImageUrl」，成功後才能用該頁的 Bing/TinEye/Baidu 三種圖搜引擎。
 *   2) 若都失敗，放棄 aggregator 。
 *   3) 若成功，依序點擊 "微軟必應" / "錫眼睛" / "百度" 按鈕，開新分頁爬取外部連結。
 *
 * 使用方式 (在另一個檔案中):
 *   const { aggregatorSearchGinifab } = require('./aggregatorSearchGinifab');
 *   ...
 *   const browser = await puppeteer.launch(...);
 *   const ret = await aggregatorSearchGinifab(browser, '/path/to/localFile.jpg', 'https://xxx/publicFile.jpg');
 *   console.log(ret);
 *     => {
 *          bing:   { success:true, links:['https://xxx','...'] },
 *          tineye: { success:false, links:[] },
 *          baidu:  { success:true,  links:['https://yyy','...'] }
 *        }
 */

const path = require('path');
const fs   = require('fs');

const ENGINE_MAX_LINKS = parseInt(process.env.ENGINE_MAX_LINKS, 10) || 50;

// selectors used to detect file upload inputs and url fields. additional
// patterns are included so minor markup changes on ginifab won't break the flow
const FILE_INPUT_SELECTOR = 'input[type=file], input[type="file"], input[name*=file], input[id*=file]';
const URL_INPUT_SELECTOR  = 'input[type=text], input[type=url], input[name*=url], input[id*=url]';

/** 可帶入以「關閉彈窗廣告」的輔助函式 */
async function tryCloseAd(page) {
  try {
    await page.waitForTimeout(2000);
    const adCloseBtn = await page.$('.adCloseBtn, .close, button.ad-close');
    if (adCloseBtn) {
      await adCloseBtn.click();
      await page.waitForTimeout(1000);
      console.log('[tryCloseAd] closed an ad popup');
      return true;
    }
  } catch (err) {
    console.warn('[tryCloseAd] fail =>', err);
  }
  return false;
}

/** 針對 iOS 風格的「上傳本機圖片」按鈕流程 */
async function tryGinifabUploadLocal_iOS(page, localImagePath) {
  console.log('[tryGinifabUploadLocal_iOS] ...');
  try {
    await tryCloseAd(page);

    // 找到「上傳本機圖片」「上傳照片」等  (XPATH)
    const [linkiOS] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if (!linkiOS) throw new Error('iOS flow: cannot find "上傳本機圖片" link');
    await linkiOS.click();
    await page.waitForTimeout(1000);

    const [chooseFileBtn] = await page.$x("//a[contains(text(),'選擇檔案') or contains(text(),'挑選檔案')]");
    if (!chooseFileBtn) throw new Error('iOS flow: cannot find "選擇檔案" link');
    await chooseFileBtn.click();
    await page.waitForTimeout(1000);

    // iOS 風格 => 可能會有「照片圖庫 / Photo Library」按鈕
    const [photoBtn] = await page.$x("//a[contains(text(),'照片圖庫') or contains(text(),'相簿') or contains(text(),'Photo Library')]");
    if (!photoBtn) throw new Error('iOS flow: cannot find "照片圖庫" or "相簿" link');
    await photoBtn.click();
    await page.waitForTimeout(1500);

    // 也可能會需要點「完成」
    const [finishBtn] = await page.$x("//a[contains(text(),'完成') or contains(text(),'Done') or contains(text(),'OK')]");
    if (finishBtn) {
      await finishBtn.click();
      await page.waitForTimeout(800);
    }

    // 最後再去抓 <input type="file">，使用較寬鬆的 selector 並等待出現
    const fileInput = await page.waitForSelector(FILE_INPUT_SELECTOR, { timeout: 5000 }).catch(() => null);
    if (!fileInput) throw new Error('iOS flow: no file input found');
    await fileInput.uploadFile(localImagePath);
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal_iOS] success');
    return true;
  } catch (e) {
    console.warn('[tryGinifabUploadLocal_iOS] fail =>', e.message);
    return false;
  }
}

/** Android 風格的「上傳本機圖片」 */
async function tryGinifabUploadLocal_Android(page, localImagePath) {
  console.log('[tryGinifabUploadLocal_Android] ...');
  try {
    await tryCloseAd(page);

    const [linkAndroid] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if (!linkAndroid) throw new Error('Android flow: cannot find "上傳本機圖片" link');
    await linkAndroid.click();
    await page.waitForTimeout(1000);

    const [chooseFileBtn] = await page.$x("//a[contains(text(),'選擇檔案') or contains(text(),'挑選檔案')]");
    if (!chooseFileBtn) throw new Error('Android flow: cannot find "選擇檔案" link');
    await chooseFileBtn.click();
    await page.waitForTimeout(1000);

    const fileInput = await page.waitForSelector(FILE_INPUT_SELECTOR, { timeout: 5000 }).catch(() => null);
    if (!fileInput) throw new Error('Android flow: no file input found');
    await fileInput.uploadFile(localImagePath);
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal_Android] success');
    return true;
  } catch (e) {
    console.warn('[tryGinifabUploadLocal_Android] fail =>', e.message);
    return false;
  }
}

/** Desktop 風格的「上傳本機圖片」 */
async function tryGinifabUploadLocal_Desktop(page, localImagePath) {
  console.log('[tryGinifabUploadLocal_Desktop] ...');
  try {
    await tryCloseAd(page);

    const [linkDesktop] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'Upload from PC')]");
    if (!linkDesktop) throw new Error('Desktop flow: cannot find "上傳本機圖片" link');
    await linkDesktop.click();
    await page.waitForTimeout(1000);

    const fileInput = await page.waitForSelector(FILE_INPUT_SELECTOR, { timeout: 5000 }).catch(() => null);
    if (!fileInput) throw new Error('Desktop flow: no file input found');
    await fileInput.uploadFile(localImagePath);
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal_Desktop] success');
    return true;
  } catch (e) {
    console.warn('[tryGinifabUploadLocal_Desktop] fail =>', e.message);
    return false;
  }
}

/** 三合一：依序嘗試 iOS -> Android -> Desktop */
async function tryGinifabUploadLocalAllFlow(page, localImagePath) {
  if (await tryGinifabUploadLocal_iOS(page, localImagePath)) return true;
  if (await tryGinifabUploadLocal_Android(page, localImagePath)) return true;
  if (await tryGinifabUploadLocal_Desktop(page, localImagePath)) return true;
  return false;
}

/** 若本機檔案上傳失敗 => 改「指定圖片網址」 */
async function tryGinifabWithUrl(page, publicImageUrl) {
  console.log('[tryGinifabWithUrl] =>', publicImageUrl);
  try {
    await tryCloseAd(page);
    await page.waitForTimeout(500);

    const found = await page.evaluate(() => {
      const aList = [...document.querySelectorAll('a')];
      const link = aList.find(a => a.innerText.includes('指定圖片網址'));
      if (link) {
        link.click();
        return true;
      }
      return false;
    });
    if (!found) {
      console.warn('[tryGinifabWithUrl] cannot find "指定圖片網址" link');
      return false;
    }

    // 等待輸入框 (可能是 text 或 url 類型)
    await page.waitForSelector(URL_INPUT_SELECTOR, { timeout: 5000 });
    await page.type(URL_INPUT_SELECTOR, publicImageUrl, { delay: 50 });
    await page.waitForTimeout(1000);
    console.log('[tryGinifabWithUrl] typed =>', publicImageUrl);

    return true;
  } catch (e) {
    console.error('[tryGinifabWithUrl] error =>', e.message);
    return false;
  }
}

/**
 * aggregatorSearchGinifab
 * @param {puppeteer.Browser} browser
 * @param {string} localImagePath - 需要上傳的本機檔案路徑 (ex: /data/manualCollected/.../foo.jpg)
 * @param {string} publicImageUrl - 若本機上傳失敗，再貼上的「公開 URL」
 * @returns {Promise<{bing:{success:boolean, links:string[]}, tineye:{success:boolean, links:string[]}, baidu:{success:boolean, links:string[]}}>}
 *
 * 流程：
 *   1) 進入 ginifab => 嘗試 iOS/Android/desktop 本機上傳 => 若成功 => 直接點 Bing/TinEye/Baidu
 *   2) 否則 => 改「指定圖片網址」 => 若成功 => 再點 Bing/TinEye/Baidu
 *   3) 都失敗 => 回傳空
 *   4) 如果成功 => 依序點「微軟必應」「錫眼睛」「百度」，解析新分頁的外部連結
 */
async function aggregatorSearchGinifab(browser, localImagePath, publicImageUrl) {
  const ret = {
    bing:   { success:false, links:[] },
    tineye: { success:false, links:[] },
    baidu:  { success:false, links:[] }
  };
  let page;

  try {
    page = await browser.newPage();
    await page.setViewport({ width:1280, height:800 });
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'domcontentloaded',
      timeout:20000
    });

    // 第一步：嘗試本機上傳 (iOS/Android/PC)
    let successLocal = await tryGinifabUploadLocalAllFlow(page, localImagePath);
    if (!successLocal) {
      // 退而求其次 => 單一方法 "上傳本機圖片"
      console.log('[aggregatorSearchGinifab] allFlow fail => fallback single tryGinifabUploadLocal...');
      successLocal = await tryGinifabUploadLocal_Desktop(page, localImagePath);
    }

    // 若本機上傳仍失敗 => 用指定圖片網址
    if (!successLocal) {
      console.log('[aggregatorSearchGinifab] local upload fail => try URL =>', publicImageUrl);
      successLocal = await tryGinifabWithUrl(page, publicImageUrl);
    }

    // 還是失敗 => aggregator GG
    if (!successLocal) {
      console.warn('[aggregatorSearchGinifab] aggregator FAIL => cannot upload local nor set URL');
      await page.close().catch(()=>{});
      return ret;  // 全空 => aggregator fallback
    }

    // --- 走到這邊 => 代表成功在 ginifab 放圖片(或URL)了 ---
    // 順序點擊 (微軟必應 / 錫眼睛 / 百度) => 會彈新分頁
    const engines = [
      { key:'bing',   label:['微軟必應','Bing'] },
      { key:'tineye', label:['錫眼睛','TinEye'] },
      { key:'baidu',  label:['百度','Baidu'] },
    ];

    for (const eng of engines) {
      try {
        // 監聽新分頁
        const newTabPromise = new Promise(resolve => {
          browser.once('targetcreated', async target => {
            const p = await target.page();
            resolve(p);
          });
        });

        // 在 ginifab 頁面上點擊對應引擎連結
        await page.evaluate(labels => {
          const as = [...document.querySelectorAll('a')];
          for (const lab of labels) {
            const found = as.find(x => x.innerText.includes(lab));
            if (found) {
              found.click();
              return;
            }
          }
        }, eng.label);

        // 等待新分頁 (popup)
        const popupPage = await newTabPromise;
        await popupPage.waitForTimeout(3000);

        // 擷取連結 (過濾 ginifab / bing.com / tineye.com / baidu.com 自己)
        let hrefs = await popupPage.$$eval('a', as => Array.from(as).map(a => a.href));
        hrefs = hrefs.filter(h =>
          h && !h.includes('ginifab.com') &&
          !h.includes('bing.com') &&
          !h.includes('tineye.com') &&
          !h.includes('baidu.com')
        );
        ret[eng.key].links = [...new Set(hrefs)].slice(0, ENGINE_MAX_LINKS);
        ret[eng.key].success = ret[eng.key].links.length > 0;

        await popupPage.close();
      } catch (subErr) {
        console.error(`[aggregatorSearchGinifab][${eng.key}] sub-error =>`, subErr);
      }
    }

  } catch (err) {
    console.error('[aggregatorSearchGinifab] main error =>', err);
  } finally {
    if (page) await page.close().catch(()=>{});
  }

  return ret;
}

module.exports = { aggregatorSearchGinifab };
