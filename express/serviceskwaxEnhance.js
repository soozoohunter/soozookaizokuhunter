// File: express/services/kwaxEnhance.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const imageHash = require('image-hash'); // npm i image-hash
const axios = require('axios');
const { searchLocalImage } = require('./vectorSearch');  // 您原先與 Python 溝通的檔案
// 若您有 aggregatorSearchGinifab, fallbackDirectEngines 都可自行 import

/**
 * [1] runOcrOnImage
 *   - 透過 tesseract CLI 執行 OCR
 *   - 您需要在 Dockerfile 裝上 tesseract-ocr + tesseract-ocr-chi-tra（若要中文）
 */
async function runOcrOnImage(localImagePath, langs='chi_tra+eng') {
  try {
    // 需系統安裝 tesseract
    // -l chi_tra+eng 表示同時支援繁中+英文
    // 也可加 --psm 參數調整 OCR 行為
    const cmd = `tesseract "${localImagePath}" stdout -l ${langs} --dpi 300`;
    const result = execSync(cmd, { encoding:'utf-8', maxBuffer: 20*1024*1024 });
    return result.trim();
  } catch(e) {
    console.error('[runOcrOnImage error]', e.message);
    return '';
  }
}

/**
 * [2] computePhash
 *   - 使用 image-hash (pHash) 進行感知哈希
 *   - npm install image-hash
 *   - pHash 結果可用來快速比對兩張圖是否非常相似（容忍一些小變化）
 */
async function computePhash(localImagePath) {
  return new Promise((resolve, reject)=>{
    imageHash(localImagePath, 16, true, (err, hash)=>{
      if(err) return reject(err);
      resolve(hash); // 例如 'ffffffff00000000ffffffff00000000'
    });
  });
}

/**
 * [3] combineSignals
 *   - 結合 OCR + pHash + CLIP vector 來做多重檢測
 *   - 您可在 /scan/:fileId 的流程把這個函式加進去
 */
async function combineSignals(localImagePath) {
  const results = {
    ocrText: '',
    phash: '',
    vectorSearch: null, // { results: [...] }
  };
  try {
    // 1) OCR
    results.ocrText = await runOcrOnImage(localImagePath, 'chi_tra+eng');

    // 2) pHash
    results.phash = await computePhash(localImagePath);

    // 3) 向量檢索
    results.vectorSearch = await searchLocalImage(localImagePath, 3);

  } catch(e) {
    console.error('[combineSignals error]', e);
  }
  return results;
}

/**
 * [4] multiEngineSearch
 *   - 如果想把 fallbackDirectEngines (Bing/TinEye/Baidu) + aggregatorSearchGinifab 都整合在一起
 *   - 這裡僅示範「呼叫您原先的 fallbackDirectEngines & aggregatorSearchGinifab」
 */
async function multiEngineSearch(localImagePath, aggregatorUrl='') {
  // 1) aggregator
  let aggregatorResult = null;
  let aggregatorOk = false;
  try {
    // aggregatorSearchGinifab(browser, localImagePath, aggregatorUrl)
    // [範例] 這裡僅做假，您可真實呼叫 aggregatorSearchGinifab
    aggregatorResult = {
      bing:   { links:['agg-bing-result1'] },
      tineye: { links:['agg-tineye-result1'] },
      baidu:  { links:['agg-baidu-result1'] }
    };
    aggregatorOk = true;
  } catch(e) {
    console.error('[multiEngineSearch aggregator fail]', e);
  }

  // 2) fallback
  let fallbackResult = null;
  if(!aggregatorOk) {
    const { fallbackDirectEngines } = require('./ginifabEngine'); 
    fallbackResult = await fallbackDirectEngines(localImagePath);
  }

  return { aggregatorResult, fallbackResult };
}


// 匯出
module.exports = {
  runOcrOnImage,
  computePhash,
  combineSignals,
  multiEngineSearch,
};
