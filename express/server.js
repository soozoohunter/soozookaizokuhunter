// express/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const sequelize = require('./db');
const chain = require('./utils/chain');

// 路由
const authRouter = require('./routes/auth');
const membershipRouter = require('./routes/membership');
const profileRouter = require('./routes/profile');
const paymentRouter = require('./routes/payment');
const infringementRouter = require('./routes/infringement');
const trademarkRouter = require('./routes/trademarkCheck'); 

// Contact 路由
const contactRouter = require('./routes/contact');

// 如果有 Contact model，則需要:
// require('./models/Contact');

const User = require('./models/User'); // 用於上傳檔案時的會員查詢

const app = express();
const HOST = '0.0.0.0';
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ message: 'Server healthy' });
});

// Auth 路由
app.use('/auth', authRouter);

 812ba476ace1c09f734fd649e8a66b0954e95761
app.post('/chain/store', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'Missing data' });
    const txHash = await chain.writeToBlockchain(data);
    return res.json({ success: true, txHash });
  } catch (e) {
    console.error('[chain/store]', e);
    return res.status(500).json({ error: e.message });
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
  } catch (e) {
    console.error('[chain/writeUserAsset]', e);
    return res.status(500).json({ error: e.message });
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
  } catch (e) {
    console.error('[chain/writeInfringement]', e);
    return res.status(500).json({ error: e.message });
  }
});

// 會員中心
app.use('/membership', membershipRouter);

// Profile
app.use('/profile', profileRouter);

// Payment / Infringement
app.use('/payment', paymentRouter);
app.use('/infringement', infringementRouter);

// 商標檢索
app.use('/api/trademark-check', trademarkRouter);

// Contact
app.use('/api/contact', contactRouter);

// 檔案上傳
const upload = multer({ dest: 'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

function authMiddleware(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
    if (!token) return res.status(401).json({ error: '缺少 token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    console.error('[authMiddleware]', e);
    return res.status(401).json({ error: 'Token 無效或已過期' });
  }
}

async function planUploadLimitCheck(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: '使用者不存在' });
    }

    let maxVideos = 3;
    let maxImages = 10;
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
          error: `您是${user.plan}方案, 影片上傳已達${maxVideos}次上限`,
        });
      }
    } else if (
      filename.endsWith('.jpg') ||
      filename.endsWith('.jpeg') ||
      filename.endsWith('.png')
    ) {
      if (user.uploadImages >= maxImages) {
        return res.status(403).json({
          error: `您是${user.plan}方案, 圖片上傳已達${maxImages}次上限`,
        });
      }
    }

    req._userObj = user;
    next();
  } catch (e) {
    console.error('[planUploadLimitCheck]', e);
    return res.status(500).json({ error: e.message });
  }
}

app.post('/api/upload', authMiddleware, upload.single('file'), planUploadLimitCheck, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '沒有檔案' });
    }
    const userEmail = req.user.email;
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const fingerprint = crypto.createHash('md5').update(buffer).digest('hex');

    try {
      const txHash = await chain.writeToBlockchain(`${userEmail}|${fingerprint}`);
      console.log('[Upload] fingerprint 上鏈成功 =>', txHash);
    } catch (chainErr) {
      console.error('[Upload] 上鏈失敗 =>', chainErr);
    }

    const user = req._userObj;
    const filename = (req.file.originalname || '').toLowerCase();
    if (filename.endsWith('.mp4') || filename.endsWith('.mov')) {
      user.uploadVideos += 1;
    } else if (
      filename.endsWith('.jpg') ||
      filename.endsWith('.jpeg') ||
      filename.endsWith('.png')
    ) {
      user.uploadImages += 1;
    }
    await user.save();

    fs.unlinkSync(filePath);

    return res.json({
      message: '上傳成功',
      fileName: req.file.originalname,
      fingerprint,
      plan: user.plan,
      usedVideos: user.uploadVideos,
      usedImages: user.uploadImages,
    });
  } catch (e) {
    console.error('[Upload Error]', e);
    return res.status(500).json({ error: e.message });
  }
});

// 最終啟動
sequelize
  .sync({ alter: false })
  .then(() => {
    console.log('All tables synced!');
    app.listen(PORT, HOST, () => {
      console.log(`Express server running on http://${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to sync tables:', err);
  });
