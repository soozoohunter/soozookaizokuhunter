/*************************************************************
 * express/server.js
 *************************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const paymentsRouter = require('./routes/payment');
const protectRouter = require('./routes/protect');
const adminRouter = require('./routes/admin');
const authRoutes = require('./routes/authRoutes');

const bcrypt = require('bcryptjs');
const { User } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// 簡易健康檢查
app.get('/health', (req, res) => {
  res.send('Express OK');
});

// 使每個路由都能使用 req.db (pgPool)
app.use((req, res, next) => {
  req.db = db;
  next();
});

// 付款路由 => /api
app.use('/api', paymentsRouter);

// 作品保護 => /api/protect
app.use('/api/protect', protectRouter);

// 管理端 => /admin
app.use('/admin', adminRouter);

// 一般認證 => /auth (register / login)
app.use('/auth', authRoutes);

// 啟動前嘗試建立預設 Admin (email='zacyao1005@example.com', password='Zack967988')
(async function ensureAdmin() {
  try {
    const email = 'zacyao1005@example.com'; // 有效 Email
    const plainPwd = 'Zack967988';
    const userName = 'zacyao1005';  // 對應 Model 欄位 userName

    const old = await User.findOne({ where: { email } });
    if (!old) {
      const hash = await bcrypt.hash(plainPwd, 10);
      // 新增 admin
      await User.create({
        email,
        userName,
        password: hash,
        role: 'admin',
        serialNumber: 'ADMIN-000001'
      });
      console.log('[InitAdmin] 已建立預設管理員:', email, '密碼:', plainPwd);
    } else {
      console.log('[InitAdmin] 已存在 admin:', email);
    }
  } catch (err) {
    console.error('[InitAdmin] 建立管理員失敗:', err);
  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] running on port ${PORT}`);
});
