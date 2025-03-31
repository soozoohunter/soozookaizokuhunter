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
const axios = require('axios'); // 呼叫 Crawler 容器

// Web3 + 合約
const Web3 = require('web3');
const web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL || 'http://geth:8545');

const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [ { "internalType": "bytes32", "name": "hash", "type": "bytes32" } ],
    "name": "storeFingerprint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
const contractAddress = process.env.CONTRACT_ADDRESS || '0xYourDeployedAddress';

const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || '0x1111222233334444...';
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// 從環境變數讀取
const {
  POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT,
  JWT_SECRET,
  EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM,
  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
  DMCA_AUTO_NOTIFY,
  EXPRESS_PORT
} = process.env;

// Cloudinary 設定
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// Sequelize (PostgreSQL) 初始化
const sequelize = new Sequelize(
  `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`,
  { dialect: 'postgres', logging: false }
);

// 定義資料表 Models
const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true },
  password_hash: DataTypes.STRING,
  role: DataTypes.STRING
}, { tableName: 'users' });

const Work = sequelize.define('Work', {
  title: DataTypes.STRING,
  fingerprint: DataTypes.STRING,
  cloudinaryUrl: DataTypes.STRING,
  userId: DataTypes.INTEGER
}, { tableName: 'works' });

const Infringement = sequelize.define('Infringement', {
  workId: DataTypes.INTEGER,
  infringingUrl: DataTypes.STRING,
  status: { type: DataTypes.STRING, defaultValue: 'pending' }
}, { tableName: 'infringements' });

// Nodemailer 設定
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false, // 若使用 465 才通常是 true
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// JWT
const revokedTokens = new Set();

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}
function verifyToken(token) {
  if (revokedTokens.has(token)) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch(e) {
    return null;
  }
}

// Multer (上傳)
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

// 建立 Express App
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康檢查 (Health Check)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'KaikaiShield Express' });
});

/**
 * [ 使用者註冊 ]
 *  - email / password / role
 *  - role 必須是 ecommerce 或 shortVideo
 */
