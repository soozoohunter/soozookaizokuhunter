require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const Web3 = require('web3');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

// 1) 讀取 .env
const {
  POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT,
  JWT_SECRET,
  EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM,
  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
  DMCA_AUTO_NOTIFY,
  BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS,
  EXPRESS_PORT
} = process.env;

// 2) 區塊鏈初始化
const web3 = new Web3(BLOCKCHAIN_RPC_URL || 'http://geth:8545');
const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "hash", "type": "bytes32" }],
    "name": "storeFingerprint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
const account = web3.eth.accounts.privateKeyToAccount(BLOCKCHAIN_PRIVATE_KEY || '0x1111');
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// 3) Sequelize 初始化
const sequelize = new Sequelize(
  `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`,
  { dialect: 'postgres', logging: false }
);

// 4) 定義 Models
const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true },
  password_hash: DataTypes.STRING,
  role: DataTypes.STRING // 'shortVideo' or 'ecommerce'
}, { tableName: 'users' });

const Work = sequelize.define('Work', {
  title: DataTypes.STRING,
  fingerprint: DataTypes.STRING,
  cloudinaryUrl: DataTypes.STRING,
  userId: DataTypes.INTEGER,
  fileType: DataTypes.STRING  // 'image' or 'video'
}, { tableName: 'works' });

const Infringement = sequelize.define('Infringement', {
  workId: DataTypes.INTEGER,
  infringingUrl: DataTypes.STRING,
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  infringerEmail: DataTypes.STRING  // 若可取得侵權者之Email
}, { tableName: 'infringements' });

// 5) Nodemailer
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false, // 使用587通常為false
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// 6) JWT
const revokedTokens = new Set();
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}
function verifyToken(token) {
  if(revokedTokens.has(token)) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch(e) {
    return null;
  }
}

// 7) Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// 8) Multer - 檔案過濾
const allowedMime = [
  'image/jpeg','image/png','image/gif','image/webp',
  'video/mp4','video/x-m4v','video/*'
];
function fileFilter(req, file, cb) {
  if(!allowedMime.includes(file.mimetype)) {
    return cb(new Error('不支援此檔案類型'), false);
  }
  cb(null, true);
}
const upload = multer({ dest: 'uploads/', fileFilter });

// 9) 建立 Express App
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'KaikaiShield Express' });
});

/**
 * =========================================
 *   A) 用戶註冊 / 登入 / 登出
 * =========================================
 */
// 註冊
app.post('/signup', async (req, res)=>{
  const { email, password, role } = req.body;
  if(!email || !password || !role) {
    return res.status(400).json({ error: '缺少 email / password / role' });
  }
  if(!['shortVideo','ecommerce'].includes(role)) {
    return res.status(400).json({ error: 'role 必須是 shortVideo 或 ecommerce' });
  }

  const bcrypt = require('bcrypt');
  try {
    let exist = await User.findOne({ where: { email } });
    if(exist) {
      return res.status(400).json({ error: 'Email 已被註冊' });
    }
    let hashed = await bcrypt.hash(password, 10);
    let newUser = await User.create({ email, password_hash: hashed, role });

    // 寄歡迎信
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: 'KaiKaiShield 歡迎信',
        text: '感謝您註冊 KaiKaiShield，本服務已為您開通。'
      });
    } catch(e) {
      console.error('寄歡迎信失敗：', e.message);
    }

    res.json({ message: '註冊成功', userId: newUser.id });
  } catch(e) {
    console.error('signup error:', e.message);
    res.status(500).json({ error: 'server error' });
  }
});

// 登入
app.post('/login', async (req, res)=>{
  const { email, password } = req.body;
  if(!email || !password) {
    return res.status(400).json({ error: '缺少 email 或 password' });
  }

  const bcrypt = require('bcrypt');
  try {
    let user = await User.findOne({ where: { email } });
    if(!user) {
      return res.status(401).json({ error: '用戶不存在' });
    }
    let match = await bcrypt.compare(password, user.password_hash);
    if(!match) {
      return res.status(401).json({ error: '密碼錯誤' });
    }
    let token = signToken({ userId: user.id, email, role: user.role });
    res.json({ message: '登入成功', token, role: user.role });
  } catch(e) {
    console.error('login error:', e.message);
    res.status(500).json({ error: 'server error' });
  }
});

