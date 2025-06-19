const axios = require('axios');

// 1) TikTok 搜索
async function searchTikTok(keywords) {
  const res = await axios.get(`https://${process.env.TIKTOK_HOST}/feed/search`, {
    params: { keywords, region: 'us', count: 10 },
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': process.env.TIKTOK_HOST,
    },
  });
  return res.data;
}

// 2) Facebook 帖子详情
async function getFacebookPost(postId) {
  const res = await axios.get(`https://${process.env.FACEBOOK_HOST}/post/details`, {
    params: { id: postId },
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': process.env.FACEBOOK_HOST,
    },
  });
  return res.data;
}

// 3) Instagram 帖子评论
async function getInstagramComments(mediaId, cursor) {
  const res = await axios.get(`https://${process.env.INSTAGRAM_HOST}/get-post-comments`, {
    params: { mediaId, pagination_token: cursor },
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': process.env.INSTAGRAM_HOST,
    },
  });
  return res.data;
}

// 4) YouTube 自动补全
async function autoCompleteYouTube(q) {
  const res = await axios.get(`https://${process.env.YOUTUBE_HOST}/auto-complete`, {
    params: { q, hl: 'en', gl: 'US' },
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': process.env.YOUTUBE_HOST,
    },
  });
  return res.data;
}

module.exports = {
  searchTikTok,
  getFacebookPost,
  getInstagramComments,
  autoCompleteYouTube,
};
