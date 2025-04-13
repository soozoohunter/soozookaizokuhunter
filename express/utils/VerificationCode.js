// express/utils/VerificationCode.js

const codes = new Map();
const CODE_EXPIRE = 5 * 60 * 1000; // 5分鐘

module.exports = {
  saveCode(email, code) {
    codes.set(email, { code, verified: false, createdAt: Date.now() });
  },
  verifyCode(email, code) {
    const record = codes.get(email);
    if (!record) return false;
    const now = Date.now();
    if (now - record.createdAt > CODE_EXPIRE) {
      codes.delete(email);
      return false;
    }
    if (record.code !== code) {
      return false;
    }
    // 驗證成功
    record.verified = true;
    return true;
  },
  isVerified(email) {
    const record = codes.get(email);
    return (record && record.verified) || false;
  },
  clearCode(email) {
    codes.delete(email);
  }
};
