/**
 * express/controllers/authController.js
 * - 註冊 / 登入，不再包含商標/著作權欄位
 * - 僅允許 role='admin' 或 'user'；若前端不傳 role，就預設 'user'
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');  // 由 ../models/index.js 匯出

// 註冊新使用者
exports.register = async (req, res) => {
  try {
    // 前端若不再傳 role，則可拿掉 role 參數
    const {
      email,
      userName,
      password,
      confirmPassword,
      role, // 可能沒傳，若不需要可刪
      serialNumber,
      socialBinding
    } = req.body;

    // 1. 後端再次驗證必要欄位是否齊全
    if (!email || !userName || !password || !confirmPassword) {
      return res.status(400).json({ message: '必填欄位未填 / Required fields missing' });
    }

    // 2. 確認密碼與確認密碼是否一致
    if (password !== confirmPassword) {
      return res.status(400).json({ message: '密碼不一致 / Passwords do not match' });
    }

    // 3. 設定角色 (若未提供就預設'user')
    let finalRole = role;
    if (!finalRole || (finalRole !== 'admin' && finalRole !== 'user')) {
      finalRole = 'user'; // 強制 'user'
    }

    // 4. 處理序號欄位：空字串轉為 null，避免唯一性衝突
    let finalSerial = serialNumber;
    if (typeof finalSerial === 'string' && finalSerial.trim() === '') {
      finalSerial = null;
    }

    // 5. 建立使用者
    const newUser = await User.create({
      email,
      userName,
      password, // 會由 Model Hook 進行 bcrypt
      role: finalRole,
      serialNumber: finalSerial,
      socialBinding
    });

    // 6. （可選）呼叫區塊鏈 / IPFS

    // 7. 簽發 JWT
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '7d' }
    );

    // 8. 回傳
    return res.status(201).json({
      message: '註冊成功 / Registration successful',
      token
    });

  } catch (err) {
    // 捕捉 Sequelize UNIQUE 錯誤
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors?.[0]?.path;
      let message = '資料重複無法使用 / Duplicate field value';
      if (field === 'email') {
        message = '電子郵件已被使用 / Email already in use';
      } else if (field === 'userName') {
        message = '用戶名已被使用 / Username already in use';
      } else if (field === 'serialNumber') {
        message = '序號已被使用 / Serial number already in use';
      }
      return res.status(400).json({ message });
    }
    // 其他錯誤
    console.error('[Register Error]', err);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試 / Server error, please try later' });
  }
};

// 使用者登入
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: '請提供 email 與密碼 / Provide email & password' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: '電子郵件或密碼錯誤 / Incorrect email or password' });
    }

    // 比對 bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '電子郵件或密碼錯誤 / Incorrect email or password' });
    }

    // 簽發 JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '7d' }
    );

    return res.json({
      message: '登入成功 / Login successful',
      token
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試 / Server error, please try later' });
  }
};
