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

// =========== 路由 ===========
// 您原本有的路由
const authRouter = require('./routes/auth');
const membershipRouter = require('./routes/membership');
const profileRouter = require('./routes/profile');
const paymentRouter = require('./routes/payment');
const infringementRouter = require('./routes/infringement');
const trademarkRouter = require('./routes/trademarkCheck'); 
// ^^ 如果您之前是 require('./routes/trademark') or trademarkCheckRoutes
//    視實際檔名修改

// 新增: Contact 路由
const contactRouter = require('./routes/contact');

// 載入 Model => 讓 Sequelize 知道這張表 (若有 Contact.js)
require('./models/Contact'); 
const User = require('./models/User'); // 會員 Model

const app = express();
const HOST = '0.0.0.0';
const PORT = process.env.PORT || 3000;

// 中介層
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// Health
// =====================
app.get('/health', (req, res) => {
  res.json({ message: 'Server healthy' });
});

// =====================
// A) Auth 路由
// =====================
app.use('/auth', authRouter);

// =====================
// B) 區塊鏈測試路由 (chain/...)
// =====================
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
    if (!userEmail || !dnaHash) return res.status(400).json({ error: 'Missing userEmail/dnaHash' });
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
    if (!userEmail || !infrInfo) return res.status(400).json({ error: 'Missing userEmail/infrInfo' });
    const txHash = await chain.writeInfringementToChain(userEmail, infrInfo, timestamp);
    return res.json({ success: true, txHash });
  } catch (e) {
    console.error('[chain/writeInfringement]', e);
    return res.status(500).json({ error: e.message });
  }
});

// =====================
// C) 會員中心 => /membership
// =====================
app.use('/membership', membershipRouter);

// =====================
// D) Profile => /profile
// =====================
app.use('/profile', profileRouter);

// =====================
// E) Payment / Infringement
// =====================
app.use('/payment', paymentRouter);
app.use('/infringement', infringementRouter);

// =====================
// F) 商標檢索 => /api/trademark-check
// =====================
// 若是 trademarkRouter, 或 trademarkCheckRoutes, 視您的實際命名:
app.use('/api/trademark-check', trademarkRouter);

// =====================
// G) Contact => /api/contact
// =====================
app.use('/api/contact', contactRouter);

// =====================
// H) 檔案上傳 => /api/upload
// =====================
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

    // 您既有的 plan Upload Limit:
    let maxVideos = 3;
    let maxImages = 10;
    if (user.plan === 'PRO') {
      maxVideos = 15;
      maxImages = 30;
    } else if (user.plan === 'ENTERPRISE') {
      maxVideos = 30;
      maxImages = 60;
    }

    // 檢查檔案類型
    const filename = (req.file?.originalname || '').toLowerCase();
    if (filename.endsWith('.mp4') || filename.endsWith('.mov')) {
      if (user.uploadVideos >= maxVideos) {
        return res
          .status(403)
          .json({ error: `您是${user.plan}方案, 影片上傳已達${maxVideos}次上限` });
      }
    } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.png')) {
      if (user.uploadImages >= maxImages) {
        return res
          .status(403)
          .json({ error: `您是${user.plan}方案, 圖片上傳已達${maxImages}次上限` });
      }
    }

    // 若需檢查是否超過免費期 (如 planUploadLimitCheck.js):
    // const now = new Date();
    // const oneMonthAfterReg = new Date(user.createdAt.getTime() + 30*24*60*60*1000);
    // if(now > oneMonthAfterReg && !user.hasPaid){
    //   return res.status(402).json({ error:'Free month ended. Please upgrade to continue.' });
    // }

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

    // (可選) 上鏈
    try {
      const txHash = await chain.writeToBlockchain(`${userEmail}|${fingerprint}`);
      console.log('[Upload] fingerprint 上鏈成功 =>', txHash);
    } catch (chainErr) {
      console.error('[Upload] 上鏈失敗 =>', chainErr);
    }

    // 更新上傳次數
    const user = req._userObj;
    const filename = (req.file.originalname || '').toLowerCase();
    if (filename.endsWith('.mp4') || filename.endsWith('.mov')) {
      user.uploadVideos += 1;
    } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.png')) {
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

// =====================
// 最終啟動
// =====================
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
