// 驗證碼工具：使用記憶體 Map 暫存驗證碼，5 分鐘後失效
const verificationCodes = new Map();

function generateCode(email) {
  // 若該 Email 先前已有驗證碼，清除舊的以避免衝突
  if (verificationCodes.has(email)) {
    const existing = verificationCodes.get(email);
    if (existing.timeoutId) clearTimeout(existing.timeoutId);
    verificationCodes.delete(email);
  }
  // 產生 6 位數隨機驗證碼
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 5 * 60 * 1000; // 當前時間往後5分鐘
  // 設定計時器，5 分鐘後自動從 Map 刪除
  const timeoutId = setTimeout(() => {
    verificationCodes.delete(email);
  }, 5 * 60 * 1000);
  // 暫存驗證碼和相關資訊
  verificationCodes.set(email, { code, expires, timeoutId });
  return code;
}

function verifyCode(email, code) {
  const entry = verificationCodes.get(email);
  if (!entry) {
    return false;
  }
  // 檢查是否已過期
  if (Date.now() > entry.expires) {
    clearTimeout(entry.timeoutId);
    verificationCodes.delete(email);
    return false;
  }
  // 檢查驗證碼是否匹配
  return entry.code === code;
}

function removeCode(email) {
  const entry = verificationCodes.get(email);
  if (entry) {
    clearTimeout(entry.timeoutId);
    verificationCodes.delete(email);
  }
}

module.exports = {
  generateCode,
  verifyCode,
  removeCode
};
