/********************************************************************
 * controllers/authController.js
 ********************************************************************/
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

const authController = {
  async register(req, res) {
    try {
      const { email, password, userName, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: '缺少 email 或 password' });
      }
      // 檢查是否已被使用
      const exist = await User.findOne({ where: { email } });
      if (exist) {
        return res.status(400).json({ message: '此 Email 已被註冊' });
      }
      // bcrypt 雜湊
      const hashed = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        email,
        password: hashed,
        userName,
        role: role || 'copyright',
        plan: 'BASIC'
      });
      return res.status(201).json({
        message: '註冊成功',
        userId: newUser.id,
        plan: newUser.plan
      });
    } catch (err) {
      console.error('[register error]', err);
      return res.status(500).json({ message: '註冊失敗' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: '缺少 email 或 password' });
      }
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: '帳號或密碼錯誤' });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: '帳號或密碼錯誤' });
      }
      // 簽發 JWT
      const token = jwt.sign({ userId: user.id, plan: user.plan }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({ token });
    } catch (err) {
      console.error('[login error]', err);
      return res.status(500).json({ message: '登入失敗' });
    }
  }
};

module.exports = authController;
