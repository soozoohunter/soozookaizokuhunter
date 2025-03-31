const axios = require('axios');
const puppeteer = require('puppeteer');

// 請自行於 .env 或 config 引入 RAPIDAPI_KEY
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '<YOUR_KEY>';

async function detectYouTube(keyword) {
  try {
    // 範例: "website-social-scraper" for youtube
    let resp = await axios.get('https://website-social-scraper.p.rapidapi.com/v1/youtube-search', {
      params: { q: keyword },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY
      }
    });
    // resp.data.results => [ {videoId, matchConfidence} ...]
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

async function detectTikTok(keyword) {
  try {
    // 範例: "website-social-scraper" for TikTok
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

async function detectInstagram(keyword) {
  try {
    // 範例: "instagram-scraper" for IG
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

async function detectFacebook(keyword) {
  try {
    // 範例: "facebook-scraper" for FB
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

async function detectShopee(keyword) {
  try {
    // 範例: "shopee-scraper" for Shopee
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

async function detectRuten(keyword) {
  // 使用 puppeteer 針對露天拍賣
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    let searchUrl = `https://find.ruten.com.tw/s/?q=${encodeURIComponent(keyword)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
    
    // 簡易範例: 假設檢查頁面 HTML 是否含某關鍵字
    let content = await page.content();
    if (content.includes('仿冒') || content.includes('未授權')) {
      await browser.close();
      return searchUrl + '#infringed'; 
    }

    await browser.close();
  } catch (e) {
    console.error('ruten detect fail:', e.message);
  }
  return null;
}

// 匯出函式，供外部使用
module.exports = {
  detectYouTube,
  detectTikTok,
  detectInstagram,
  detectFacebook,
  detectShopee,
  detectRuten
};
