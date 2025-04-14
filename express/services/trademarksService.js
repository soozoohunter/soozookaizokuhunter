/********************************************************************
 * services/trademarkService.js
 * 商標爬蟲 / API
 ********************************************************************/
const axios = require('axios');

async function searchTrademark(keyword) {
  const baseUrl = process.env.TRADEMARK_API_URL || 'https://cloud.tipo.gov.tw/S282';
  const apiKey = process.env.TRADEMARK_API_KEY;

  // Demo: 模擬
  try {
    // const resp = await axios.get(`${baseUrl}?q=${encodeURIComponent(keyword)}`, {
    //   headers: { Authorization: `Bearer ${apiKey}` }
    // });
    // return resp.data;

    // 假裝沒有可用API => 直接回傳mock
    return {
      from: 'TIPO-FAKE',
      keyword,
      results: [
        { "appl-no": "000000001", "image": "pic_0001.jpg" },
        { "appl-no": "000000002", "image": "pic_0002.jpg" }
      ]
    };
  } catch (err) {
    console.error('[trademarkService] error:', err);
    throw new Error('外部商標服務查詢失敗');
  }
}

module.exports = { searchTrademark };
