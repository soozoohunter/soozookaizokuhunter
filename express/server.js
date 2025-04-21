require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); 
const authRoutes = require('./routes/auth');
// 可再載入其他路由，如 infringement, upload, contact...

const app = express();

// ★ 啟用 CORS，針對前端網址設定
// 在開發時可用 app.use(cors()) 全開
// 也可指定 origin: 'http://localhost:3001' 或 真實網域
app.use(cors());

// 解析 JSON 請求體
app.use(express.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.send('Express OK');
});

// 掛載認證路由 => /auth
app.use('/auth', authRoutes);

// (如需) app.use('/contact', contactRoutes);
// (如需) app.use('/upload', uploadRoutes);
// (如需) app.use('/infringement', infringementRoutes);
// ...

sequelize
  .sync({ alter: false })
  .then(() => {
    console.log('[server.js] Sequelize synced.');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[server.js] sync error:', err);
  });
