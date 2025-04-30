// scripts/collectAllPlatforms.js
/**
 * 示範：從多個平台爬取圖片或影片，存到 /data/collected/<platform>/<timestamp>/
 * 
 * Usage: 
 *   node scripts/collectAllPlatforms.js <platform> <keyword>
 *
 * platform: 'tiktok' | 'instagram' | 'facebook' | 'youtube' | ...
 * keyword : 關鍵字
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async ()=>{
  const platform = process.argv[2] || 'tiktok';
  const keyword  = process.argv[3] || 'test';

  console.log(`[collectAllPlatforms] start => platform=${platform}, keyword=${keyword}`);

  // 依平台決定存放目錄
  const now = Date.now();
  const outDir = `/data/collected/${platform}/${now}`;
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 啟動瀏覽器
  const browser = await puppeteer.launch({ headless:true });
  const page = await browser.newPage();

  // 針對不同平台做不同邏輯 (以下皆為「示範偽程式」)
  if(platform==='tiktok'){
    await page.goto(`https://www.tiktok.com/search?q=${encodeURIComponent(keyword)}`, { waitUntil:'domcontentloaded' });
    // 假設 DOM 裡面 a[href*="video/"]
    const videoLinks = await page.evaluate(()=>{
      const anchors = [...document.querySelectorAll('a')].filter(a=> a.href.includes('/video/'));
      return anchors.slice(0,5).map(a=> a.href);
    });
    console.log('[collectAllPlatforms] TikTok videoLinks =>', videoLinks);

    // 下載影片 => (您可用 ffmpeg -i 或其他方式)
    // 這裡只示範，實際不下載
  }
  else if(platform==='instagram'){
    await page.goto(`https://www.instagram.com/explore/tags/${encodeURIComponent(keyword)}/`, { waitUntil:'domcontentloaded' });
    // 假設 DOM 裡面 a[href*="/p/"]
    // ...
  }
  else if(platform==='facebook'){
    // ...
  }
  else if(platform==='youtube'){
    // ...
  }
  else if(platform==='amazon'){
    // ...
  }
  // ... 其他蝦皮、eBay、淘寶、露天 同理

  // (省略：存檔到 outDir 的流程)
  await browser.close();
  console.log(`[collectAllPlatforms] done => files saved into => ${outDir}`);
})();
