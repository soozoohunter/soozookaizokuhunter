/********************************************************************
 * express/server.js (最終整合版)
 ********************************************************************/
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });  // 讀取 .env
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const jwt = require('jsonwebtoken');

// 載入 Sequelize
const { sequelize } = require('./models');
const User = require('./models/User'); // 用於上傳時檢查方案

// 載入區塊鏈工具 (chain.js)
const chain = require('./utils/chain');

// 建立 Express App
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/********************************************************
 * 路由區
 ********************************************************/
// Auth 路由
const authRouter = require('./routes/auth');

// 以下路由若您已有, 請自行確認檔案:
const membershipRouter = require('./routes/membership');
const profileRouter = require('./routes/profile');
const paymentRouter = require('./routes/payment');
const infringementRouter = require('./routes/infringement');
const trademarkRouter = require('./routes/trademarkCheck');
const contactRouter = require('./routes/contact');

app.use('/auth', authRouter);
app.use('/membership', membershipRouter);
app.use('/profile', profileRouter);
app.use('/payment', paymentRouter);
app.use('/infringement', infringementRouter);
app.use('/api/trademark-check', trademarkRouter);
app.use('/api/contact', contactRouter);

/********************************************************
 * 健康檢查
 ********************************************************/
app.get('/health', (req, res) => {
  res.send('Express server healthy');
});

/********************************************************
 * 區塊鏈 API 範例 (若有)
 ********************************************************/
app.post('/chain/store', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Missing data' });
    }
    const txHash = await chain.writeToBlockchain(data);
    return res.json({ success: true, txHash });
  } catch (err) {
    console.error('[chain/store]', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/chain/writeUserAsset', async (req, res) => {
  try {
    const { userEmail, dnaHash, fileType, timestamp } = req.body;
    if (!userEmail || !dnaHash) {
      return res.status(400).json({ error: 'Missing userEmail/dnaHash' });
    }
    const txHash = await chain.writeUserAssetToChain(userEmail, dnaHash, fileType, timestamp);
    return res.json({ success: true, txHash });
  } catch (err) {
    console.error('[chain/writeUserAsset]', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/chain/writeInfringement', async (req, res) => {
  try {
    const { userEmail, infrInfo, timestamp } = req.body;
    if (!userEmail || !infrInfo) {
      return res.status(400).json({ error: 'Missing userEmail/infrInfo' });
    }
    const txHash = await chain.writeInfringementToChain(userEmail, infrInfo, timestamp);
    return res.json({ success: true, txHash });
  } catch (err) {
    console.error('[chain/writeInfringement]', err);
    return res.status(500).json({ error: err.message });
  }
});

/********************************************************
 * 檔案上傳 (Plan 檢查 + JWT)
 ********************************************************/
const upload = multer({ dest: 'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

// 驗證 token (示範)
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/, '');
    if (!token) {
      return res.status(401).json({ error: '缺少 token' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[authMiddleware]', err);
    return res.status(401).json({ error: 'Token 無效或已過期' });
  }
}

// 方案檢查 (假設與您先前一樣)
async function planUploadLimitCheck(req, res, next) {
  try {
    const userId = req.user.userId || req.user.id;  // 取決於 login 時 payload
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: '使用者不存在' });
    }

    let maxVideos = 3, maxImages = 10;
    if (user.plan === 'PRO') {
      maxVideos = 15;  
      maxImages = 30;
    } else if (user.plan === 'ENTERPRISE') {
      maxVideos = 30;  
      maxImages = 60;
    }

    const filename = (req.file?.originalname || '').toLowerCase();
    if (filename.endsWith('.mp4') || filename.endsWith('.mov')) {
      if (user.uploadVideos >= maxVideos) {
        return res.status(403).json({
          error: `您是${user.plan}方案, 影片上傳已達${maxVideos}次上限`
        });
      }
    } else if (/\.(jpe?g|png)$/.test(filename)) {
      if (user.uploadImages >= maxImages) {
        return res.status(403).json({
          error: `您是${user.plan}方案, 圖片上傳已達${maxImages}次上限`
        });
      }
    }
    req._userObj = user;
    next();
  } catch (err) {
    console.error('[planUploadLimitCheck]', err);
    return res.status(500).json({ error: err.message });
  }
}

app.post('/api/upload', authMiddleware, upload.single('file'), planUploadLimitCheck, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '沒有檔案' });
    }
    const userEmail = req.user.email; // login 時 payload
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const fingerprint = crypto.createHash('md5').update(buffer).digest('hex');

    // 上鏈 (可選)
    try {
      const dataToChain = `${userEmail}|${fingerprint}`;
      const txHash = await chain.writeToBlockchain(dataToChain);
      console.log('[Upload => chain.writeToBlockchain] TX=', txHash);
    } catch (chainErr) {
      console.error('[Upload] 上鏈失敗 =>', chainErr);
    }

    // 更新使用者計數
    const user = req._userObj;
    const filename = (req.file.originalname || '').toLowerCase();
    if (/\.(mp4|mov)$/.test(filename)) {
      user.uploadVideos++;
    } else if (/\.(jpe?g|png)$/.test(filename)) {
      user.uploadImages++;
    }
    await user.save();

    // 刪除暫存檔
    fs.unlinkSync(filePath);

    return res.json({
      message: '上傳成功',
      fileName: req.file.originalname,
      fingerprint,
      plan: user.plan,
      usedVideos: user.uploadVideos,
      usedImages: user.uploadImages
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/********************************************************
 * 伺服器啟動
 ********************************************************/
sequelize.sync({ alter: false })
  .then(() => {
    console.log('All tables synced!');
    const PORT = process.env.PORT || 3000;
    // 監聽 0.0.0.0 讓 Docker 容器能連通
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to sync tables:', err);
  });
