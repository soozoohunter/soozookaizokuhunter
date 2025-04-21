require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // index.js
const authRoutes = require('./routes/auth');
// 其他路由：upload, contact, infringement, etc.

const app = express();
app.use(cors());
app.use(express.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.send('Express OK');
});

// 掛載路由 => /auth
app.use('/auth', authRoutes);

// (如需) app.use('/upload', uploadRoutes);
// (如需) app.use('/contact', contactRoutes);
// etc.

// DB 同步
sequelize.sync({ alter:false })
  .then(() => {
    console.log('Sequelize synced successfully.');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log('Server is running on port', PORT);
    });
  })
  .catch((err) => {
    console.error('Sequelize sync error:', err);
  });
