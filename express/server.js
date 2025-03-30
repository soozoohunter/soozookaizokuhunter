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
const axios = require('axios'); // 用於呼叫 Crawler

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

// .env
const {
  POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT,
  JWT_SECRET,
  EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM,
  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
  DMCA_AUTO_NOTIFY
} = process.env;

// Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// Sequelize
const sequelize = new Sequelize(
  `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`,
  { dialect: 'postgres', logging: false }
);

// Models
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

// Nodemailer
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false,
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

// Multer
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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Express V9' });
});

// 註冊 (可帶 role: 'ecommerce' or 'shortVideo')
app.post('/signup', async (req, res) => {
  const { email, password, role } = req.body; 
  if(!email || !password) {
    return res.status(400).json({ error: '缺少 email 或 password' });
  }
  // 角色限制
  if(!['ecommerce','shortVideo'].includes(role)) {
    return res.status(400).json({ error: '角色必須是 ecommerce 或 shortVideo' });
  }

  const bcrypt = require('bcrypt');
  let exist = await User.findOne({ where: { email } });
  if(exist) return res.status(400).json({ error: 'Email 已被註冊' });

  let hashed = await bcrypt.hash(password, 10);
  let newUser = await User.create({ email, password_hash: hashed, role });

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'KaiKaiShield 歡迎信',
      text: '感謝您註冊 KaiKaiShield，本服務已為您開通。\n為了紀念最愛的奶奶 曾李宿豬 女士，打造了此清泉偵測系統。'
    });
  } catch(e) {
    console.error('寄信失敗：', e.message);
  }

  res.json({ message: '註冊成功', userId: newUser.id });
});

// 登入
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const bcrypt = require('bcrypt');

  let user = await User.findOne({ where: { email } });
  if(!user) return res.status(401).json({ error: 'User not found' });

  let match = await bcrypt.compare(password, user.password_hash);
  if(!match) return res.status(401).json({ error: '密碼錯誤' });

  let token = signToken({ userId: user.id, email, role: user.role });
  res.json({ message: '登入成功', token, role: user.role });
});

// 登出
app.post('/logout', (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '');
  if(!token) return res.status(400).json({ error: '缺少token' });
  revokedTokens.add(token);
  res.json({ message: '已登出, Token已被撤銷' });
});

// 上傳 + storeFingerprint
// - 若 role=ecommerce，限制最多30張商品照
// - 若 role=shortVideo，限制最多5部短影片
app.post('/upload', upload.single('file'), async (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if(!decoded) return res.status(401).json({ error: '未授權或Token已失效' });

  if(!req.file) return res.status(400).json({ error: '請選擇檔案' });

  // 查角色
  let user = await User.findByPk(decoded.userId);
  if(!user) return res.status(404).json({ error: '找不到使用者' });

  // 根據角色檢查數量限制
  let worksCount = await Work.count({ where: { userId: user.id }});
  if(user.role === 'ecommerce' && worksCount >= 30) {
    return res.status(400).json({ error: '已達商品照上傳30張上限' });
  }
  if(user.role === 'shortVideo' && worksCount >= 5) {
    return res.status(400).json({ error: '已達短影音上傳5部上限' });
  }

  const fileBuffer = fs.readFileSync(req.file.path);

  // 用 uuidv4 + sha3-256 產生指紋
  const salt = uuidv4();
  const combined = Buffer.concat([fileBuffer, Buffer.from(salt)]);
  const fingerprint = crypto.createHash('sha3-256').update(combined).digest('hex');

  try {
    // 上傳到 Cloudinary
    let cloudRes = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto'
    });
    fs.unlinkSync(req.file.path);

    // 寫DB
    let newWork = await Work.create({
      title: req.body.title || (user.role==='shortVideo'?'短影音':'商品照片'),
      fingerprint,
      cloudinaryUrl: cloudRes.secure_url,
      userId: user.id
    });

    // storeFingerprint (上鏈)
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

    // 呼叫 Crawler 進行侵權偵測 (可加參數: shortVideo or ecommerce)
    try {
      await axios.post('http://crawler:8081/detect', {
        url: "https://example.com",  // 實際應改成蝦皮/FB/IG/...
        fingerprint
      });
    } catch(e) {
      console.error('啟動爬蟲容器失敗:', e.message);
    }

    res.json({
      message: '上傳成功',
      fingerprint,
      cloudinaryUrl: cloudRes.secure_url,
      workId: newWork.id
    });
  } catch(e) {
    console.error('上傳失敗：', e.message);
    res.status(500).json({ error: e.toString() });
  }
});

