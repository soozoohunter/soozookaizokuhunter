/**************************************************/
/* File: express/services/aggregatorGinifabExtend.js
 * 依照您的 aggregatorGinifab.js 改良拓充         */
/**************************************************/
const { tryCloseAd } = require('./closeAdHelper');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

////////////////////////////////////////
// 若您原本 aggregatorGinifab.js 有如下常數：
////////////////////////////////////////
const GINIFAB_URL = 'https://www.ginifab.com/feeds/reverse_image_search/';
const UA_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.71 Mobile Safari/537.36';

////////////////////////////////////////////////////
// 先保留您原本 aggregator 相關函式(示範空白):
//  1) tryGinifabUploadLocalAllFlow
//  2) tryGinifabUploadLocal_iOS
//  3) tryGinifabUploadLocal_Android
// etc...
////////////////////////////////////////////////////

// 供選擇檔案 input 的通用 selector
const FILE_INPUT_SELECTOR = 'input[type=file], input[type="file"], input[name*=file], input[id*=file]';

/**
 * iOS 風格的本機上傳流程
 * @param {object} page puppeteer Page instance
 * @param {string} localImagePath 要上傳的檔案路徑
 */
async function tryGinifabUploadLocal_iOS(page, localImagePath) {
  console.log('[tryGinifabUploadLocal_iOS] ...');
  try {
    await tryCloseAd(page);

    const [linkiOS] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if (!linkiOS) throw new Error('iOS flow: cannot find "上傳本機圖片" link');
    await linkiOS.click();
    await page.waitForTimeout(1000);

    const [chooseFileBtn] = await page.$x("//a[contains(text(),'選擇檔案') or contains(text(),'挑選檔案')]");
    if (!chooseFileBtn) throw new Error('iOS flow: cannot find "選擇檔案" link');
    await chooseFileBtn.click();
    await page.waitForTimeout(1000);

    const [photoBtn] = await page.$x("//a[contains(text(),'照片圖庫') or contains(text(),'相簿') or contains(text(),'Photo Library')]");
    if (!photoBtn) throw new Error('iOS flow: cannot find "照片圖庫" or "相簿" link');
    await photoBtn.click();
    await page.waitForTimeout(1500);

    const [finishBtn] = await page.$x("//a[contains(text(),'完成') or contains(text(),'Done') or contains(text(),'OK')]");
    if (finishBtn) {
      await finishBtn.click();
      await page.waitForTimeout(800);
    }

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

/**
 * Android 風格的本機上傳流程
 * @param {object} page puppeteer Page instance
 * @param {string} localImagePath 要上傳的檔案路徑
 */
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

/**
 * 依序嘗試 iOS -> Android 兩種本機上傳流程 (以及 Desktop, 若需要)
 */
async function tryGinifabUploadLocalAllFlow(page, localImagePath) {
  if (await tryGinifabUploadLocal_iOS(page, localImagePath)) return true;
  if (await tryGinifabUploadLocal_Android(page, localImagePath)) return true;
  return false;
}

// ============== 新增：向量檢索 & OCR Demo ==============
/**
 * @function callVectorSearchService
 * @description 呼叫 Python 微服務（CLIP + Milvus）進行向量檢索
 * @param {string} localImagePath 圖像檔案路徑
 * @returns {Promise<Array>} 回傳搜尋結果清單 [{ url, score }, ...]
 */
async function callVectorSearchService(localImagePath) {
  const url = process.env.VECTOR_SEARCH_ENDPOINT || 'http://localhost:8000/api/v1/image-search';
  try {
    // 讀取檔案 => base64
    const buf = fs.readFileSync(localImagePath);
    const b64 = buf.toString('base64');

    const form = new FormData();
    form.append('image_base64', b64);
    form.append('top_k', '5');

    const resp = await axios.post(url, form, {
      headers: form.getHeaders(),
      timeout: 30000
    });
    return resp.data.results || [];
  } catch (err) {
    console.error('[callVectorSearchService] error =>', err.message);
    return [];
  }
}

/**
 * @function callOcrService
 * @description 透過 Python OCR API 偵測圖片中文字 (例如 Tesseract / easyOCR)
 * @param {string} localImagePath 圖像檔案路徑
 * @returns {Promise<string>} 偵測到的文字
 */
async function callOcrService(localImagePath) {
  const url = process.env.OCR_ENDPOINT || 'http://localhost:8000/api/v1/ocr';
  try {
    const form = new FormData();
    const buf = fs.readFileSync(localImagePath);
    form.append('file', buf, {
      filename: path.basename(localImagePath),
      contentType: 'image/jpeg'
    });
    const resp = await axios.post(url, form, {
      headers: form.getHeaders(),
      timeout: 30000
    });
    return resp.data?.text || '';
  } catch(err) {
    console.error('[callOcrService] error =>', err.message);
    return '';
  }
}

/**
 * @function fullImageCheckFlow
 * @description 將 Ginifab 反搜、向量檢索、OCR 結果一次整合
 * @param {object} browser Puppeteer Browser instance
 * @param {string} imagePath 本地圖片路徑
 */
async function fullImageCheckFlow(browser, imagePath) {
  try {
    console.log('[fullImageCheckFlow] start =>', imagePath);
    // 1) Ginifab aggregator => 會自動嘗試 iOS / Android
    //    下方假設您已有 tryGinifabUploadLocalAllFlow
    const resultPage = await tryGinifabUploadLocalAllFlow(browser, imagePath);
    const aggregatorUrl = resultPage.url();

    // 2) 向量檢索
    const vectorMatches = await callVectorSearchService(imagePath);
    // 3) OCR
    const ocrText = await callOcrService(imagePath);

    let isLikelyInfringing = false;
    if(ocrText.toLowerCase().includes('kwax')) {
      isLikelyInfringing = true;
    }

    console.log('[fullImageCheckFlow] aggregatorUrl=', aggregatorUrl);
    console.log('[fullImageCheckFlow] vectorMatches=', vectorMatches);
    console.log('[fullImageCheckFlow] ocrText=', ocrText);
    console.log('[fullImageCheckFlow] isLikelyInfringing=', isLikelyInfringing);

    return {
      aggregatorUrl,
      vectorMatches,
      ocrText,
      isLikelyInfringing
    };
  } catch(err) {
    console.error('[fullImageCheckFlow] error =>', err);
    throw err;
  }
}

////////////////////////////////////////////////////
// 最後，將這些 新增 / 改良 後的函式匯出
// (保留您原檔案的 module.exports 也可以)
////////////////////////////////////////////////////
module.exports = {
  tryGinifabUploadLocalAllFlow,
  tryGinifabUploadLocal_iOS,
  tryGinifabUploadLocal_Android,

  // 新增匯出
  callVectorSearchService,
  callOcrService,
  fullImageCheckFlow
};
