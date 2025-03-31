/********************************************
 * crawler/index.js
 ********************************************/
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const puppeteer = require('puppeteer');

// 在此直接寫死 RAPIDAPI_KEY（範例）
const RAPIDAPI_KEY = '71dbbf39f7msh794002260b4e71bp1025e2jsn652998e0f81a';

const app = express();
app.use(bodyParser.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'Crawler V1 Ultimate healthy' });
});

/**
 * POST /detectInfringement
 * body: { fingerprint, workId, role }
 * 若 role=shortVideo => [youtube, tiktok, instagram, facebook]
 * 若 role=ecommerce => [shopee, ruten, ebay, amazon]
 * 用於多平台爬蟲偵測
 */
app.post('/detectInfringement', async (req, res) => {
  const { fingerprint, workId, role } = req.body;
  if (!fingerprint || !workId) {
    return res.status(400).json({ error: '缺少 fingerprint 或 workId' });
  }

  console.log(`crawler: detect => fingerprint=${fingerprint.slice(0, 10)}, wId=${workId}, role=${role}`);

  // 短影音 => youtube, tiktok, instagram, facebook
  // 電商 => shopee, ruten, ebay, amazon
  let platforms = (role === 'shortVideo')
    ? ['youtube', 'tiktok', 'instagram', 'facebook']
    : ['shopee', 'ruten', 'ebay', 'amazon'];

  let results = [];
  for (let pf of platforms) {
    let foundUrl = await detectPlatform(pf, fingerprint);
    if (foundUrl) {
      results.push({ platform: pf, url: foundUrl });

      // 通知 Express -> /api/infr/dmca (範例)
      try {
        await axios.post('http://express:3000/api/infr/dmca', {
          workId,
          infringingUrl: foundUrl
        }, {
          headers: {
            // 若後端有驗證需求，請在此放適當的 JWT token
            'Authorization': 'Bearer CrawlerInternalToken'
          }
        });
      } catch (err) {
        console.error('DMCA call fail:', err.message);
      }
    }
  }

  res.json({
    message: '偵測完成',
    foundInfringements: results
  });
});

// 動態選擇平台
async function detectPlatform(platform, fingerprint) {
  const key8 = fingerprint.slice(0, 8);
  switch (platform) {
    case 'youtube':   return await detectYouTube(key8);
    case 'tiktok':    return await detectTikTok(key8);
    case 'instagram': return await detectInstagram(key8);
    case 'facebook':  return await detectFacebook(key8);
    case 'shopee':    return await detectShopee(key8);
    case 'ruten':     return await detectRuten(key8);
    case 'ebay':      return await detectEbay(key8);
    case 'amazon':    return await detectAmazon(key8);
    default:          return null;
  }
}

/******************************************************
 * 各平台偵測函式
 ******************************************************/

// 1. YouTube
async function detectYouTube(keyword) {
  try {
    let resp = await axios.get('https://website-social-scraper.p.rapidapi.com/v1/youtube-search', {
      params: { q: keyword },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY
      }
    });
    // resp.data.results => [ { videoId, matchConfidence } ...]
    let hits = resp.data.results || [];
    let match = hits.find(x => x.matchConfidence >= 95);
    if (match) {
      return `https://www.youtube.com/watch?v=${match.videoId}`;
    }
  } catch (e) {
    console.error('youtube detect fail:', e.message);
  }
  return null;
}

// 2. TikTok
async function detectTikTok(keyword) {
  try {
    let resp = await axios.get('https://website-social-scraper.p.rapidapi.com/v1/tiktok-search', {
      params: { q: keyword },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY
      }
    });
    let hits = resp.data.results || [];
    let match = hits.find(x => x.matchConfidence >= 95);
    if (match) {
      return `https://www.tiktok.com/@someUser/video/${match.videoId}`;
    }
  } catch (e) {
    console.error('tiktok detect fail:', e.message);
  }
  return null;
}

// 3. Instagram
async function detectInstagram(keyword) {
  try {
    let resp = await axios.get('https://instagram-scraper-advanced.p.rapidapi.com/ig/search', {
      params: { query: keyword },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY
      }
    });
    let hits = resp.data.results || [];
    let match = hits.find(x => x.matchConfidence >= 95);
    if (match) {
      return `https://www.instagram.com/p/${match.postId}`;
    }
  } catch (e) {
    console.error('instagram detect fail:', e.message);
  }
  return null;
}

// 4. Facebook
async function detectFacebook(keyword) {
  try {
    let resp = await axios.get('https://facebook-scraper.p.rapidapi.com/api/v1/search', {
      params: { q: keyword },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY
      }
    });
    let hits = resp.data.results || [];
    let match = hits.find(x => x.matchConfidence >= 95);
    if (match) {
      return `https://www.facebook.com/${match.pageId}`;
    }
  } catch (e) {
    console.error('facebook detect fail:', e.message);
  }
  return null;
}

// 5. Shopee
async function detectShopee(keyword) {
  try {
    let resp = await axios.get('https://shopee-scraper.p.rapidapi.com/search', {
      params: { query: keyword, country: 'TW' },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY
      }
    });
    let hits = resp.data.items || [];
    let match = hits.find(x => x.matchConfidence >= 95);
    if (match) {
      return `https://shopee.tw/product/${match.shopId}/${match.itemId}`;
    }
  } catch (e) {
    console.error('shopee detect fail:', e.message);
  }
  return null;
}

// 6. 露天(Ruten)
async function detectRuten(keyword) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    let url = `https://find.ruten.com.tw/s/?q=${keyword}`;
    await page.goto(url, { waitUntil: 'networkidle2' });
    let content = await page.content();
    await browser.close();

    if (content.includes('仿冒') || content.includes('未授權')) {
      return url;
    }
  } catch (e) {
    console.error('ruten detect fail:', e.message);
  }
  return null;
}

// 7. eBay
async function detectEbay(keyword) {
  try {
    let resp = await axios.get('https://website-social-scraper.p.rapidapi.com/v1/ebay-search', {
      params: { q: keyword },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY
      }
    });
    let hits = resp.data.results || [];
    let match = hits.find(x => x.matchConfidence >= 95);
    if (match) {
      return `https://www.ebay.com/itm/${match.itemId}`;
    }
  } catch (e) {
    console.error('ebay detect fail:', e.message);
  }
  return null;
}

// 8. Amazon
async function detectAmazon(keyword) {
  try {
    let resp = await axios.get('https://website-social-scraper.p.rapidapi.com/v1/amazon-search', {
      params: { q: keyword },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY
      }
    });
    let hits = resp.data.results || [];
    let match = hits.find(x => x.matchConfidence >= 95);
    if (match) {
      return `https://www.amazon.com/dp/${match.asin}`;
    }
  } catch (e) {
    console.error('amazon detect fail:', e.message);
  }
  return null;
}

// 啟動伺服器
app.listen(8081, () => {
  console.log('Crawler V1 Ultimate on port 8081');
});
