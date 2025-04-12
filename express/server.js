require('dotenv').config();
const express = require('express');
const cors = require('cors');

// (若您有資料庫，保留 db.js)
/// const sequelize = require('./db');

const app = express();
const PORT = process.env.EXPRESS_PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req,res) => res.json({ message: 'Express healthy' }));

// Routes (保留您原本的 routes)
const authRouter = require('./routes/auth');
const membershipRouter = require('./routes/membership');
const uploadRouter = require('./routes/upload');
// e.g. const infringementRouter = require('./routes/infringement');
// e.g. const profilesRouter = require('./routes/profiles');
app.use('/auth', authRouter);
app.use('/membership', membershipRouter);
app.use('/upload', uploadRouter);
// app.use('/infringement', infringementRouter);
// app.use('/profiles', profilesRouter);

/// 若您有爬蟲路由 or crawlerRoute.js, 也保留即可
/// app.use('/crawler', crawlerRouter);

// (若使用 Sequelize):
/*
sequelize.sync({ alter: false })
  .then(() => {
    console.log('All tables synced!');
    app.listen(PORT, () => {
      console.log(`Express running on port ${PORT}`);
    });
  })
  .catch(err => console.error('DB sync error:', err));
*/

// 如果沒用 DB, 直接啟動
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
