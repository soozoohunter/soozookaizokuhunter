// express/utils/closeAdHelper.js

/**
 * tryCloseAd - 嘗試在 ginifab 等頁面找「關閉廣告」的按鈕並點擊。
 *  - 內部會嘗試多組 XPath / CSS 選擇器；你可依實際網頁結構調整。
 *  - 預設 maxTimes=2，即最多嘗試關閉兩次廣告。
 *
 * @param {object} page  puppeteer Page 實例
 * @param {number} maxTimes  最多嘗試次數，預設 2
 * @returns {Promise<boolean>} - 是否成功關掉至少一次
 */
async function tryCloseAd(page, maxTimes = 2) {
  let closedCount = 0;

  for (let i = 0; i < maxTimes; i++) {
    try {
      // 多種 XPath：包含按鈕、span、div 等
      // 文字包含「×」「X」「關閉」等
      // 亦可加入 CSS selector: #ad_box button.close, span#ad_close_btn, ...
      const [closeBtn] = await Promise.race([
        page.$x(
          "//button[contains(text(),'×') or contains(text(),'X') or contains(text(),'關閉')]" +
          " | //span[contains(text(),'×') or contains(text(),'X') or contains(text(),'關閉')]" +
          " | //div[contains(text(),'×') or contains(text(),'X') or contains(text(),'關閉')]"
        ),
        page.$('button.close, .close-btn, .modal-close, #ad_box button')  // 也可再加一層 race
      ]);

      if (closeBtn) {
        console.log('[tryCloseAd] found ad close button => clicking...');
        await closeBtn.click({ delay: 100 }); // 模擬點擊
        await page.waitForTimeout(1500);
        closedCount++;
      } else {
        // 沒找到就不用再繼續嘗試
        break;
      }
    } catch (e) {
      console.warn('[tryCloseAd] click fail =>', e);
      break;
    }
  }

  if (closedCount > 0) {
    console.log(`[tryCloseAd] total closed => ${closedCount}`);
    return true;
  }
  console.log('[tryCloseAd] ad close button not found...');
  return false;
}

module.exports = {
  tryCloseAd
};
