const axios = require('axios');

// 從環境變數讀取 RapidAPI 各平台主機，若未設置則使用預設值
const TIKTOK_HOST = process.env.TIKTOK_HOST || 'tiktok-scraper7.p.rapidapi.com';
const INSTAGRAM_HOST = process.env.INSTAGRAM_HOST || 'instagram-data1.p.rapidapi.com';
const FACEBOOK_HOST = process.env.FACEBOOK_HOST || 'facebook-data1.p.rapidapi.com';
const YOUTUBE_HOST = process.env.YOUTUBE_HOST || 'Youtube-results.p.rapidapi.com';

async function tiktokSearch(keyword) {
  console.log('[RapidAPI][TikTok] request:', keyword);
  const url = `https://${TIKTOK_HOST}/feed/search`; // 使用環境變數
  try {
    const res = await axios.get(url, {
      params: { keywords: keyword, region: 'us', count: '3' },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': TIKTOK_HOST, // 使用環境變數
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
  const url = `https://${INSTAGRAM_HOST}/search`; // 使用環境變數
  try {
    const res = await axios.get(url, {
      params: { query: keyword, type: 'top' },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': INSTAGRAM_HOST, // 使用環境變數
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
  const url = `https://${FACEBOOK_HOST}/search`; // 使用環境變數
  try {
    const res = await axios.get(url, {
      params: { query: keyword },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': FACEBOOK_HOST, // 使用環境變數
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
  const url = `https://${YOUTUBE_HOST}/Youtube`; // 使用環境變數
  try {
    const res = await axios.get(url, {
      params: { q: keyword },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': YOUTUBE_HOST, // 使用環境變數
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
