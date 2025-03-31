require('dotenv').config(); // ← 確保能載入 .env (若 crawler 需要用到環境變數)

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

// 偵測 API
app.post('/detect', async (req, res) => {
  const { url, fingerprint } = req.body;
  if(!url || !fingerprint) {
    return res.status(400).json({ error: 'Missing url/fingerprint' });
  }

  try {
    // 這裡示範 puppeteer 去爬該 url
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    // ... 做一些指紋比對檢測 ...
    await browser.close();

    // 如果真的檢測到侵權 → 回報 express /dmca/report
    // Demo:
    // const infringingUrl = "https://shopee.tw/infringingItem";
    // await axios.post("http://express:3000/dmca/report", { infringingUrl, workId: 99 });

    res.json({
      message: '偵測完成(示範)，尚未發現侵權', 
      url, 
      fingerprint
    });
  } catch(e) {
    console.error('Crawler detect error:', e.message);
    res.status(500).json({ error: e.toString() });
  }
});

app.listen(8081, () => {
  console.log('Kai Crawler listening on port 8081');
});
