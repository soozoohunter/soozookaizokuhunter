// express/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

// ====== multer 用於接收商標圖
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 

// 產生 JWT Token
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// [POST] /auth/register
// 如果 userRole === 'TRADEMARK'，可上傳 "trademarkLogo" 圖檔
router.post('/register', upload.single('trademarkLogo'), async (req, res) => {
  try {
    const { email, password, userName, userRole, platforms, registrationNo } = req.body;

    if (!email || !password || !userName || !userRole) {
      return res.status(400).json({ error: '缺少必填欄位 (email, password, userName, userRole)' });
    }

    // 檢查 role
    if(!['COPYRIGHT','TRADEMARK','BOTH'].includes(userRole)){
      return res.status(400).json({ error: 'userRole 無效，必須為 COPYRIGHT / TRADEMARK / BOTH' });
    }

    // 1) 檢查 Email
    const exist = await User.findOne({ where: { email } });
    if(exist){
      return res.status(400).json({ error: '此 Email 已被註冊' });
    }

    // 2) 密碼加密
    const hashed = await bcrypt.hash(password, 10);

    // 3) 如 userRole=TRADEMARK, 則可接收商標圖
    let trademarkLogoPath = null;
    if(userRole === 'TRADEMARK' || userRole === 'BOTH'){
      if(req.file){
        trademarkLogoPath = req.file.path; // e.g. "uploads/XXXX"
      }
    }

    // 4) 建立新用戶
    const newUser = await User.create({
      email,
      password: hashed,
      userName,
      userRole,
      platforms,        // 可以是 JSON 字串
      trademarkLogo: trademarkLogoPath,
      registrationNo   // 如果已註冊可存號碼
    });

    return res.json({
      message: '註冊成功',
      userId: newUser.id,
      email: newUser.email,
      userRole: newUser.userRole
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ error: err.message || '系統錯誤' });
  }
});

// [POST] /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '缺少 email 或 password' });
    }

    // 1) 找 User
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: '使用者不存在' });
    }

    // 2) bcrypt.compare
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '密碼錯誤' });
    }

    // 3) 產生 JWT
    const token = generateToken({ id: user.id, email: user.email });
    return res.json({
      message: '登入成功',
      token,
      userRole: user.userRole,
      userName: user.userName
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

// [POST] /auth/logout
// 對後端無狀態 JWT 來說，伺服器端只回傳成功，前端自行清除 token 即可
router.post('/logout', (req, res) => {
  // 在此範例中，只要 front-end 刪除 token 即算登出
  return res.json({ message: '已登出' });
});

module.exports = router;
