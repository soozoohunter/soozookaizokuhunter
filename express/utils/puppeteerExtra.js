// express/utils/puppeteerExtra.js
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// 加入 Stealth 防偵測
puppeteerExtra.use(StealthPlugin());

module.exports = puppeteerExtra;
