const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const takeScreenshot = async (url) => {
    logger.info(`[Scraper] Taking screenshot for url: ${url}`);
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.CHROMIUM_PATH || undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
        await new Promise(r => setTimeout(r, 2000));
        const buffer = await page.screenshot({ fullPage: true, type: 'jpeg', quality: 80 });
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "infringement_evidence", resource_type: "image" },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url);
                }
            );
            uploadStream.end(buffer);
        });
    } catch (error) {
        logger.error(`[Scraper] Failed to take screenshot for ${url}:`, error);
        return null;
    } finally {
        if (browser) await browser.close();
    }
};

module.exports = { takeScreenshot };
