/**
 * File: express/services/aggregatorSearchLink.js
 *
 * 說明：
 *  1. 接收一個 pageUrl (例如 FB/IG/部落格文章)。
 *  2. 用 axios / cheerio 抓該網頁主圖 (og:image 或最大 <img>)。
 *  3. 下載到本機檔案 => localFilePath
 *  4. 呼叫 doSearchEngines(localFilePath, aggregatorFirst=true, aggregatorImageUrl=該主圖URL)
 *  5. (可選) 若 doVector=true，則另外呼叫 searchLocalImage(...)。
 */

const path = require('path');
const fs   = require('fs');
const axios= require('axios');
const cheerio = require('cheerio');

const { doSearchEngines } = require('../utils/doSearchEngines');
const { searchLocalImage } = require('./vectorSearch');

// 1) 先嘗試從 HTML meta og:image
async function getMainImageUrl(pageUrl){
  let html='';
  try {
    const resp = await axios.get(pageUrl, { headers:{ 'User-Agent':'Mozilla/5.0' }});
    html = resp.data;
  } catch(eHttp){
    console.error('[getMainImageUrl] axios fail =>', eHttp.message);
    throw new Error('Fetch page fail => ' + pageUrl);
  }
  const $ = cheerio.load(html);
  let ogImg = $('meta[property="og:image"]').attr('content')
          || $('meta[name="og:image"]').attr('content');
  if(!ogImg){
    // 若沒 og:image => 嘗試抓第一張 <img>
    let bestSrc='';
    $('img').each((i,el)=>{
      const src=$(el).attr('src')||'';
      if(src.startsWith('http')){
        // 暫時取第一張
        bestSrc = bestSrc || src;
      }
    });
    if(!bestSrc) throw new Error('No image found => ' + pageUrl);
    ogImg= bestSrc;
  }
  return ogImg;
}

// aggregatorSearchLink
async function aggregatorSearchLink(pageUrl, tmpDir='./temp', doVector=false) {
  if(!pageUrl) throw new Error('No pageUrl');

  // (1) 取得該網頁的主圖
  const mainImgUrl= await getMainImageUrl(pageUrl);
  console.log('[aggregatorSearchLink] => mainImgUrl=', mainImgUrl);

  // (2) 下載到本機
  const localPath= path.join(tmpDir, `linkImage_${Date.now()}.jpg`);
  try {
    const resp = await axios.get(mainImgUrl, { responseType:'arraybuffer' });
    fs.writeFileSync(localPath, resp.data);
  } catch(eDn){
    throw new Error('Download mainImg fail => ' + eDn.message);
  }

  // (3) doSearchEngines => aggregator + fallback
  let aggregatorResult=null;
  try {
    aggregatorResult= await doSearchEngines(localPath, true, mainImgUrl);
  } catch(eAgg){
    console.error('[aggregatorSearchLink] aggregator error =>', eAgg);
  }

  // (4) 向量
  let vectorResult=null;
  if(doVector){
    try {
      vectorResult= await searchLocalImage(localPath,5);
    } catch(eVec){
      console.error('[aggregatorSearchLink] vector fail =>', eVec);
    }
  }

  // (5) 刪除暫存檔
  try {
    if(fs.existsSync(localPath)) fs.unlinkSync(localPath);
  } catch(eDel){
    console.error('[aggregatorSearchLink] remove file fail =>', eDel);
  }

  return {
    mainImgUrl,
    aggregatorResult,
    vectorResult
  };
}

module.exports = {
  aggregatorSearchLink
};
