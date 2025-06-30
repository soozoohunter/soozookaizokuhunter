// express/services/imageFetcher.js (Upgraded Version)
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const logger = require('../utils/logger');

puppeteer.use(StealthPlugin());

/**
 * Given a URL, tries various strategies to find the main image URL on that page.
 * @param {string} pageUrl - The URL of the page to scrape.
 * @returns {Promise<string|null>} The URL of the most likely main image, or null if not found.
 */
async function getMainImageUrl(pageUrl) {
  // Strategy 1: Simple fetch with Cheerio (fastest)
  try {
    const { data } = await axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const $ = cheerio.load(data);

    // Prioritize standard meta tags
    let imgUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[property="twitter:image"]').attr('content');

    if (imgUrl) {
      logger.info(`[ImageFetcher] Found image via meta tag: ${imgUrl}`);
      return new URL(imgUrl, pageUrl).href;
    }
  } catch (error) {
    logger.warn(`[ImageFetcher] Axios+Cheerio failed for ${pageUrl}. Falling back to Puppeteer. Error: ${error.message}`);
  }

  // Strategy 2: Full browser rendering with Puppeteer (slower but more powerful)
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new', // Use the new headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 20000 });

    // Try meta tags again after JavaScript execution
    let imgUrl =
      (await page.$eval('meta[property="og:image"]', (el) => el.content).catch(() => null)) ||
      (await page.$eval('meta[property="twitter:image"]', (el) => el.content).catch(() => null));

    if (imgUrl) {
      logger.info(`[ImageFetcher] Found image via Puppeteer meta tag: ${imgUrl}`);
      return new URL(imgUrl, pageUrl).href;
    }

    // **NEW**: Fallback strategy - find the largest image on the page
    const largestImageSrc = await page.evaluate(() => {
      return Array.from(document.images)
        .filter((img) => img.naturalWidth > 200 && img.naturalHeight > 200)
        .sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight)
        .map((img) => img.src)[0];
    });

    if (largestImageSrc) {
      logger.info(`[ImageFetcher] Found largest image as fallback: ${largestImageSrc}`);
      return new URL(largestImageSrc, pageUrl).href;
    }

    logger.warn(`[ImageFetcher] Puppeteer could not find any suitable image on page: ${pageUrl}`);
    return null;
  } catch (error) {
    logger.error(`[ImageFetcher] Puppeteer failed for ${pageUrl}:`, error);
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
