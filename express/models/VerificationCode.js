// 簡易的驗證碼管理模組（暫存於伺服器記憶體）
// 正式環境可考慮將驗證碼存入資料庫，以支援多伺服器和永久儲存

const codes = new Map();  // 儲存 { email: { code, verified, createdAt } }
const CODE_EXPIRATION_MS = 5 * 60 * 1000;  // 驗證碼有效期間（5分鐘）

module.exports = {
    saveCode(email, code) {
        // 新儲存或覆蓋舊的驗證碼
        codes.set(email, { code, verified: false, createdAt: new Date() });
    },
    verifyCode(email, code) {
        const record = codes.get(email);
        if (!record) return false;
        // 檢查是否過期
        const now = Date.now();
        if (now - record.createdAt.getTime() > CODE_EXPIRATION_MS) {
            codes.delete(email);
            return false;
        }
        // 檢查驗證碼是否匹配
        if (record.code !== code) {
            return false;
        }
        // 標記此 email 的驗證碼已成功驗證
        record.verified = true;
        return true;
    },
    isVerified(email) {
        const record = codes.get(email);
        return record ? record.verified : false;
    },
    clearCode(email) {
        codes.delete(email);
    }
};
