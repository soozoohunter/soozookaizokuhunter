// services/aggregatorSearchLink.js

const path = require('path');
const fs   = require('fs');
const axios= require('axios');

const { getMainImageUrl } = require('./imageFetcher');
const { doSearchEngines } = require('../utils/doSearchEngines'); 
// ↑ 假設您把 aggregator & fallback 放在 ../utils/doSearchEngines.js
const { searchImageByVector } = require('../utils/vectorSearch'); 
// ↑ 連到 Python 向量微服務

async function aggregatorSearchLink(pageUrl, localDownloadPath, options={}) {
  try {
    // 1) 先抓主圖URL
    const mainImgUrl = await getMainImageUrl(pageUrl);
    if(!mainImgUrl){
      console.warn('[aggregatorSearchLink] no mainImgUrl => fail');
      return { aggregatorResult:null, vectorResult:null };
    }
    console.log('[aggregatorSearchLink] mainImgUrl =>', mainImgUrl);
    
    // 2) aggregator (ginifab + fallback)
    //    doSearchEngines(localFilePath, aggregatorFirst, aggregatorImageUrl)
    //    我們可以選擇：先不用 localFilePath，僅傳 aggregatorImageUrl
    //    但若您 want fallbackDirect => 需要 local檔 => 於是要先下載
    let localFile='';
    try {
      const dl = await axios.get(mainImgUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(localDownloadPath, dl.data);
      localFile = localDownloadPath;
    } catch(e){
      console.error('[aggregatorSearchLink] download fail =>', e);
      return { aggregatorResult:null, vectorResult:null };
    }
    console.log('[aggregatorSearchLink] local downloaded =>', localFile);

    // aggregator
    const aggregatorResult = await doSearchEngines(localFile, true, mainImgUrl);

    // vector search
    let vectorResult=null;
    if(options.vectorSearch){
      try {
        vectorResult = await searchImageByVector(localFile, { topK:3 });
      } catch(eVec){
        console.error('[aggregatorSearchLink] vector search error =>', eVec);
      }
    }

    // 3) 回傳
    return {
      aggregatorResult,
      vectorResult
    };
  } catch(err){
    console.error('[aggregatorSearchLink] error =>', err);
    return { aggregatorResult:null, vectorResult:null, error:err };
  }
}

module.exports = {
  aggregatorSearchLink
};