app.post('/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if(!email || !password) {
      return res.status(400).json({ error: '缺少 email 或 password' });
    }
    // 角色限制
    if(!['ecommerce','shortVideo'].includes(role)) {
      return res.status(400).json({ error: '角色必須是 ecommerce 或 shortVideo' });
    }

    const bcrypt = require('bcrypt');
    const exist = await User.findOne({ where: { email } });
    if(exist) {
      return res.status(400).json({ error: 'Email 已被註冊' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password_hash: hashed, role });

    // 寄歡迎信 (非強制)
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: 'KaiKaiShield 歡迎信',
        text: '感謝您註冊 KaiKaiShield，本服務已為您開通。\n(系統自動寄送)'
      });
    } catch(e) {
      console.error('寄歡迎信失敗：', e.message);
    }

    res.json({ message: '註冊成功', userId: newUser.id });
  } catch (err) {
    console.error('signup error:', err.message);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * [ 使用者登入 ]
 *  - email / password
 *  - 回傳 token (JWT) 與 role
 */
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const bcrypt = require('bcrypt');

    const user = await User.findOne({ where: { email } });
    if(!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if(!match) {
      return res.status(401).json({ error: '密碼錯誤' });
    }

    const token = signToken({ userId: user.id, email, role: user.role });
    res.json({ message: '登入成功', token, role: user.role });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * [ 使用者登出 ]
 *  - 前端需攜帶 Bearer Token
 *  - Token 加入 revokedTokens，失效
 */
app.post('/logout', (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '');
  if(!token) {
    return res.status(400).json({ error: '缺少 token' });
  }
  revokedTokens.add(token);
  res.json({ message: '已登出, Token已被撤銷' });
});

/**
 * [ 上傳檔案 + storeFingerprint ]
 *  - 角色=ecommerce: 最多 30 張
 *  - 角色=shortVideo: 最多 5 部
 *  - 上傳至 Cloudinary 後，fingerprint 上鏈 (若已設定合約位址)
 *  - 呼叫 Crawler 容器做偵測
 */
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if(!decoded) {
      return res.status(401).json({ error: '未授權或Token已失效' });
    }
    if(!req.file) {
      return res.status(400).json({ error: '請選擇檔案' });
    }

    // 查找該用戶
    const user = await User.findByPk(decoded.userId);
    if(!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    // 上傳數量限制
    const worksCount = await Work.count({ where: { userId: user.id }});
    if(user.role === 'ecommerce' && worksCount >= 30) {
      return res.status(400).json({ error: '已達商品照上傳30張上限' });
    }
    if(user.role === 'shortVideo' && worksCount >= 5) {
      return res.status(400).json({ error: '已達短影音上傳5部上限' });
    }

    // 讀檔 + 產生 fingerprint
    const fileBuffer = fs.readFileSync(req.file.path);
    const salt = uuidv4();
    const combined = Buffer.concat([fileBuffer, Buffer.from(salt)]);
    const fingerprint = crypto.createHash('sha3-256').update(combined).digest('hex');

    // 上傳到 Cloudinary
    let cloudRes = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto' // 可自動判斷圖片或影片
    });
    fs.unlinkSync(req.file.path); // 刪除本地暫存

    // 建立資料庫紀錄
    const newWork = await Work.create({
      title: req.body.title || (user.role === 'shortVideo' ? '短影音' : '商品照片'),
      fingerprint,
      cloudinaryUrl: cloudRes.secure_url,
      userId: user.id
    });

    // 若已有合約位址，執行 storeFingerprint (上鏈)
    if(contractAddress !== '0xYourDeployedAddress') {
      try {
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        let txReceipt = await contract.methods.storeFingerprint("0x" + fingerprint).send({
          from: account.address,
          gas: 500000
        });
        console.log('指紋上鏈成功, txHash=', txReceipt.transactionHash);
      } catch(err) {
        console.error('指紋上鏈失敗:', err.message);
      }
    }

    // 呼叫爬蟲容器 (crawler) 進行侵權偵測 (範例)
    try {
      await axios.post('http://crawler:8081/detect', {
        url: 'https://example.com',  // 真實場景可放 IG/FB/蝦皮 連結
        fingerprint
      });
    } catch(e) {
      console.error('無法啟動 Crawler 偵測：', e.message);
    }

    res.json({
      message: '上傳成功',
      fingerprint,
      cloudinaryUrl: cloudRes.secure_url,
      workId: newWork.id
    });
  } catch (err) {
    console.error('上傳失敗：', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * [ 取得當前用戶的侵權列表 ]
 */
app.get('/infringements', async (req, res) => {
  try {
    const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if(!decoded) {
      return res.status(401).json({ error: '未授權或Token已失效' });
    }
    const user = await User.findByPk(decoded.userId);
    if(!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    const works = await Work.findAll({ where: { userId: user.id }});
    const workIds = works.map(w => w.id);
    const infs = await Infringement.findAll({ where: { workId: workIds } });
    res.json({ works, infringements: infs });
  } catch (err) {
    console.error('/infringements error:', err.message);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * [ DMCA 通報 ]
 */
app.post('/dmca/report', async (req, res) => {
  try {
    const { infringingUrl, workId } = req.body;
    if(!infringingUrl || !workId) {
      return res.status(400).json({ error: '缺少 infringingUrl 或 workId' });
    }

    const found = await Work.findByPk(workId);
    if(!found) {
      return res.status(404).json({ error: '無此作品id' });
    }

    // 找作者
    const user = await User.findByPk(found.userId);
    if(!user) {
      return res.status(404).json({ error: '作者不存在' });
    }

    const inf = await Infringement.create({
      workId,
      infringingUrl,
      status: 'pending'
    });

    // 自動寄信 (選擇性)
    if(DMCA_AUTO_NOTIFY === 'true') {
      try {
        await transporter.sendMail({
          from: EMAIL_FROM,
          to: 'dmca@some-platform.com',
          subject: `DMCA Takedown - WorkID ${workId}`,
          text: `侵權網址: ${infringingUrl}\n作者: ${user.email}\nFingerprint: ${found.fingerprint}`
        });
      } catch(e) {
        console.error('DMCA寄信失敗：', e.message);
      }
    }

    res.json({ message: 'DMCA通報已接收', autoNotified: DMCA_AUTO_NOTIFY, infId: inf.id });
  } catch (err) {
    console.error('dmca/report error:', err.message);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * [ 合法授權 - 將某筆侵權紀錄標記為 legalized ]
 */
app.post('/infringement/legalize', async (req, res)=>{
  try {
    const { infId } = req.body;
    const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if(!decoded) {
      return res.status(401).json({ error: '未授權或Token已失效' });
    }

    let inf = await Infringement.findByPk(infId);
    if(!inf) {
      return res.status(404).json({ error: '找不到此侵權記錄' });
    }

    let w = await Work.findByPk(inf.workId);
    if(!w || w.userId !== decoded.userId) {
      return res.status(403).json({ error: '無權操作此侵權記錄' });
    }

    inf.status = 'legalized';
    await inf.save();
    res.json({ message: '已標記為合法侵權(授權)', infId });
  } catch (err) {
    console.error('legalize error:', err.message);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * [ 提交法律訴訟 ]
 *  - 只是示範 => 可能寄信通知律師
 */
app.post('/infringement/lawsuit', async (req, res)=>{
  try {
    const { infId } = req.body;
    const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if(!decoded) {
      return res.status(401).json({ error: '未授權或Token已失效' });
    }

    let inf = await Infringement.findByPk(infId);
    if(!inf) {
      return res.status(404).json({ error: '找不到此侵權記錄' });
    }

    let w = await Work.findByPk(inf.workId);
    if(!w || w.userId !== decoded.userId) {
      return res.status(403).json({ error: '無權操作此侵權記錄' });
    }

    inf.status = 'lawsuit';
    await inf.save();

    // Demo: email 給律師
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: 'lawyer@kai.com',
        subject: `法律訴訟啟動 - InfId ${infId}`,
        text: `用戶ID:${decoded.userId} 對 ${inf.infringingUrl} 發起告訴, workId=${inf.workId}`
      });
    } catch(e) {
      console.error('通知律師失敗：', e.message);
    }

    res.json({ message: '法律訴訟已啟動', infId, status: 'lawsuit' });
  } catch (err) {
    console.error('lawsuit error:', err.message);
    res.status(500).json({ error: 'server error' });
  }
});

// 啟動 Sequelize & Express
(async ()=>{
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL 連線成功');
    await sequelize.sync(); // 同步資料表結構
  } catch(e) {
    console.error('PostgreSQL 連線失敗：', e.message);
  }

  const PORT = EXPRESS_PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Express server on port ${PORT}`);
  });
})();
