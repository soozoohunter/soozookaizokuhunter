// crawler/index.js
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
app.use(bodyParser.json());

// 健康檢查 Endpoint
app.get('/health', (req, res)=>{
  res.json({ status: 'Crawler is healthy' });
});

// 偵測範例
app.post('/detect', async (req, res)=>{
  const { url, fingerprint } = req.body;
  if(!url || !fingerprint) {
    return res.status(400).json({ error: 'Need url + fingerprint' });
  }

  try {
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    // 這裡可以比對 fingerprint 或進行其他爬蟲邏輯
    await browser.close();

    res.json({
      message: '偵測完成(範例)',
      url,
      fingerprint
    });
  } catch(e) {
    console.error('Crawler detect error:', e.message);
    res.status(500).json({ error: e.toString() });
  }
});

// 監聽 0.0.0.0
app.listen(8081, '0.0.0.0', ()=>{
  console.log('Crawler on port 8081');
});
