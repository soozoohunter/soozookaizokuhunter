// express/utils/captcha.js

const captchaStore = new Map();

/**
 * 產生隨機 5 碼英文數字
 */
function generateRandomCaptchaString() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
  let text = '';
  for (let i = 0; i < 5; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

/**
 * 建立新的 CAPTCHA，返回 { captchaId, text }
 */
function createCaptcha() {
  const text = generateRandomCaptchaString();
  // 用 timestamp+亂數當 key
  const captchaId = Math.random().toString(36).substring(2);
  const expireTime = Date.now() + 5 * 60 * 1000; // 5 分鐘

  captchaStore.set(captchaId, { text, expireTime });
  return { captchaId, text };
}

/**
 * 驗證使用者輸入的 captcha
 */
function verifyCaptcha(captchaId, userInput) {
  if (!captchaStore.has(captchaId)) return false;
  const entry = captchaStore.get(captchaId);

  if (Date.now() > entry.expireTime) {
    captchaStore.delete(captchaId);
    return false;
  }
  // 不區分大小寫
  const isMatch = entry.text.toLowerCase() === userInput.toLowerCase();
  if (isMatch) {
    // 用過即刪除
    captchaStore.delete(captchaId);
    return true;
  }
  return false;
}

module.exports = {
  createCaptcha,
  verifyCaptcha
};
