const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

app.get('/health', (req, res) => {
  res.json({ status: 'Crawler is healthy' });
});

app.post('/detect', async (req, res) => {
  const { url, fingerprint } = req.body;
  if (!url || !fingerprint) return res.status(400).json({ error: 'Missing url or fingerprint' });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    // ...檢測相似度 or 內容 (省略)...

    await browser.close();

    // 若判定侵權
    const infringingUrl = url;
    // call fastapi
    await axios.post('http://fastapi:8000/recordInfringement', {
      fingerprint,
      infringing_url: infringingUrl
    });

    res.json({ message: 'Scan done, possibly infringement recorded' });
  } catch (err) {
    console.error('Crawler error:', err);
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(8081, () => {
  console.log('Kai Crawler on port 8081');
});
