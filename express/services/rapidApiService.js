/**
 * express/services/rapidApiService.js
 * - 根據您提供的 RapidAPI 訂閱截圖，修正所有 API 的端點路徑與參數
 */
const axios = require('axios');

// 從環境變數讀取 RapidAPI 各平台主機 (您的 .env 設定是正確的)
const TIKTOK_HOST = process.env.TIKTOK_HOST || 'tiktok-scraper7.p.rapidapi.com';
const INSTAGRAM_HOST = process.env.INSTAGRAM_HOST || 'instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com';
const FACEBOOK_HOST = process.env.FACEBOOK_HOST || 'facebook-data-api2.p.rapidapi.com';
const YOUTUBE_HOST = process.env.YOUTUBE_HOST || 'youtube138.p.rapidapi.com';

async function tiktokSearch(keyword) {
  console.log('[RapidAPI][TikTok] request:', keyword);
  // TikTok 的端點本來就是正確的，保持不變
  const url = `https://${TIKTOK_HOST}/feed/search`;
  try {
    const res = await axios.get(url, {
      params: { keywords: keyword, region: 'us', count: '3' },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': TIKTOK_HOST,
      },
      timeout: 10000,
    });
    console.log('[RapidAPI][TikTok] status:', res.status);
    return res.data;
  } catch (err) {
    console.error('[RapidAPI][TikTok] error:', err.message);
    throw err;
  }
}

async function instagramSearch(keyword) {
  console.log('[RapidAPI][Instagram] request:', keyword);
  // 【修正】: 將路徑從 /search 改為 /hashtag_search_by_query
  const url = `https://${INSTAGRAM_HOST}/hashtag_search_by_query`;
  try {
    const res = await axios.get(url, {
      // 【修正】: 參數為 query，移除不存在的 type 參數
      params: { query: keyword },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': INSTAGRAM_HOST,
      },
      timeout: 10000,
    });
    console.log('[RapidAPI][Instagram] status:', res.status);
    return res.data;
  } catch (err) {
    console.error('[RapidAPI][Instagram] error:', err.message);
    throw err;
  }
}

async function facebookSearch(keyword) {
  console.log('[RapidAPI][Facebook] request:', keyword);
  // 【修正】: 此 API 是 Graph API 的代理，路徑為根目錄 "/"
  const url = `https://${FACEBOOK_HOST}/`;
  try {
    const res = await axios.get(url, {
      // 【修正】: 將搜尋指令放在名為 'path' 的參數中
      params: {
        path: `search?type=post&q=${encodeURIComponent(keyword)}`
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': FACEBOOK_HOST,
      },
      timeout: 10000,
    });
    console.log('[RapidAPI][Facebook] status:', res.status);
    return res.data;
  } catch (err) {
    console.error('[RapidAPI][Facebook] error:', err.message);
    throw err;
  }
}

async function youtubeSearch(keyword) {
  console.log('[RapidAPI][YouTube] request:', keyword);
  // 【修正】: 將路徑從 /Youtube 改為 /search
  const url = `https://${YOUTUBE_HOST}/search`;
  try {
    const res = await axios.get(url, {
      // 參數 'q' 是正確的，保持不變
      params: { q: keyword },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': YOUTUBE_HOST,
      },
      timeout: 10000,
    });
    console.log('[RapidAPI][YouTube] status:', res.status);
    return res.data;
  } catch (err) {
    console.error('[RapidAPI][YouTube] error:', err.message);
    throw err;
  }
}

module.exports = {
  tiktokSearch,
  instagramSearch,
  facebookSearch,
  youtubeSearch,
};
