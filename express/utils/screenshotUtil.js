// express/utils/screenshotUtil.js
const fs = require('fs');
const path = require('path');

/** 確保目錄存在 */
function ensureDir(dirPath) {
  if(!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive:true });
  }
}

/** 儲存截圖，會自動建立目錄 */
async function saveScreenshot(page, filePath) {
  ensureDir(path.dirname(filePath));
  try {
    await page.screenshot({ path: filePath, fullPage:true });
    console.log('[saveScreenshot] done =>', filePath);
  } catch(e) {
    console.error('[saveScreenshot] failed =>', e);
  }
}

/** 引擎發生錯誤時做截圖 */
async function handleEngineError(page, engineName, attempt, error) {
  console.error(`[${engineName}] attempt #${attempt} error:`, error);
  const shotPath = path.join('uploads', `${engineName}_error_${Date.now()}.png`);
  await saveScreenshot(page, shotPath);
}

module.exports = {
  ensureDir,
  saveScreenshot,
  handleEngineError
};
