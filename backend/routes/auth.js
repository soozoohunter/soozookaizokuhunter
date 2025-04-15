const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const blockchainService = require('../blockchainService');

// **註冊 API**：接受 JSON { email, userName, password, confirmPassword, role, serialNumber, IG, FB, ... } 
router.post('/register', async (req, res) => {
  try {
    const {
      email, userName, password, confirmPassword, role, serialNumber,
      IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, Taobao, eBay
    } = req.body;

    // 後端驗證：必要欄位是否提供
    if (!email || !userName || !password || !confirmPassword || !role || !serialNumber) {
      return res.status(400).json({ error: '缺少必要的註冊資訊' });
    }
    // 密碼一致性驗證
    if (password !== confirmPassword) {
      return res.status(400).json({ error: '密碼與確認密碼不相符' });
    }

    // 檢查 Email 是否已被使用
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ error: '此 Email 已經註冊過' });
    }
    // 檢查使用者名稱是否已存在
    const existingUser = await User.findOne({ where: { userName } });
    if (existingUser) {
      return res.status(409).json({ error: '此用戶名稱已被使用' });
    }

    // 使用 bcrypt 將密碼加密後儲存
    const hashedPassword = await bcrypt.hash(password, 10);

    // 在資料庫中建立新使用者紀錄
    const newUser = await User.create({
      email,
      userName,
      password: hashedPassword,
      role,
      serialNumber,
      IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, Taobao, eBay
    });

    try {
      // 呼叫區塊鏈服務，將註冊資訊寫入智慧合約
      await blockchainService.registerUserOnBlockchain(
        userName,
        role,
        serialNumber,
        { IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, Taobao, eBay }
      );
    } catch (err) {
      console.error('Blockchain write error:', err);
      // 如區塊鏈寫入失敗，刪除已創建的使用者以保持一致，並回傳錯誤
      await newUser.destroy();
      return res.status(500).json({ error: '區塊鏈寫入失敗，註冊未完成，請稍後重試' });
    }

    // 成功建立帳戶並寫入區塊鏈，回傳成功訊息
    return res.json({ message: '註冊成功' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
});

// **登入 API**：接受 JSON { userName, password }
router.post('/login', async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      return res.status(400).json({ error: '請提供使用者名稱和密碼' });
    }
    // 根據使用者名稱查詢用戶
    const user = await User.findOne({ where: { userName } });
    if (!user) {
      // 使用者名稱不存在
      return res.status(401).json({ error: '用戶名稱或密碼錯誤' });
    }
    // 比對密碼
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // 密碼不正確
      return res.status(401).json({ error: '用戶名稱或密碼錯誤' });
    }
    // 密碼驗證通過，簽發 JWT（載荷包含使用者ID和名稱、角色等）
    const token = jwt.sign(
      { id: user.id, userName: user.userName, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    // 回傳 JWT 與必要的使用者資訊
    res.json({ token, user: { userName: user.userName, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
});

module.exports = router;
