// routes/trademarkCheck.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// ★ 如果要上鏈紀錄，請匯入 chain (假設路徑為 ../utils/chain.js)
const chain = require('../utils/chain'); // 若無此檔，請自行建立 chain.js

/**
 * ----------------------------------------
 *  A) 申請前檢索 (/pre)
 *      GET /api/trademark-check/pre?keyword=...
 * ----------------------------------------
 */
router.get('/pre', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ error: '缺少 keyword 參數' });
  }

  try {
    // 以下僅示範: 假設要爬 TIPO 某段頁面(實際需動態操作)
    const targetUrl = `https://cloud.tipo.gov.tw/S282/S282WV1/#/?searchBy=text&kw=${encodeURIComponent(keyword)}`;

    // 用 axios 抓頁面 (示範: 可能需 Cookie / form data / headless 等, 這裡簡化)
    const response = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    // 解析 HTML (若 TIPO 網頁是動態JS載入, cheerio 可能撈不到)
    const $ = cheerio.load(response.data);
    const results = [];

    // 假裝搜尋結果區域
    $('.search-result-item').each((i, el) => {
      const name = $(el).find('.trademark-name').text().trim();
      const status = $(el).find('.trademark-status').text().trim();
      results.push({ name, status });
    });

    // ★ 上鏈: 紀錄查詢行為
    try {
      await chain.writeCustomRecord(
        'TRADEMARK_CHECK',
        `type=PRE|keyword=${keyword}|count=${results.length}`
      );
    } catch (chainErr) {
      console.error('[Chain Error] pre-search:', chainErr);
    }

    // 回傳 JSON 結果
    res.json({
      searchType: 'pre',
      keyword,
      dataCount: results.length,
      results,
    });
  } catch (err) {
    console.error('Pre-search error:', err);
    res.status(500).json({ error: '爬蟲失敗或目標網站無法存取' });
  }
});

/**
 * ----------------------------------------
 *  B) 申請後維權檢索 (/post)
 *      GET /api/trademark-check/post?keyword=...
 * ----------------------------------------
 */
router.get('/post', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ error: '缺少 keyword 參數' });
  }

  try {
    // 範例: 後端查 "圖形" 或 "文字" 皆可; 這裡舉例傳 "searchBy=mark"
    const targetUrl = `https://cloud.tipo.gov.tw/S282/S282WV1/#/?searchBy=mark&kw=${encodeURIComponent(keyword)}`;

    const response = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // 假裝搜尋結果區域 (自行修改對應 TIPO 頁面元素)
    $('.infringement-item').each((i, el) => {
      const caseNumber = $(el).find('.case-num').text().trim();
      const infringementDesc = $(el).find('.case-desc').text().trim();
      results.push({ caseNumber, infringementDesc });
    });

    // ★ 上鏈
    try {
      await chain.writeCustomRecord(
        'TRADEMARK_CHECK',
        `type=POST|keyword=${keyword}|count=${results.length}`
      );
    } catch (chainErr) {
      console.error('[Chain Error] post-search:', chainErr);
    }

    res.json({
      searchType: 'post',
      keyword,
      dataCount: results.length,
      results,
    });
  } catch (err) {
    console.error('Post-search error:', err);
    res.status(500).json({ error: '爬蟲失敗或目標網站無法存取' });
  }
});

/**
 * ----------------------------------------
 *  C) 文字檢索 (/text)
 *      GET /api/trademark-check/text?keyword=...
 * ----------------------------------------
 */
router.get('/text', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ error: '缺少 keyword 參數' });
  }

  try {
    // 對應 TIPO 的 "文字檢索" => searchBy=text
    const targetUrl = `https://cloud.tipo.gov.tw/S282/S282WV1/#/?searchBy=text&kw=${encodeURIComponent(keyword)}`;

    const response = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // 下面為示範: 依實際頁面 DOM 而定
    $('.search-result-item').each((i, el) => {
      const markName = $(el).find('.mark-name').text().trim();
      const markStatus = $(el).find('.mark-status').text().trim();
      results.push({ markName, markStatus });
    });

    // 上鏈: 紀錄這次檢索行為
    try {
      await chain.writeCustomRecord(
        'TRADEMARK_CHECK',
        `type=TEXT|keyword=${keyword}|count=${results.length}`
      );
    } catch (chainErr) {
      console.error('[Chain Error] text-search:', chainErr);
    }

    res.json({
      searchType: 'text',
      keyword,
      dataCount: results.length,
      results,
    });
  } catch (err) {
    console.error('[Text-search error]', err);
    res.status(500).json({ error: '爬蟲失敗或目標網站無法存取' });
  }
});

/**
 * ----------------------------------------
 *  D) 圖形檢索 (/mark)
 *      GET /api/trademark-check/mark?keyword=...
 * ----------------------------------------
 */
router.get('/mark', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ error: '缺少 keyword 參數' });
  }

  try {
    // TIPO 圖形檢索 => searchBy=mark
    const targetUrl = `https://cloud.tipo.gov.tw/S282/S282WV1/#/?searchBy=mark&kw=${encodeURIComponent(keyword)}`;

    const response = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.search-result-graphic').each((i, el) => {
      const markTitle = $(el).find('.graphic-title').text().trim();
      const markStatus = $(el).find('.graphic-status').text().trim();
      results.push({ markTitle, markStatus });
    });

    // 上鏈
    try {
      await chain.writeCustomRecord(
        'TRADEMARK_CHECK',
        `type=MARK|keyword=${keyword}|count=${results.length}`
      );
    } catch (chainErr) {
      console.error('[Chain Error] mark-search:', chainErr);
    }

    res.json({
      searchType: 'mark',
      keyword,
      dataCount: results.length,
      results,
    });
  } catch (err) {
    console.error('[Mark-search error]', err);
    res.status(500).json({ error: '爬蟲失敗或目標網站無法存取' });
  }
});

/** 
 * (可選) E) 若要圖片檢索 (/image)，可再新增一隻
 * router.get('/image', async (req, res) => { ... });
 */

module.exports = router;
