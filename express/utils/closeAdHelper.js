/**
 * express/utils/closeAdHelper.js
 *
 * tryCloseAd - 嘗試在 ginifab 等頁面找「關閉廣告」的按鈕並點擊。
 *  - 預設 maxTimes=2，即最多嘗試關閉兩次廣告。
 *  - 可依實際廣告結構調整 XPath/CSS。
 */

async function tryCloseAd(page, maxTimes = 2) {
  let closedCount = 0;

  for (let i = 0; i < maxTimes; i++) {
    try {
      // 多種 XPath：包含按鈕、span、div 等
      // 文字包含「×」「X」「關閉」等
      const [closeBtn] = await Promise.race([
        page.$x(
          "//button[contains(text(),'×') or contains(text(),'X') or contains(text(),'關閉')]" +
          " | //span[contains(text(),'×') or contains(text(),'X') or contains(text(),'關閉')]" +
          " | //div[contains(text(),'×') or contains(text(),'X') or contains(text(),'關閉')]"
        ),
        // 亦可在這裡再補更多 CSS 選擇器
        page.$('button.close, .close-btn, .modal-close, #ad_box button')
      ]);

      if (closeBtn) {
        console.log('[tryCloseAd] found ad close button => clicking...');
        // 確保滾動到可見範圍後再點擊，避免「not clickable」等問題
        await closeBtn.evaluate(el => {
          el.scrollIntoView({ block: 'center', inline: 'center' });
        });
        // 用 evaluate 執行 click()
        await closeBtn.evaluate(el => el.click());
        await page.waitForTimeout(1500);
        closedCount++;
      } else {
        // 沒找到 => 不再繼續
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
