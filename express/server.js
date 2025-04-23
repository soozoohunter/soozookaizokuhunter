/*************************************************************
 * express/server.js
 * - 主程式入口，保留原本 pgPool + Route 掛載 + 健康檢查
 * - 新增: 自動建立預設 Admin 帳號 (email='zacyao1005', pass='Zack967988')
 *************************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 匯入 pgPool 連線
const db = require('./db');

// 引入付款路由 (使用 pgPool)
const paymentsRouter = require('./routes/payment');

// 新增：引入保護上傳(Protect)路由、Admin路由、Auth路由（若您原本就有，可合併）
const protectRouter = require('./routes/protect');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');

// ★ 如果您要自動在啟動時，建立一個預設Admin帳號:
const bcrypt = require('bcryptjs');
const { User } = require('./models'); // 假設您有 Sequelize 的 models/index.js 裡面匯出的 User Model

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

// 掛載路由
app.use('/api', paymentsRouter);      // 付款API
app.use('/api/protect', protectRouter); // 作品保護(上傳/下載)API
app.use('/admin', adminRouter);       // 管理端API
app.use('/auth', authRouter);         // 一般用戶註冊/登入API

// 伺服器啟動前，嘗試建立一個預設的 Admin
(async function ensureAdmin() {
  try {
    const email = 'zacyao1005'; // 您指定的帳號
    const plainPwd = 'Zack967988';
    const old = await User.findOne({ where: { email } });
    if (!old) {
      const hash = await bcrypt.hash(plainPwd, 10);
      const newAdmin = await User.create({
        email,
        password: hash,
        role: 'admin',
        userName: 'ZacYao',   // 隨意
        // 若您有其他必填欄位（plan、isPaid等）也請一併填入
      });
      console.log('[InitAdmin] 已建立預設管理員帳號:', email, '密碼:', plainPwd);
    } else {
      console.log('[InitAdmin] 已存在 admin:', email);
    }
  } catch (err) {
    console.error('[InitAdmin] 建立管理員失敗:', err);
  }
})();

// 最後啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] running on port ${PORT}`);
});
