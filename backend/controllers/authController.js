const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;
const sequelize = db.sequelize;
const blockchainService = require('../services/blockchainService');

exports.register = async (req, res) => {
  try {
    const { email, userName, password } = req.body;
    // 基本欄位檢查
    if (!userName || !email || !password) {
      return res.status(400).json({
        error: 'Username, email and password are required / 用戶名、電子郵件和密碼為必填項'
      });
    }
    // Email 格式驗證
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format / 電子郵件格式不正確' });
    }
    // 密碼長度驗證（至少6位元）
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters / 密碼至少6個字元' });
    }
    // 檢查使用者名稱或 Email 是否已存在
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered / 電子郵件已被註冊' });
    }
    const existingUser = await User.findOne({ where: { userName } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken / 用戶名已被使用' });
    }

    // 建立使用者並寫入區塊鏈（使用交易確保一致性）
    const t = await sequelize.transaction();
    let newUser;
    try {
      // 在資料庫中創建新使用者
      newUser = await User.create({ email, userName, password }, { transaction: t });
      // 呼叫區塊鏈服務
      await blockchainService.storeUserOnChain({
        serialNumber: newUser.serialNumber,
        userName: newUser.userName,
        email: newUser.email
      });
      await t.commit();
    } catch (err) {
      await t.rollback();
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Email or username already exists / 電子郵件或用戶名已存在' });
      }
      console.error('Registration failed:', err);
      return res.status(500).json({ error: 'User registration failed, please try again / 用戶註冊失敗，請稍後重試' });
    }

    // 回傳
    const resultUser = {
      id: newUser.id,
      userName: newUser.userName,
      email: newUser.email,
      serialNumber: newUser.serialNumber
    };
    return res.status(201).json({
      message: 'Registration successful / 註冊成功',
      user: resultUser
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error / 伺服器錯誤' });
  }
};

exports.login = async (req, res) => {
  try {
    const { userName, password } = req.body;
    // 檢查欄位
    if (!userName || !password) {
      return res.status(400).json({
        error: 'Username and password are required / 用戶名和密碼為必填項'
      });
    }
    // 查詢使用者
    const user = await User.findOne({ where: { userName } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password / 用戶名或密碼不正確' });
    }
    // 比對密碼
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password / 用戶名或密碼不正確' });
    }
    // 產生 JWT
    const token = jwt.sign(
      { userId: user.id, serialNumber: user.serialNumber, userName: user.userName },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '24h' }
    );
    // 回傳
    const resultUser = {
      id: user.id,
      userName: user.userName,
      email: user.email,
      serialNumber: user.serialNumber
    };
    return res.json({
      message: 'Login successful / 登入成功',
      token: token,
      user: resultUser
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error / 伺服器錯誤' });
  }
};
