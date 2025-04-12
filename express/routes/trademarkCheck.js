// routes/trademarkCheck.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * [範例] 申請前檢索 (TIPO 的初步示範)
 * GET /api/trademark-check/pre?keyword=...
 */
router.get('/pre', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ error: '缺少 keyword 參數' });
  }

  try {
    // 這裡僅做示範，實際需依 TIPO 網站的表單流程、驗證機制做更多處理
    const targetUrl = 'https://cloud.tipo.gov.tw/S282/S282WV1/';

    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:110.0) Gecko/20100101 Firefox/110.0',
      },
    });

    // 使用 cheerio 解析回傳的 HTML
    const $ = cheerio.load(response.data);
    // 以下僅示範列印整頁標題
    const pageTitle = $('title').text() || 'No Title Found';

    // 在此，你可能需要進一步尋找該網站表單的輸入欄位 name、__VIEWSTATE、__EVENTVALIDATION 等參數
    // 並用 axios.post(...) 提交。這部分需自行再做研究。

    // 假設僅示範回傳頁面標題 + 你傳入的 keyword
    res.json({
      searchType: 'pre',
      keyword,
      tipopageTitle: pageTitle,
      note: '如需真正查詢，請模擬帶入表單的 VIEWSTATE、檢索參數等。'
    });
  } catch (err) {
    console.error('Pre-search error:', err);
    res.status(500).json({ error: '爬蟲失敗或目標網站無法存取' });
  }
});


/**
 * [範例] 申請後維權檢索 (TIPO 的初步示範)
 * GET /api/trademark-check/post?keyword=...
 */
router.get('/post', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ error: '缺少 keyword 參數' });
  }

  try {
    // 與 /pre 類似，也是假設爬 TIPO 首頁當範例
    const targetUrl = 'https://cloud.tipo.gov.tw/S282/S282WV1/';

    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:110.0) Gecko/20100101 Firefox/110.0',
      },
    });

    const $ = cheerio.load(response.data);
    const pageTitle = $('title').text() || 'No Title Found';

    // 假設回傳頁面標題 + keyword
    // 實際上要再去分析表單及 POST/GET 參數
    res.json({
      searchType: 'post',
      keyword,
      tipopageTitle: pageTitle,
      note: '如需真正查詢，請模擬帶入表單的 VIEWSTATE、檢索參數等。'
    });
  } catch (err) {
    console.error('Post-search error:', err);
    res.status(500).json({ error: '爬蟲失敗或目標網站無法存取' });
  }
});

module.exports = router;