// 侵權列表
app.get('/infringements', async (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if(!decoded) return res.status(401).json({ error: '未授權或Token已失效' });

  let user = await User.findByPk(decoded.userId);
  if(!user) return res.status(404).json({ error: '找不到使用者' });

  // 找此用戶 works => infringements
  let works = await Work.findAll({ where: { userId: user.id }});
  let workIds = works.map(w=>w.id);
  let infs = await Infringement.findAll({ where: { workId: workIds }});
  res.json({ works, infringements: infs });
});

// DMCA 通報
app.post('/dmca/report', async (req, res) => {
  const { infringingUrl, workId } = req.body;
  if(!infringingUrl || !workId) {
    return res.status(400).json({ error: '缺少 infringingUrl 或 workId' });
  }

  let found = await Work.findByPk(workId);
  if(!found) {
    return res.status(404).json({ error: '無此作品id' });
  }

  // 找作者
  let user = await User.findByPk(found.userId);
  if(!user) {
    return res.status(404).json({ error: '作者不存在' });
  }

  // 在 DB 加一筆 infringement
  let inf = await Infringement.create({
    workId: workId,
    infringingUrl,
    status: 'pending'
  });

  // 自動寄信
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
});

// 合法授權
app.post('/infringement/legalize', async (req, res)=>{
  const { infId } = req.body;
  const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if(!decoded) return res.status(401).json({ error: '未授權或Token已失效' });

  let inf = await Infringement.findByPk(infId);
  if(!inf) return res.status(404).json({error:'找不到侵權記錄 infId'});

  // 檢查這筆 infringement 對應的 work => userId 是否是當前用戶
  let w = await Work.findByPk(inf.workId);
  if(!w || w.userId!==decoded.userId) {
    return res.status(403).json({ error: '無權操作此侵權記錄' });
  }

  // 標記為 legalized
  inf.status = 'legalized';
  await inf.save();
  res.json({ message: '已標記侵權方為合法, 不再偵測', infId });
});

// 提交法律訴訟
app.post('/infringement/lawsuit', async (req, res)=>{
  const { infId } = req.body;
  const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if(!decoded) return res.status(401).json({ error: '未授權或Token已失效' });

  let inf = await Infringement.findByPk(infId);
  if(!inf) return res.status(404).json({error:'找不到侵權記錄 infId'});

  // 檢查這筆 infringement => userId
  let w = await Work.findByPk(inf.workId);
  if(!w || w.userId!==decoded.userId) {
    return res.status(403).json({ error: '無權操作此侵權記錄' });
  }

  // 這裡只是示範 => 可能要付費 / 簽署協議
  inf.status = 'lawsuit';
  await inf.save();

  // Demo: email 給律師
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: 'lawyer@kai.com',
      subject: '法律訴訟啟動 - InfId '+infId,
      text: `用戶ID:${decoded.userId} 要對連結${inf.infringingUrl} 提交告訴, workId=${inf.workId}`
    });
  } catch(e) {
    console.error('通知律師失敗：', e.message);
  }

  res.json({ message: '法律訴訟已啟動', infId, status: 'lawsuit' });
});

(async ()=>{
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL 連線成功');
    await sequelize.sync();
  } catch(e) {
    console.error('連線失敗：', e);
  }

  app.listen(3000, ()=>{
    console.log('Express (V9) on port 3000');
  });
})();
