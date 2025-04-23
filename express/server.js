/*************************************************************
 * express/server.js
 * - 主程式入口，保留原本 pgPool + Route 掛載 + 健康檢查
 * - 已掛載 /admin => adminRouter，裡面可有 /admin/login, /admin/users, ...
 * - 已掛載 /auth => authRoutes (register / login)
 * - 自動建立預設 Admin (zacyao1005 / Zack967988)
 *************************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 匯入 pgPool 連線 (PostgreSQL)
const db = require('./db');

// 引入付款路由 (使用 pgPool)
const paymentsRouter = require('./routes/payment');

// 新增：引入保護上傳(Protect)路由、Admin路由
const protectRouter = require('./routes/protect');
const adminRouter = require('./routes/admin');

// 關鍵：改為引用 `authRoutes.js`
const authRoutes = require('./routes/authRoutes');

// ★ 如果您要自動在啟動時，建立一個預設Admin帳號:
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
//   adminRouter 裡應該有 POST /admin/login, GET /admin/users, GET /admin/payments, GET /admin/files...
app.use('/admin', adminRouter);

// 一般認證 => /auth (register / login)
app.use('/auth', authRoutes);

// 伺服器啟動前，嘗試建立一個預設的 Admin (email='zacyao1005', pass='Zack967988')
(async function ensureAdmin() {
  try {
    const email = 'zacyao1005';
    const plainPwd = 'Zack967988';
    const old = await User.findOne({ where: { email } });
    if (!old) {
      const hash = await bcrypt.hash(plainPwd, 10);
      const newAdmin = await User.create({
        email,
        password: hash,
        role: 'admin',
        userName: 'ZacYao',  // 可自行調整
        // 其他必填欄位（plan、isPaid等）也可一併填入
      });
      console.log('[InitAdmin] 已建立預設管理員帳號:', email, '密碼:', plainPwd);
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
