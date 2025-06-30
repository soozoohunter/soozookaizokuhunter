// express/services/imageFetcher.js (Final Hardened Version)
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const logger = require('../utils/logger');
const { URL } = require('url'); // Node.js built-in URL module

// Use stealth plugin to make puppeteer requests look more like a real user
puppeteer.use(StealthPlugin());

const REALISTIC_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';

/**
 * Given a URL from a source page, intelligently resolves it to an absolute URL.
 * Handles cases like //domain.com/path or /path.
 * @param {string} imageUrl - The image URL found on the page.
 * @param {string} pageUrl - The URL of the page where the image was found.
 * @returns {string|null} A full, absolute URL or null if invalid.
 */
function resolveUrl(imageUrl, pageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }
  // Use the URL constructor for robust resolving of relative paths.
  try {
    return new URL(imageUrl, pageUrl).href;
  } catch (e) {
    logger.warn(`[ImageFetcher] Could not resolve invalid URL: ${imageUrl}`);
    return null;
  }
}

/**
 * Given a URL, tries various strategies to find the main image URL on that page.
 * @param {string} pageUrl - The URL of the page to scrape.
 * @returns {Promise<string|null>} The URL of the most likely main image, or null if not found.
 */
async function getMainImageUrl(pageUrl) {
  // --- Strategy 1: Fast fetch with Axios + Cheerio ---
  try {
    const { data } = await axios.get(pageUrl, {
      headers: { 'User-Agent': REALISTIC_USER_AGENT },
      timeout: 10000, // 10 second timeout for initial request
    });
    const $ = cheerio.load(data);
    
    let imgUrl = $('meta[property="og:image"]').attr('content') ||
                 $('meta[property="twitter:image"]').attr('content');

    if (imgUrl) {
      const absoluteUrl = resolveUrl(imgUrl, pageUrl);
      if (absoluteUrl) {
        logger.info(`[ImageFetcher] Found image via meta tag (fast method): ${absoluteUrl}`);
        return absoluteUrl;
      }
    }
  } catch (error) {
    logger.warn(`[ImageFetcher] Axios+Cheerio failed for ${pageUrl}. Falling back to Puppeteer. Error: ${error.message}`);
  }

  // --- Strategy 2: Full browser rendering with Puppeteer (slower but more powerful) ---
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    const page = await browser.newPage();
    await page.setUserAgent(REALISTIC_USER_AGENT);
    await page.setViewport({ width: 1280, height: 800 });
    
    // Increased timeout and wait until the page is truly idle
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    let imgUrl = await page.$eval('meta[property="og:image"]', el => el.content).catch(() => null) ||
                 await page.$eval('meta[property="twitter:image"]', el => el.content).catch(() => null);

    if (imgUrl) {
      const absoluteUrl = resolveUrl(imgUrl, pageUrl);
       if (absoluteUrl) {
        logger.info(`[ImageFetcher] Found image via Puppeteer meta tag: ${absoluteUrl}`);
        return absoluteUrl;
       }
    }

    const largestImageSrc = await page.evaluate(() => {
      return Array.from(document.images)
        .filter(img => img.naturalWidth > 200 && img.naturalHeight > 200)
        .sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight))
        .map(img => img.src)[0];
    });

    if (largestImageSrc) {
        const absoluteUrl = resolveUrl(largestImageSrc, pageUrl);
        if (absoluteUrl) {
            logger.info(`[ImageFetcher] Found largest image as fallback: ${absoluteUrl}`);
            return absoluteUrl;
        }
    }
    
    logger.warn(`[ImageFetcher] Puppeteer could not find any suitable image on page: ${pageUrl}`);
    return null;

  } catch (error) {
    logger.error(`[ImageFetcher] Puppeteer execution failed for ${pageUrl}:`, error);
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
