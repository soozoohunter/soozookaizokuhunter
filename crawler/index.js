require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'Crawler is healthy' });
});

// 偵測 API：假設您想對 url / fingerprint 進行檢查
app.post('/detect', async (req, res) => {
  const { url, fingerprint } = req.body;
  if (!url || !fingerprint) {
    return res.status(400).json({ error: 'Missing url/fingerprint' });
  }

  try {
    // 使用 Dockerfile 中指定的執行檔
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, 
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // (範例) 任何爬蟲 / 偵測邏輯...
    await browser.close();

    res.json({
      message: '成功偵測(示範): 暫無侵權',
      url,
      fingerprint
    });
  } catch (err) {
    console.error('Crawler detect error:', err.message);
    res.status(500).json({ error: err.toString() });
  }
});

// 監聽 0.0.0.0 使外部容器能連線
app.listen(8081, '0.0.0.0', () => {
  console.log('Kai Crawler listening on port 8081');
});
