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
const Web3 = require('web3');

const {
  POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT,
  JWT_SECRET,
  EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM,
  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
  DMCA_AUTO_NOTIFY,
  BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS
} = process.env;

// 區塊鏈
const web3 = new Web3(BLOCKCHAIN_RPC_URL || 'http://geth:8545');
const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{ "internalType":"bytes32", "name":"hash", "type":"bytes32"}],
    "name":"storeFingerprint",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  }
];
const account = web3.eth.accounts.privateKeyToAccount(BLOCKCHAIN_PRIVATE_KEY || '0xdead');
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// Sequelize
const sequelize = new Sequelize(
  `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`,
  { dialect:'postgres', logging:false }
);

// 定義 Models
const User = sequelize.define('User',{
  email: { type: DataTypes.STRING, unique:true },
  password_hash: DataTypes.STRING
},{ tableName:'users' });

const Work = sequelize.define('Work',{
  title: DataTypes.STRING,
  fingerprint: DataTypes.STRING,
  cloudinaryUrl: DataTypes.STRING,
  userId: DataTypes.INTEGER
},{ tableName:'works' });

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn:'2h' });
}
function verifyToken(token) {
  if(revokedTokens.has(token)) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch(e) {
    return null;
  }
}

// Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// Multer
const allowedMime = [
  'image/jpeg','image/png','image/gif','image/webp',
  'video/mp4','video/x-m4v','video/*'
];
function fileFilter(req, file, cb) {
  if(!allowedMime.includes(file.mimetype)) {
    return cb(new Error('不支援此檔案類型'), false);
  }
  cb(null,true);
}
const upload = multer({ dest:'uploads/', fileFilter });

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// 健康檢查
app.get('/health',(req,res)=>{
  res.json({status:'ok', service:'Express v9'});
});

// ============ 註冊 ============
app.post('/signup', async(req,res)=>{
  const { email, password } = req.body;
  if(!email || !password) {
    return res.status(400).json({error:'缺少 email 或 password'});
  }
  const bcrypt = require('bcrypt');
  try {
    let exist = await User.findOne({where:{email}});
    if(exist) {
      return res.status(400).json({error:'Email 已被註冊'});
    }
    let hashed = await bcrypt.hash(password,10);
    let newUser = await User.create({ email, password_hash: hashed });
    // 寄歡迎信
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: 'KaiKaiShield 歡迎信',
        text: '感謝您註冊 KaiKaiShield，並已啟用功能。'
      });
    } catch(e) {
      console.error('寄歡迎信失敗:', e.message);
    }
    res.json({message:'註冊成功', userId:newUser.id});
  } catch(e) {
    console.error('signup error:', e.message);
    res.status(500).json({error:'server error'});
  }
});

// ============ 登入 ============
app.post('/login', async(req,res)=>{
  const { email, password } = req.body;
  if(!email || !password) {
    return res.status(400).json({error:'缺少 email 或 password'});
  }
  const bcrypt = require('bcrypt');
  try {
    let user = await User.findOne({ where:{email} });
    if(!user) return res.status(401).json({error:'用戶不存在'});
    let match = await bcrypt.compare(password, user.password_hash);
    if(!match) return res.status(401).json({error:'密碼錯誤'});

    let token = signToken({ userId: user.id, email });
    res.json({message:'登入成功', token});
  } catch(e) {
    console.error('login error:', e.message);
    res.status(500).json({error:'server error'});
  }
});

// ============ 登出 ============
app.post('/logout',(req,res)=>{
  const token = req.headers.authorization?.replace('Bearer ','');
  if(!token) return res.status(400).json({error:'缺少 token'});
  revokedTokens.add(token);
  res.json({message:'已登出, Token已撤銷'});
});

// ============ 上傳檔案 + 指紋上鏈 ============
app.post('/upload', upload.single('file'), async(req,res)=>{
  const token = req.headers.authorization?.replace('Bearer ','');
  const decoded = verifyToken(token);
  if(!decoded) return res.status(401).json({error:'未授權或Token無效'});
  if(!req.file) return res.status(400).json({error:'請選擇檔案'});

  try {
    let fileBuf = fs.readFileSync(req.file.path);
    let salt = uuidv4();
    let combined = Buffer.concat([fileBuf, Buffer.from(salt)]);
    let fingerprint = crypto.createHash('sha3-256').update(combined).digest('hex');

    // 上傳 Cloudinary
    let cloudRes = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto'
    });
    fs.unlinkSync(req.file.path); // 刪除本地暫存

    // 寫入 DB
    let newWork = await Work.create({
      title: req.body.title || 'Untitled',
      fingerprint,
      cloudinaryUrl: cloudRes.secure_url,
      userId: decoded.userId
    });

    // 若合約位址已存在 => 執行 storeFingerprint
    if(CONTRACT_ADDRESS && CONTRACT_ADDRESS!='0x110cb167ea55c3467cd82fdef9dd570b7d3f30b8') {
      try {
        let contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
        let txReceipt = await contract.methods.storeFingerprint("0x"+fingerprint).send({
          from: account.address,
          gas: 500000
        });
        console.log('fingerprint 上鏈成功:', txReceipt.transactionHash);
      } catch(e) {
        console.error('上鏈失敗:', e.message);
      }
    }

    res.json({
      message: '上傳成功',
      fingerprint,
      cloudinaryUrl: cloudRes.secure_url,
      workId: newWork.id
    });
  } catch(e) {
    console.error('upload error:', e.message);
    res.status(500).json({error:e.message});
  }
});

// ============ DMCA 通報 ============
app.post('/dmca/report', async(req,res)=>{
  try {
    const { infringingUrl, workId } = req.body;
    if(!infringingUrl || !workId) {
      return res.status(400).json({error:'缺少 infringingUrl 或 workId'});
    }
    let found = await Work.findByPk(workId);
    if(!found) {
      return res.status(404).json({error:'無此作品id'});
    }

    let user = await User.findByPk(found.userId);
    if(!user) {
      return res.status(404).json({error:'作者不存在'});
    }

    // 自動寄信
    if(DMCA_AUTO_NOTIFY==='true') {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: 'dmca@some-platform.com',  // 平台的DMCA郵箱
        subject: `DMCA Takedown - WorkID ${workId}`,
        text: `侵權網址: ${infringingUrl}\n作者: ${user.email}\nFingerprint: ${found.fingerprint}`
      });
    }

    res.json({message:'DMCA通報已接收', autoNotified: DMCA_AUTO_NOTIFY});
  } catch(e) {
    console.error('dmca/report error:', e.message);
    res.status(500).json({error:'server error'});
  }
});

// 啟動
(async ()=>{
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL 連線成功');
    await sequelize.sync();
  } catch(e) {
    console.error('PostgreSQL 連線失敗:', e.message);
  }
  app.listen(3000, ()=>{
    console.log('Express v9 on port 3000');
  });
})();
