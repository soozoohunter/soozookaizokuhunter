const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.get('/health', (req, res) => {
  res.json({ status: 'Crawler V9 is healthy' });
});

// 通用 detect
app.post('/detect', async (req, res) => {
  const { url, fingerprint } = req.body;
  console.log('[crawler] 要偵測 URL=', url, ' fingerprint=', fingerprint);

  // 在真實情況下 => puppeteer 去爬 url (IG/FB/抖音/YouTube/蝦皮...) => 用 AI/圖像比對 => match => 報 DMCA
  // 這裡示範: 假裝找到1筆侵權
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.content();
    await browser.close();

    // 假設抓到 https://shopee.tw/infringingItem
    const infrUrl = 'https://shopee.tw/infringingItem';

    // 呼叫 Express => /dmca/report
    await axios.post('http://express:3000/dmca/report', {
      infringingUrl: infrUrl,
      workId: 999  // Demo: 999 => 由後端看要怎麼處理
    });

    res.json({ message: '已完成偵測', infrUrl });
  } catch(e) {
    console.error('[crawler] detect error:', e.message);
    res.status(500).json({ error: e.toString() });
  }
});

app.listen(8081, () => {
  console.log('Crawler V9 on port 8081');
});