// 登出
app.post('/logout', (req, res)=>{
  const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '');
  if(!token) return res.status(400).json({ error: '缺少 token' });
  revokedTokens.add(token);
  res.json({ message: '已登出, Token已被撤銷' });
});


/**
 * =========================================
 *   B) 上傳檔案(指紋存證 + 上鏈 + Crawler)
 * =========================================
 */
app.post('/upload', upload.single('file'), async (req, res)=>{
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if(!decoded) {
    return res.status(401).json({ error: '未授權或Token已失效' });
  }
  if(!req.file) {
    return res.status(400).json({ error: '請選擇檔案' });
  }
  // 找用戶
  let user = await User.findByPk(decoded.userId);
  if(!user) {
    return res.status(404).json({ error: '找不到使用者' });
  }

  // 檔案類型判斷 (以 mime startsWith("image/") or "video/")
  let fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';

  // 1) 先檢查「數量限制」
  let userWorks = await Work.findAll({ where: { userId: user.id }});
  let imageCount = userWorks.filter(w=>w.fileType==='image').length;
  let videoCount = userWorks.filter(w=>w.fileType==='video').length;

  if(user.role==='shortVideo') {
    // 只可上傳 5 支「短影音」(30秒內)
    if(fileType==='image') {
      // 理論上網紅只需要影片，也可允許上傳圖片，但此處題意未嚴格禁止 → 視需求
      // 這裡直接回拒 或 放行都行
      return res.status(400).json({ error: '網紅帳號僅支援短影音' });
    }
    if(videoCount >= 5) {
      return res.status(400).json({ error: '已達短影音上傳5部上限' });
    }
    // 檢查 30 秒長度
    let durationSec = await probeVideoDuration(req.file.path);
    if(durationSec > 30) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: '影片超過30秒限制' });
    }
  }
  else if(user.role==='ecommerce') {
    // 可上傳 30 張商品圖 + 2 支短影音
    if(fileType==='image') {
      if(imageCount >= 30) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: '已達商品照上傳30張上限' });
      }
    } else {
      // video
      if(videoCount >= 2) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: '已達短影音上傳2部上限' });
      }
      // 30 秒限制
      let durationSec = await probeVideoDuration(req.file.path);
      if(durationSec > 30) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: '商品影片超過30秒限制' });
      }
    }
  }

  // 2) 產生指紋
  const fileBuffer = fs.readFileSync(req.file.path);
  const salt = uuidv4();
  const combined = Buffer.concat([fileBuffer, Buffer.from(salt)]);
  const fingerprint = crypto.createHash('sha3-256').update(combined).digest('hex');

  try {
    // 3) 上傳至 Cloudinary
    let cloudRes = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto'
    });
    fs.unlinkSync(req.file.path);

    // 4) 寫入 DB
    let newWork = await Work.create({
      title: req.body.title || (user.role==='shortVideo' ? '短影音' : '商品照片'),
      fingerprint,
      cloudinaryUrl: cloudRes.secure_url,
      userId: user.id,
      fileType
    });

    // 5) 指紋上鏈 (若合約已準備好)
    if(CONTRACT_ADDRESS && CONTRACT_ADDRESS!=='0xYourDeployedContractAddress') {
      const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
      try {
        let txReceipt = await contract.methods.storeFingerprint("0x"+fingerprint).send({
          from: account.address,
          gas: 500000
        });
        console.log('指紋上鏈成功:', txReceipt.transactionHash);
      } catch(e) {
        console.error('指紋上鏈失敗:', e.message);
      }
    }

    // 6) 呼叫爬蟲容器 (crawler) => 同步或非同步
    try {
      await axios.post('http://crawler:8081/detect', {
        url: 'https://example.com', // 真實場景可針對TikTok/IG/FB/YT/Shopee/...
        fingerprint
      });
    } catch(e) {
      console.error('呼叫爬蟲失敗:', e.message);
    }

    res.json({
      message: '上傳成功',
      fingerprint,
      cloudinaryUrl: cloudRes.secure_url,
      workId: newWork.id
    });
  } catch(e) {
    console.error('upload error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

/**
 * =========================================
 *   C) 侵權管理
 * =========================================
 *   1) 偵測到侵權 => Infringement 記錄
 *   2) DMCA 申訴
 *   3) 合法授權 (Mark as legal)
 *   4) 要求付費購買授權
 *   5) 發起法律訴訟
 */

// 查詢侵權列表 (只顯示目前用戶名下)
app.get('/infringements', async (req, res)=>{
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if(!decoded) return res.status(401).json({ error: '未授權' });

  try {
    let user = await User.findByPk(decoded.userId);
    if(!user) return res.status(404).json({ error: '找不到使用者' });

    let works = await Work.findAll({ where: { userId: user.id }});
    let workIds = works.map(w=>w.id);
    let infs = await Infringement.findAll({ where: { workId: workIds } });
    res.json({ works, infringements: infs });
  } catch(e) {
    console.error('infringements error:', e.message);
    res.status(500).json({ error: 'server error' });
  }
});

// DMCA 申訴
app.post('/dmca/report', async (req, res)=>{
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if(!decoded) return res.status(401).json({ error: '未授權' });

  const { workId, infringingUrl } = req.body;
  if(!workId || !infringingUrl) {
    return res.status(400).json({ error: '缺少 workId 或 infringingUrl' });
  }
  try {
    let w = await Work.findByPk(workId);
    if(!w) return res.status(404).json({ error: 'workId 不存在' });
    if(w.userId!==decoded.userId) {
      return res.status(403).json({ error: '無權申訴他人作品' });
    }

    let inf = await Infringement.create({
      workId: w.id,
      infringingUrl,
      status: 'pending'
    });

    // 自動寄信給平台 (示範)
    if(DMCA_AUTO_NOTIFY==='true') {
      try {
        await transporter.sendMail({
          from: EMAIL_FROM,
          to: 'dmca@some-platform.com',
          subject: `DMCA Takedown - WorkID ${w.id}`,
          text: `侵權網址: ${infringingUrl}\n作者: ${decoded.email}\nFingerprint: ${w.fingerprint}`
        });
      } catch(e) {
        console.error('DMCA寄信失敗:', e.message);
      }
    }

    res.json({ message: 'DMCA通報成功', infId: inf.id });
  } catch(e) {
    console.error('dmca/report error:', e.message);
    res.status(500).json({ error: 'server error' });
  }
});

// 標記為「合法授權」
app.post('/infringement/legalize', async (req, res)=>{
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if(!decoded) return res.status(401).json({ error: '未授權' });

  const { infId } = req.body;
  if(!infId) return res.status(400).json({ error: '缺少 infId' });

  try {
    let inf = await Infringement.findByPk(infId);
    if(!inf) return res.status(404).json({ error: '找不到侵權記錄' });

    let w = await Work.findByPk(inf.workId);
    if(!w || w.userId!==decoded.userId) {
      return res.status(403).json({ error: '無權操作此侵權紀錄' });
    }

    inf.status = 'legalized';
    await inf.save();

    // 寫進區塊鏈(若有需要)
    if(CONTRACT_ADDRESS && CONTRACT_ADDRESS!=='0xYourDeployedContractAddress') {
      try {
        let hx = crypto.createHash('sha256').update(`LEGALIZE:${infId}`).digest('hex');
        // 直接 storeFingerprint "0x + hx"
        const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
        await contract.methods.storeFingerprint("0x"+hx).send({ from: account.address, gas: 500000 });
      } catch(e) {
        console.error('上鏈失敗(legalize):', e.message);
      }
    }

    res.json({ message: '已標記為合法授權，不再偵測', infId });
  } catch(e) {
    console.error('legalize error:', e.message);
    res.status(500).json({ error: 'server error' });
  }
});

// 要求付費購買授權
app.post('/infringement/requestLicensingFee', async (req, res)=>{
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if(!decoded) return res.status(401).json({ error: '未授權' });

  const { infId, licensingFee } = req.body; 
  // licensingFee: 請求費用(例如 100 USD)
  if(!infId || !licensingFee) {
    return res.status(400).json({ error: '缺少 infId 或 licensingFee' });
  }
  try {
    let inf = await Infringement.findByPk(infId);
    if(!inf) return res.status(404).json({ error: '找不到侵權記錄' });

    let w = await Work.findByPk(inf.workId);
    if(!w || w.userId!==decoded.userId) {
      return res.status(403).json({ error: '無權操作此侵權紀錄' });
    }

    // 假設能取得對方 Email (infr.infringerEmail)
    let infrEmail = inf.infringerEmail || 'unknown@user.com';

    // 寄信通知對方
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: infrEmail,
        subject: '通知：未授權使用作品，請付費購買授權',
        text: `您好：\n您使用了 ${w.title} (Fingerprint=${w.fingerprint})，未經授權。\n如需繼續使用，請付款 ${licensingFee} 元取得合法授權。`
      });
    } catch(e) {
      console.error('寄信通知侵權者失敗:', e.message);
    }

    // 更新 DB (示例: 把狀態改為 "licensingFeeRequested")
    inf.status = 'licensingFeeRequested';
    await inf.save();

    // 記錄到區塊鏈
    if(CONTRACT_ADDRESS && CONTRACT_ADDRESS!=='0xYourDeployedContractAddress') {
      try {
        let hx = crypto.createHash('sha256').update(`LICENSEFEE:${infId}`).digest('hex');
        const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
        await contract.methods.storeFingerprint("0x"+hx).send({ from: account.address, gas: 500000 });
      } catch(e) {
        console.error('上鏈失敗(requestLicensingFee):', e.message);
      }
    }

    res.json({ message: '已通知侵權者付費購買授權', infId, licensingFee });
  } catch(e) {
    console.error('requestLicensingFee error:', e.message);
    res.status(500).json({ error: 'server error' });
  }
});

