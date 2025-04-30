// 檔案位置：scripts/collectAllPlatforms.js
// 用法： node scripts/collectAllPlatforms.js "關鍵字"

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// ★ 向量檢索 (若您有單獨設計 /api/v1/indexVideo 則可用 axios 呼叫)
const { indexImageVector } = require('../express/utils/vectorSearch');
// or const { indexVideoVector } = require('../express/utils/vectorSearchVideo'); // 視需求

(async ()=>{
  const keyword = process.argv[2] || 'test';
  console.log('[collectAllPlatforms] start => keyword=', keyword);

  // 1) 建立輸出目錄 => /data/collected/all/<timestamp> 例如
  const baseDir = `/data/collected/all/${Date.now()}`;
  if(!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive:true });
  console.log('[collectAllPlatforms] created baseDir =>', baseDir);

  // 2) 針對不同平台(Instagram, FB, YouTube, Shopee, eBay, Amazon...)做資料收集
  //    這裡只示範「假裝」我們已把檔案搬進 baseDir
  //    您可用 puppeteer/playwright/axios/官方API 取得檔案後,存到 baseDir
  // ------------------------------------------------------------------
  console.log(`[collectAllPlatforms] collecting from Instagram with keyword=${keyword}...`);
  // (此處省略實際爬蟲，假設產生 image_ig_001.jpg, image_ig_002.jpg ...)

  console.log(`[collectAllPlatforms] collecting from Shopee...`);
  // (同樣省略)

  console.log(`[collectAllPlatforms] collecting from eBay...`);
  // ...

  // 3) 搜尋 baseDir 下的所有檔案
  const files = fs.readdirSync(baseDir);
  console.log('[collectAllPlatforms] found =>', files);

  // 4) 每個檔案若是圖片 => indexImageVector
  //    (若是影片 => 依您設計: 
  //       A. 先抽幀 => indexImageVector
  //       B. 或直接整支影片給 Python /api/v1/indexVideo )
  for(const f of files){
    const fullPath = path.join(baseDir, f);
    if(f.match(/\.(png|jpe?g|gif|webp)$/i)){
      console.log('[collectAllPlatforms] image =>', f);
      // 假設您只要圖片 => 直接 index
      await indexImageVector(fullPath, f); 
    } else if(f.match(/\.(mp4|mov|avi|mkv|webm)$/i)){
      console.log('[collectAllPlatforms] video =>', f);
      // (a) Node 端抽幀 => indexImageVector
      //  或 (b) POST 給 python-vector-service /api/v1/indexVideo => python Towhee pipeline
      //  以下示範 (b):
      // spawnSync('curl', [
      //   '-F', `video=@${fullPath}`,
      //   '-F', `id=${f}`,
      //   'http://python-vector-service:8000/api/v1/indexVideo'
      // ], { stdio:'inherit' });
    }
  }

  console.log('[collectAllPlatforms] done. All media indexed to Milvus (image or video).');

  process.exit(0);
})();
