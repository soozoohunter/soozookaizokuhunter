// express/services/imageFetcher.js (Robust Version)
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';

async function getMainImageUrl(pageUrl) {
  // 1) 先用 axios 快速嘗試
  try {
    const { data } = await axios.get(pageUrl, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 5000,
    });
    const $ = cheerio.load(data);
    const imgUrl = $('meta[property="og:image"]').attr('content');
    if (imgUrl) {
      logger.info(`[ImageFetcher] Successfully fetched image URL via Axios: ${imgUrl}`);
      return imgUrl;
    }
  } catch (axiosError) {
    logger.warn(`[ImageFetcher] Axios failed for ${pageUrl}, falling back to Puppeteer. Reason: ${axiosError.message}`);
  }

  // 2) 如果 axios 失敗，使用更強大的 Puppeteer
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 20000 });

    const imgUrl = await page.$eval('meta[property="og:image"]', (el) => el.content).catch(() => null);

    if (imgUrl) {
      logger.info(`[ImageFetcher] Successfully fetched image URL via Puppeteer: ${imgUrl}`);
    } else {
      logger.warn(`[ImageFetcher] Puppeteer could not find og:image tag on page: ${pageUrl}`);
    }
    return imgUrl;
  } catch (puppeteerError) {
    logger.error(`[ImageFetcher] Puppeteer failed for URL ${pageUrl}:`, puppeteerError);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  getMainImageUrl,
};
