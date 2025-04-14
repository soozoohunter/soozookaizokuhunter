// services/trademarkService.js
const axios = require('axios');

async function searchTrademark(query) {
  const baseUrl = process.env.TRADEMARK_API_URL;
  const apiKey = process.env.TRADEMARK_API_KEY;
  if (!baseUrl) {
    throw new Error('商標 API URL 未設定');
  }
  try {
    // 將查詢參數附加到 URL（假設外部服務使用 HTTP GET 接收查詢字串）
    const url = `${baseUrl}?q=${encodeURIComponent(query)}`;
    const headers = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;  // 若需要 API 金鑰授權
    }
    const response = await axios.get(url, { headers });
    // 假設外部服務返回 JSON 資料
    return response.data;
  } catch (err) {
    console.error('商標查詢失敗', err.response ? err.response.data : err.message);
    throw new Error('商標查詢服務不可用');
  }
}

module.exports = { searchTrademark };
