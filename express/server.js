require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

// 路由
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const infringementRoutes = require('./routes/infringement');
const contactRoutes = require('./routes/contact');

const app = express();
app.use(cors());
app.use(express.json());

// 健康檢查端點
app.get('/health', (req, res) => {
  res.send('Express OK');
});

// 路由掛載
app.use('/auth', authRoutes);
app.use('/upload', uploadRoutes);
app.use('/infringement', infringementRoutes);
app.use('/contact', contactRoutes);

// DB 同步
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
