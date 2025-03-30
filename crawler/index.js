const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

app.get('/health', (req, res) => {
  res.json({ status: 'Crawler V7 is healthy' });
});

app.post('/detect', async (req, res) => {
  const { url, fingerprint } = req.body;
  if(!url || !fingerprint) {
    return res.status(400).json({ error: 'Need url & fingerprint' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    const content = await page.content();
    await browser.close();

    // ... 這裡可以比對fingerprint or call fastapi dmca ...
    // 例如:
    await axios.post('http://fastapi:8000/dmca/lawsuit', {
      work_id: 999,
      infringing_url: url
    });

    res.json({ message: '爬蟲完成, DMCA已通報', url, fingerprint });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.toString() });
  }
});

app.listen(8081, () => {
  console.log('Kai Crawler (V7) on port 8081');
});
