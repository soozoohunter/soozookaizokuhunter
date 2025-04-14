// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const AuthController = {
  // 使用者註冊
  register: async (req, res, next) => {
    try {
      const { email, password, name, contact } = req.body;
      // 檢查 email 是否已被使用
      let existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email 已被註冊' });
      }
      // 雜湊使用者密碼
      const passwordHash = await bcrypt.hash(password, 10);
      // 建立新使用者（預設 plan 為 free）
      const user = await User.create({ email, passwordHash, name, contact });
      // 簽發 JWT，payload 可包含用戶ID與 plan
      const token = jwt.sign(
        { userId: user._id, plan: user.plan }, 
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.status(201).json({ token });  // 回傳 JWT token
    } catch (err) {
      next(err);
    }
  },

  // 使用者登入
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: '帳號或密碼不正確' });
      }
      // 驗證密碼
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ message: '帳號或密碼不正確' });
      }
      // 簽發 JWT，附帶用戶方案資訊
      const token = jwt.sign(
        { userId: user._id, plan: user.plan },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({ token });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AuthController;
