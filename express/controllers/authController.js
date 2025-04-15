// controllers/authController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');               // 假設使用 Sequelize 定義 User 模型
const User = db.User;
const blockchainService = require('../services/blockchainService');

exports.register = async (req, res) => {
  try {
    const {
      userName, 
      password, 
      email, 
      serialNumber,
      ig, fb, youtube, tiktok, shopee, ruten, ebay, amazon, taobao 
    } = req.body;

    // 簡單欄位檢查
    if (!userName || !password || !email || !serialNumber) {
      return res.status(400).json({ success: false, message: '缺少必要的註冊資訊。' });
    }

    // 檢查使用者名稱或 Email 是否已被使用
    const existingByName = await User.findOne({ where: { userName } });
    if (existingByName) {
      return res.status(400).json({ success: false, message: '使用者名稱已被註冊。' });
    }
    const existingByEmail = await User.findOne({ where: { email } });
    if (existingByEmail) {
      return res.status(400).json({ success: false, message: '電子信箱已被註冊。' });
    }

    // 密碼加密處理
    const hashedPassword = await bcrypt.hash(password, 10);

    // 建立新會員資料（將未提供的社群帳號欄位設為空字串）
    const newUser = await User.create({
      userName,
      password: hashedPassword,
      email,
      serialNumber,
      ig: ig || '',
      fb: fb || '',
      youtube: youtube || '',
      tiktok: tiktok || '',
      shopee: shopee || '',
      ruten: ruten || '',
      ebay: ebay || '',
      amazon: amazon || '',
      taobao: taobao || ''
    });

    // 將會員資料寫入區塊鏈
    let txHash;
    try {
      txHash = await blockchainService.storeUserOnChain({
        userName: newUser.userName,
        email: newUser.email,
        serialNumber: newUser.serialNumber,
        ig: newUser.ig || '',
        fb: newUser.fb || '',
        youtube: newUser.youtube || '',
        tiktok: newUser.tiktok || '',
        shopee: newUser.shopee || '',
        ruten: newUser.ruten || '',
        ebay: newUser.ebay || '',
        amazon: newUser.amazon || '',
        taobao: newUser.taobao || ''
      });
    } catch (error) {
      console.error('Blockchain Error:', error);
      // 區塊鏈寫入失敗，刪除先前新增的使用者，避免不一致
      await newUser.destroy();
      return res.status(500).json({ success: false, message: '區塊鏈寫入失敗，請稍後重試。', error: error.message });
    }

    // 成功回應：包含交易雜湊值
    return res.status(201).json({
      success: true,
      message: '註冊成功，資料已上鏈。',
      transactionHash: txHash
    });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤，請稍後再試。', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      return res.status(400).json({ success: false, message: '請提供使用者名稱和密碼。' });
    }

    // 查詢使用者
    const user = await User.findOne({ where: { userName } });
    if (!user) {
      return res.status(401).json({ success: false, message: '使用者名稱或密碼錯誤。' });
    }

    // 驗證密碼
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '使用者名稱或密碼錯誤。' });
    }

    //（可選）產生 JWT token 供後續認證使用
    let token = null;
    if (process.env.JWT_SECRET) {
      token = jwt.sign(
        { id: user.id, userName: user.userName },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    }

    // 登入成功回傳
    return res.json({
      success: true,
      message: '登入成功。',
      user: {
        id: user.id,
        userName: user.userName,
        email: user.email,
        serialNumber: user.serialNumber
      },
      ...(token ? { token } : {})
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤，請稍後再試。', error: error.message });
  }
};
