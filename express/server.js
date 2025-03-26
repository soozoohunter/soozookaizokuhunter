/* server.js - Express + PostgreSQL + Redis + RapidAPI + Google API 範例 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const redis = require('redis');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// ====== 1) 直接硬編碼隱私資訊 ======
const DB_USER = 'postgres';
const DB_PASS = 'KaiShieldDbPass123';   // 你的 PostgreSQL 密碼
const DB_NAME = 'kaishield_db';
const DB_HOST = '127.0.0.1';
const DB_PORT = 5432;

// RapidAPI Key (示範用 TikTok Scraper)
const RAPID_API_KEY = '71dbbf39f7msh794002260b4e71bp1025e2jsn652998e0f81a';

// Google API Key (僅示範 Google Drive 列表)
const GOOGLE_API_KEY = 'AIzaSyABCDEFG-XYZ...';

// ====== 2) PostgreSQL Pool ======
const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASS,
  port: DB_PORT,
});

// ====== 3) Redis 連線 (容器內) ======
const redisClient = redis.createClient({ url: 'redis://127.0.0.1:6379' });
redisClient.connect()
  .then(() => console.log('[Express] Redis connected.'))
  .catch(err => console.error('[Express] Redis connect error:', err));

// ====== 4) 路由示範 ======

// (a) 健康檢查 (給 Nginx 或外部用)
app.get('/express/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// (b) DB 測試
app.get('/express/dbtest', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time;');
    res.json({ ok: true, current_time: result.rows[0].current_time });
  } catch (err) {
    console.error('[Express] DB test error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// (c) TikTok 爬蟲 (RapidAPI)
app.get('/express/tiktok-trending', async (req, res) => {
  try {
    const options = {
      method: 'GET',
      url: 'https://tiktok-scraper7.p.rapidapi.com/trending/feed',
      headers: {
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com'
      }
    };
    const response = await axios.request(options);
    res.json({ ok: true, data: response.data });
  } catch (error) {
    console.error('[Express] TikTok scrape error:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// (d) Google Drive 列表 (需啟用 Google Drive API)
app.get('/express/google-drive-list', async (req, res) => {
  try {
    const driveApiUrl = `https://www.googleapis.com/drive/v3/files?key=${GOOGLE_API_KEY}`;
    const { data } = await axios.get(driveApiUrl);
    res.json({ ok: true, files: data.files });
  } catch (error) {
    console.error('[Express] Google API error:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ====== 5) 啟動 Express 伺服器 ======
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] Server running on port ${PORT}...`);
});

對應的 express/package.json：

{
  "name": "suzukaizokuhunter-express",
  "version": "1.0.0",
  "description": "Express server for suzookaizokuhunter.com",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "pg": "^8.10.0",
    "redis": "^4.6.7",
    "axios": "^1.3.4"
  }
}
