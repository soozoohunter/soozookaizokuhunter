const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const logger = require('../utils/logger');
const { URL } = require('url');

puppeteer.use(StealthPlugin());

const REALISTIC_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';

function resolveUrl(imageUrl, pageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') return null;
    try {
        return new URL(imageUrl, pageUrl).href;
    } catch (e) {
        logger.warn(`[ImageFetcher] Could not resolve invalid URL: ${imageUrl} on page ${pageUrl}`);
        return null;
    }
}

async function getMainImageUrl(pageUrl, browser) {
    let page = null;
    let browserToClose = null;

    try {
        // **OPTIMIZATION**: If a browser instance is passed, use it. Otherwise, launch a new one.
        if (!browser) {
            browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
            });
            browserToClose = browser;
        }

        page = await browser.newPage();
        await page.setUserAgent(REALISTIC_USER_AGENT);
        await page.setViewport({ width: 1920, height: 1080 });
        
        // **FIX**: Increased navigation timeout to 45 seconds for very slow pages.
        await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 45000 });

        let imgUrl = await page.evaluate(() => {
            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage) return ogImage.content;
            const twitterImage = document.querySelector('meta[property="twitter:image"]');
            if (twitterImage) return twitterImage.content;
            return null;
        });

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
        logger.error(`[ImageFetcher] Puppeteer execution failed for ${pageUrl}:`, error.message);
        return null;
    } finally {
        if (page && !page.isClosed()) await page.close();
        if (browserToClose) await browserToClose.close();
    }
}

module.exports = { getMainImageUrl };