// 提交法律訴訟
app.post('/infringement/lawsuit', async (req, res)=>{
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if(!decoded) return res.status(401).json({ error: '未授權' });

  const { infId, demandedPrice } = req.body;
  // demandedPrice = 用戶希望的和解金 or 索賠額
  if(!infId || !demandedPrice) {
    return res.status(400).json({ error: '缺少 infId 或 demandedPrice' });
  }

  try {
    let inf = await Infringement.findByPk(infId);
    if(!inf) return res.status(404).json({ error: '找不到侵權記錄' });

    let w = await Work.findByPk(inf.workId);
    if(!w || w.userId!==decoded.userId) {
      return res.status(403).json({ error: '無權操作此侵權紀錄' });
    }

    // 律師通知 => 可能需付費 (示範)
    inf.status = 'lawsuit';
    await inf.save();

    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: 'lawyer@kai.com',
        subject: `智慧財產權侵權訴訟啟動 - InfId ${infId}`,
        text: `用戶ID ${decoded.userId} 發起告訴\nWork: ${w.title}\nFingerprint: ${w.fingerprint}\n侵權網址: ${inf.infringingUrl}\n索賠金額: ${demandedPrice}`
      });
    } catch(e) {
      console.error('通知律師失敗:', e.message);
    }

    // 上鏈紀錄
    if(CONTRACT_ADDRESS && CONTRACT_ADDRESS!=='0xYourDeployedContractAddress') {
      try {
        let hx = crypto.createHash('sha256').update(`LAWSUIT:${infId}`).digest('hex');
        const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
        await contract.methods.storeFingerprint("0x"+hx).send({
          from: account.address, gas: 500000
        });
      } catch(e) {
        console.error('上鏈失敗(lawsuit):', e.message);
      }
    }

    res.json({ message: '法律訴訟已啟動，需收取額外費用', infId, status: 'lawsuit' });
  } catch(e) {
    console.error('lawsuit error:', e.message);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * =========================================
 *   D) 啟動服務 (Sequelize & Express)
 * =========================================
 */
(async ()=>{
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL 連線成功');
    await sequelize.sync();
  } catch(e) {
    console.error('PostgreSQL 連線失敗：', e.message);
  }

  const port = EXPRESS_PORT || 3000;
  app.listen(port, () => {
    console.log(`Express server on port ${port}`);
  });
})();

// ----------------------------------------------------
// 工具函式：檢測影片時長(秒)
// ----------------------------------------------------
function probeVideoDuration(filePath) {
  return new Promise((resolve, reject)=>{
    ffmpeg.ffprobe(filePath, (err, metadata)=>{
      if(err) return reject(err);
      const durationSec = metadata?.format?.duration || 0;
      resolve(durationSec);
    });
  });
}
