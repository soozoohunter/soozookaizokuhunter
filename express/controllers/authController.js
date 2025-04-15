const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');  // 假設 User 模型由 ../models/index.js 匯出

// 註冊新使用者
exports.register = async (req, res) => {
  try {
    const { email, userName, password, confirmPassword, role, serialNumber, socialBinding } = req.body;
    // 1. 後端再次驗證必要欄位是否齊全
    if (!email || !userName || !password || !confirmPassword) {
      return res.status(400).json({ message: '必填欄位未填 / Required fields missing' });
    }
    // 2. 確認密碼與確認密碼是否一致
    if (password !== confirmPassword) {
      return res.status(400).json({ message: '密碼不一致 / Passwords do not match' });
    }
    // 3. 設定角色：僅允許 'admin' 或 'user'，若無提供則預設為 'user'
    let finalRole = role;
    if (!finalRole || (finalRole !== 'admin' && finalRole !== 'user')) {
      finalRole = 'user';
    }
    // 4. 處理序號欄位：空字串轉為 null，避免唯一性衝突
    let finalSerial = serialNumber;
    if (typeof finalSerial === 'string' && finalSerial.trim() === '') {
      finalSerial = null;
    }
    // 5. 准備建立使用者物件
    const newUser = await User.create({
      email,
      userName,
      password,       // 密碼將由模型 Hook 自動雜湊
      role: finalRole,
      serialNumber: finalSerial,
      socialBinding   // 社群綁定資訊（若有提供）
    });
    // 6. （可選）將部分資料寫入區塊鏈，例如記錄 userName 或 serialNumber
    // try {
    //   blockchainService.recordNewUser(newUser.id, newUser.serialNumber);
    // } catch (chainErr) {
    //   console.error('區塊鏈寫入失敗:', chainErr);
    //   // 區塊鏈失敗不影響主要流程，可選擇通知管理員或忽略
    // }
    // 7. 簽發 JWT，內容包含使用者ID和角色
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '7d' }
    );
    // 8. 回傳成功結果（201 Created）
    return res.status(201).json({
      message: '註冊成功 / Registration successful',
      token
    });
  } catch (err) {
    // 捕捉 Sequelize 驗證錯誤（例如 UNIQUE 約束違反）
    if (err.name === 'SequelizeUniqueConstraintError') {
      // 根據錯誤欄位名稱給出對應訊息
      const field = err.errors && err.errors[0] && err.errors[0].path;
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
    console.error('Register Error:', err);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試 / Server error, please try later' });
  }
};

// 使用者登入
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // 檢查請求中是否有提供 Email 和 Password
    if (!email || !password) {
      return res.status(400).json({ message: '請提供電子郵件與密碼 / Please provide email and password' });
    }
    // 1. 查找使用者（以 email 為依據）
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // 找不到該 Email 對應的使用者
      return res.status(401).json({ message: '電子郵件或密碼錯誤 / Incorrect email or password' });
    }
    // 2. 比對密碼雜湊
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // 密碼錯誤
      return res.status(401).json({ message: '電子郵件或密碼錯誤 / Incorrect email or password' });
    }
    // 3. 簽發 JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '7d' }
    );
    // （若使用 Cookie，可用 res.cookie 在此設置 HttpOnly Cookie）
    // 4. 回傳成功訊息與 JWT
    return res.json({
      message: '登入成功 / Login successful',
      token
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試 / Server error, please try later' });
  }
};
