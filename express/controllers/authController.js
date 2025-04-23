/*************************************************************************
 * express/controllers/authController.js
 * - 單一整合版：包含 register 與 login
 * - 透過區塊鏈服務 (blockchainService) 同步寫入，也保留社群/電商欄位檢查
 *************************************************************************/
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const blockchainService = require('../services/blockchainService');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

// ============ 1) 註冊 ============ //
async function register(req, res) {
  try {
    const {
      email, username, password, confirmPassword,
      IG, FB, YouTube, TikTok,
      Shopee, Ruten, Yahoo, Amazon, Taobao, eBay,
      role
    } = req.body;

    // [A] 檢查必填欄位
    if (!email || !username || !password) {
      return res.status(400).json({
        message: '請填寫所有必填欄位 (Please fill in all required fields)'
      });
    }
    if (!confirmPassword) {
      return res.status(400).json({
        message: '缺少 confirmPassword (Missing confirmPassword)'
      });
    }

    // [B] 密碼一致檢查
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: '兩次密碼輸入不一致 (Password and confirm password do not match)'
      });
    }

    // [C] 至少一個社群/電商帳號
    const accounts = [IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, Taobao, eBay];
    const hasAccount = accounts.some(acc => acc && acc.trim() !== '');
    if (!hasAccount) {
      return res.status(400).json({
        message: '請提供至少一個社群或電商平台帳號 (At least one platform account)'
      });
    }

    // [D] 檢查 email / username 是否已存在
    const existEmail = await User.findOne({ where: { email } });
    if (existEmail) {
      return res.status(400).json({
        message: '此 Email 已被使用 (Email already in use)'
      });
    }
    const existUser = await User.findOne({ where: { username } });
    if (existUser) {
      return res.status(400).json({
        message: '此用戶名已被使用 (Username already in use)'
      });
    }

    // [E] 密碼加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // [F] 產生 serialNumber（例如日期＋UUID）
    const dateStr = new Date().toISOString().replace(/[-:.T]/g, '').slice(0, 8);
    const serialNumber = `${dateStr}-${uuidv4().split('-')[0]}`;

    // [G] 設定角色，預設 'user'
    const finalRole = role || 'user';

    // [H] 建立新用戶
    const newUser = await User.create({
      email,
      username,
      password: hashedPassword,
      IG, FB, YouTube, TikTok,
      Shopee, Ruten, Yahoo, Amazon, Taobao, eBay,
      serialNumber,
      role: finalRole
    });

    // [I] 同步寫入區塊鏈
    try {
      await blockchainService.storeUserOnChain({
        email: newUser.email,
        username: newUser.username,
        IG: newUser.IG,
        FB: newUser.FB,
        YouTube: newUser.YouTube,
        TikTok: newUser.TikTok,
        Shopee: newUser.Shopee,
        Ruten: newUser.Ruten,
        Yahoo: newUser.Yahoo,
        Amazon: newUser.Amazon,
        Taobao: newUser.Taobao,
        eBay: newUser.eBay,
        serialNumber: newUser.serialNumber,
        role: newUser.role
      });
    } catch (chainErr) {
      console.error('Blockchain sync error:', chainErr);
      // 失敗時是否要回滾或僅記錄，不影響主要註冊流程，可自行決定
    }

    // [J] 回傳成功
    return res.status(201).json({
      message: '註冊成功 (Registration successful)'
    });
  } catch (err) {
    console.error('Register error:', err);

    // 若違反唯一約束 (SequelizeUniqueConstraintError)
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: '電子郵件或用戶名已被使用 (Email or username already in use)'
      });
    }

    // 其他未預期錯誤
    return res.status(500).json({
      message: '伺服器發生錯誤，無法完成註冊 (Server error: Unable to complete registration)'
    });
  }
}

// ============ 2) 登入 ============ //
async function login(req, res) {
  try {
    // 前端若傳 { email, password } 或 { username, password }
    const { email, username, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: '缺少密碼 (Missing password)' });
    }

    // A) 判斷用 email or username
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (username) {
      user = await User.findOne({ where: { username } });
    } else {
      return res.status(400).json({
        message: '請輸入 email 或 username (Missing email or username)'
      });
    }

    // B) 查無此人
    if (!user) {
      return res.status(400).json({
        message: '帳號或密碼錯誤 (Invalid credentials)'
      });
    }

    // C) 驗證密碼
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({
        message: '帳號或密碼錯誤 (Wrong password)'
      });
    }

    // D) 簽發 JWT
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      username: user.username,
      serialNumber: user.serialNumber,
      role: user.role
    }, JWT_SECRET, { expiresIn: '24h' });

    // E) 回傳
    return res.json({
      message: '登入成功 (Login success)',
      token,
      role: user.role
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({
      message: '登入失敗 (Login failed)'
    });
  }
}

module.exports = {
  register,
  login
};
