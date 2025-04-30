// services/imageFetcher.js

const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

async function getMainImageUrl(pageUrl) {
  try {
    // 1) 先嘗試用 axios + cheerio
    const res = await axios.get(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    // 取 og:image
    let imgUrl = $('meta[property="og:image"]').attr('content');
    if (imgUrl) {
      return imgUrl;
    }
    // 也可針對蝦皮 / instagram 做特別解析
    // ... 省略

    // 2) 若沒有 => fallback: puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout:30000 });
    
    // 再抓一次 og:image
    imgUrl = await page.$eval('meta[property="og:image"]', el => el.content).catch(()=>null);
    await browser.close();

    return imgUrl;
  } catch (error) {
    console.error('[imageFetcher] getMainImageUrl fail =>', error);
    throw error;
  }
}

module.exports = {
  getMainImageUrl
};
