const axios = require('axios');

async function tiktokSearch(keyword) {
  console.log('[RapidAPI][TikTok] request:', keyword);
  const url = 'https://tiktok-scraper7.p.rapidapi.com/feed/search';
  try {
    const res = await axios.get(url, {
      params: { keywords: keyword, region: 'us', count: '3' },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com',
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
  const url = 'https://instagram-data1.p.rapidapi.com/search';
  try {
    const res = await axios.get(url, {
      params: { query: keyword, type: 'top' },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'instagram-data1.p.rapidapi.com',
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
  const url = 'https://facebook-data1.p.rapidapi.com/search';
  try {
    const res = await axios.get(url, {
      params: { query: keyword },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'facebook-data1.p.rapidapi.com',
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
  const url = 'https://youtube-search-results.p.rapidapi.com/youtube-search';
  try {
    const res = await axios.get(url, {
      params: { q: keyword },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'youtube-search-results.p.rapidapi.com',
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
