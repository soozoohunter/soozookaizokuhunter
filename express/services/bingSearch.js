const fs = require('fs');
const path = require('path');

/**
 * 使用 Bing 進行以圖搜尋。
 * @param {puppeteer.Browser} browser - 傳入已啟動的 Puppeteer 瀏覽器實例。
 * @param {string} imagePath - 要搜尋的影像檔案路徑。
 * @returns {Object} 包含搜尋成功與否及找到的連結列表等資訊。
 */
async function searchImageBing(browser, imagePath) {
    const result = { success: false, engine: 'Bing', links: [], error: null };
    let page;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            page = await browser.newPage();
            // 設定較寬鬆的viewport，避免RESPONSIVE介面影響元素選擇
            await page.setViewport({ width: 1280, height: 800 });
            // 前往 Bing 圖片搜尋首頁
            await page.goto('https://www.bing.com/images', { waitUntil: 'domcontentloaded' });
            // 點擊相機圖示以開啟「以圖搜尋」上傳介面（若需要）
            try {
                const uploadIcon = await page.$('a[title="使用影像進行搜尋"]');
                if (uploadIcon) {
                    await uploadIcon.click();
                }
            } catch (err) {
                // 如果找不到圖示，可能介面已直接顯示上傳按鈕，忽略此錯誤
            }
            // 等待文件中出現檔案上傳 input 元素
            const fileInputSelector = 'input[type=file]';
            await page.waitForSelector(fileInputSelector, { timeout: 5000 });
            const fileInput = await page.$(fileInputSelector);
            // 上傳影像檔案
            await fileInput.uploadFile(imagePath);
            // 觸發變更事件（某些站點需要手動 dispatch）
            await fileInput.evaluate(input => {
                const evt = new Event('change', { bubbles: true });
                input.dispatchEvent(evt);
            });
            // 等待結果區域加載；Bing 通常自動跳轉或加載結果
            // 嘗試等待結果縮圖出現
            await page.waitForSelector('.mimg', { timeout: 15000 });
            
            // 提取搜尋結果連結（Bing 以圖搜尋結果在縮圖點擊後才出現連結，這裡提取縮圖對應的目標頁面連結）
            // 方法：取得所有縮圖父元素的連結
            const links = await page.$$eval('a[href^="https://www.bing.com/images/search?view=detailv2"]', anchors =>
                Array.from(anchors).map(a => a.href)
            );
            result.links = links;
            
            // 成功取得結果
            result.success = true;
            // （可選）截圖保存結果頁面
            await page.screenshot({ path: path.join(__dirname, `../logs/bing_result_${Date.now()}.png`) });
            break;  // 跳出重試循環
        } catch (err) {
            result.error = err.message;
            console.error(`Bing 搜尋嘗試第 ${attempt} 次失敗:`, err);
            if (page) await page.close().catch(e => {});  // 確保關閉頁面
            if (attempt === 3) {
                // 最終嘗試仍失敗，截圖留證
                if (page) {
                    await page.screenshot({ path: path.join(__dirname, `../logs/bing_error_${Date.now()}.png`) }).catch(e=>{});
                }
                // 錯誤訊息可更改為自訂內容
                throw new Error(`Bing 圖片搜尋失敗: ${err.message}`);
            }
            // 短暫等待再重試
            await new Promise(res => setTimeout(res, 2000));
            continue;
        } finally {
            // 如成功（跳出循環前）或發生異常，都關閉該 page（若尚未關閉）
            if (page && !page.isClosed()) {
                await page.close().catch(e => {});
            }
        }
    }
    return result;
}

module.exports = { searchImageBing };
