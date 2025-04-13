// express/utils/VerificationCode.js (純物件版)
const codes = new Map();
const EXPIRE_MS = 5 * 60 * 1000; // 5分鐘

module.exports = {
  saveCode(email, code) {
    codes.set(email, { code, verified: false, createdAt: Date.now() });
  },
  verifyCode(email, code) {
    const record = codes.get(email);
    if (!record) return false;
    if (Date.now() - record.createdAt > EXPIRE_MS) {
      codes.delete(email);
      return false;
    }
    if (record.code !== code) {
      return false;
    }
    record.verified = true;
    return true;
  },
  isVerified(email) {
    const rec = codes.get(email);
    return rec ? rec.verified : false;
  },
  clearCode(email) {
    codes.delete(email);
  }
};
