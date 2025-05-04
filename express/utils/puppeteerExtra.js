/**
 * express/utils/puppeteerExtra.js
 *
 * 使用 puppeteer-extra + StealthPlugin，降低被搜尋網站的防爬機率。
 */

const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// 安裝 StealthPlugin
puppeteerExtra.use(StealthPlugin());

module.exports = puppeteerExtra;
