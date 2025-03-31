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

/**
 * detect API - 模擬針對 URL 爬取 & 與 fingerprint 比對
 *  - 依實際需求擴充：TikTok, IG, FB, YouTube, Shopee...
 */
app.post('/detect', async (req, res) => {
  const { url, fingerprint } = req.body;
  if(!url || !fingerprint) {
    return res.status(400).json({ error: '缺少 url 或 fingerprint' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    // ...這裡可做特徵比對 (僅示範)...

    await browser.close();

    // 如果真的發現侵權 → 透過 Express 的 /dmca/report 或其他 route 自動回報
    // 例如:
    // await axios.post('http://express:3000/dmca/report', {
    //   infringingUrl: url,
    //   workId: 123
    // });

    res.json({ message: '偵測完成(範例)', url, fingerprint });
  } catch(e) {
    console.error('Crawler detect error:', e.message);
    res.status(500).json({ error: e.toString() });
  }
});

app.listen(8081, ()=>{
  console.log('Kai Crawler listening on port 8081');
});
