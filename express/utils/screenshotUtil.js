// express/utils/screenshotUtil.js
const fs = require('fs');
const path = require('path');

/**
 * 確保目錄存在，若不存在則建立
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 儲存截圖
 * @param {object} page Puppeteer 的 Page 實例
 * @param {string} filename 包含路徑或檔名
 */
async function saveScreenshot(page, filename) {
  ensureDir(path.dirname(filename));
  try {
    await page.screenshot({ path: filename, fullPage: true });
    console.log('Screenshot saved:', filename);
  } catch (err) {
    console.error('Screenshot failed:', err);
  }
}

/**
 * 引擎錯誤處理 (帶截圖)
 */
async function handleEngineError(page, engineName, attempt, error) {
  console.error(`[${engineName}] attempt #${attempt} error:`, error);
  const errShot = path.join('uploads', `${engineName}_error_${Date.now()}.png`);
  try {
    await saveScreenshot(page, errShot);
  } catch (e) {
    console.error(`[${engineName}] error screenshot failed:`, e);
  }
}

module.exports = {
  ensureDir,
  saveScreenshot,
  handleEngineError
};
