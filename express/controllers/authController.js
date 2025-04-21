const bcrypt = require('bcrypt');
const { User } = require('../models');  // 假設從models索引匯出User模型
const blockchainService = require('../services/blockchainService');

async function register(req, res) {
  try {
    const {
      email, username, password, confirmPassword,
      IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, Taobao, eBay,
      role
    } = req.body;

    // 必填欄位檢查
    if (!email || !username || !password) {
      return res.status(400).json({
        message: '請填寫所有必填欄位 (Please fill in all required fields)'
      });
    }
    // 密碼確認檢查
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: '兩次密碼輸入不一致 (Password and confirm password do not match)'
      });
    }
    // 至少一個平台帳號欄位不為空
    const accounts = [IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, Taobao, eBay];
    const hasAccount = accounts.some(acc => acc && acc.trim() !== '');
    if (!hasAccount) {
      return res.status(400).json({
        message: '請提供至少一個社群或電商平台帳號 (Provide at least one social or e-commerce account)'
      });
    }

    // 檢查 email 和 username 是否已存在
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        message: '電子郵件已被使用 (Email already in use)'
      });
    }
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        message: '用戶名已被使用 (Username already taken)'
      });
    }

    // 密碼加密處理
    const hashedPassword = await bcrypt.hash(password, 10);  // 10 為鹽度 [oai_citation_attribution:5‡blog.logrocket.com](https://blog.logrocket.com/password-hashing-node-js-bcrypt/#:~:text=const%20hashedPassword%20%3D%20await%20bcrypt,is%20the%20salt%20rounds%20parameter)

    // 產生 serialNumber（例如使用時間戳加隨機數）
    const uniqueSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const serialNumber = `USER${Date.now()}${uniqueSuffix}`;

    // 設定角色，預設為 'user'
    const userRole = role ? role : 'user';

    // 建立新用戶
    const newUser = await User.create({
      email,
      username,
      password: hashedPassword,
      IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, Taobao, eBay,
      serialNumber,
      role: userRole
    });

    // 同步寫入區塊鏈 (將與UI輸入欄位一致的資料傳給區塊鏈服務)
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
      // 區塊鏈寫入失敗並不阻止註冊流程，可以視需求決定是否在此返回錯誤
    }

    // 回傳成功結果
    return res.status(201).json({
      message: '註冊成功 (Registration successful)'
    });
  } catch (err) {
    console.error('Register error:', err);
    // 處理Sequelize唯一約束錯誤
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

module.exports = { register };
