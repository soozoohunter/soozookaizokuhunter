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
const axios = require('axios');

// 從 .env 讀
const {
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,
  JWT_SECRET,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  BLOCKCHAIN_RPC_URL,
  BLOCKCHAIN_PRIVATE_KEY,
  CONTRACT_ADDRESS,
  DMCA_AUTO_NOTIFY
} = process.env;

// Web3 init
const web3 = new Web3(BLOCKCHAIN_RPC_URL || 'http://geth:8545');
const contractABI = [
  {
    "inputs":[],"stateMutability":"nonpayable","type":"constructor"
  },
  {
    "inputs":[{"internalType":"bytes32","name":"hash","type":"bytes32"}],
    "name":"storeFingerprint",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  }
];
const account = web3.eth.accounts.privateKeyToAccount(BLOCKCHAIN_PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// Sequelize
const sequelize = new Sequelize(
  `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`,
  { dialect:'postgres', logging:false }
);

// 定義 DB Model
const User = sequelize.define('User',{
  email:{ type:DataTypes.STRING, unique:true },
  password_hash:DataTypes.STRING,
  role:DataTypes.STRING
},{ tableName:'users' });

const Work = sequelize.define('Work',{
  title:DataTypes.STRING,
  fingerprint:DataTypes.STRING,
  cloudinaryUrl:DataTypes.STRING,
  userId:DataTypes.INTEGER,
  fileType:DataTypes.STRING
},{ tableName:'works' });

const Infringement = sequelize.define('Infringement',{
  workId:DataTypes.INTEGER,
  infringingUrl:DataTypes.STRING,
  status:{ type:DataTypes.STRING, defaultValue:'pending' },
  infringerEmail:DataTypes.STRING
},{ tableName:'infringements' });

// Email
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false,
  auth:{ user:EMAIL_USER, pass:EMAIL_PASS }
});

// JWT
const revokedTokens = new Set();
function signToken(payload){
  return jwt.sign(payload, JWT_SECRET, { expiresIn:'2h' });
}
function verifyToken(token){
  if(revokedTokens.has(token)) return null;
  try{ return jwt.verify(token, JWT_SECRET);}catch(e){ return null;}
}

// Cloudinary
cloudinary.config({
  cloud_name:CLOUDINARY_CLOUD_NAME,
  api_key:CLOUDINARY_API_KEY,
  api_secret:CLOUDINARY_API_SECRET
});

// Multer
const allowedMime = [
  'image/jpeg','image/png','image/gif','image/webp',
  'video/mp4','video/x-m4v','video/*'
];
function fileFilter(req, file, cb){
  if(!allowedMime.includes(file.mimetype)){
    return cb(new Error('不支援的檔案類型'), false);
  }
  cb(null,true);
}
const upload = multer({ dest:'uploads/', fileFilter });

// Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended:true }));

// 健康檢查
app.get('/health',(req,res)=>{
  res.json({ status:'ok', service:'Express VFinal' });
});

// 個人資訊API：示例 (不需要任何 JWT 驗證，純範例)
app.get('/api/personalInfo',(req,res)=>{
  const userProfile = {
    name: 'Kai 凱',
    profession: '創業家 / iOS & Android App 開發者 / 律師 / 全球智慧財產權專家',
    motto: '天馬行空的想像力結合具體行動，化為上市可行的App.',
    contactEmail: 'kai@kaishield.com'
  };
  res.json({ userProfile });
});

// 註冊
app.post('/signup', async(req,res)=>{
  const { email, password, role } = req.body;
  if(!email || !password){
    return res.status(400).json({ error:'缺少 email 或 password' });
  }
  // role 可選 shortVideo / ecommerce，預設 shortVideo
  let userRole = role || 'shortVideo';
  if(!['shortVideo','ecommerce'].includes(userRole)){
    userRole = 'shortVideo';
  }
  const bcrypt = require('bcrypt');
  let exist = await User.findOne({ where:{email} });
  if(exist) return res.status(400).json({ error:'Email已存在' });

  let hashed = await bcrypt.hash(password,10);
  let newUser = await User.create({ email, password_hash:hashed, role:userRole });

  // 寄歡迎信
  try{
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject:'[Suzookaizokuhunter] 歡迎註冊',
      text:'感謝您註冊 Suzookaizokuhunter，侵權獵殺功能已啟用。'
    });
  } catch(e){
    console.error('寄信失敗:', e.message);
  }

  res.json({ message:'註冊成功', userId:newUser.id, role:userRole });
});

// 登入
app.post('/login', async(req,res)=>{
  const { email, password } = req.body;
  const bcrypt = require('bcrypt');
  let user = await User.findOne({ where:{email} });
  if(!user) return res.status(401).json({ error:'該用戶不存在' });
  let match = await bcrypt.compare(password, user.password_hash);
  if(!match) return res.status(401).json({ error:'密碼錯誤' });

  let token = signToken({ userId:user.id, email, role:user.role });
  res.json({ message:'登入成功', token, role:user.role });
});

// 登出
app.post('/logout',(req,res)=>{
  const token = req.headers.authorization?.replace('Bearer ','');
  if(!token) return res.status(400).json({ error:'缺少token' });
  revokedTokens.add(token);
  res.json({ message:'已登出, Token已撤銷' });
});

// 上傳檔案 (支援短影音 / 商品照片)
app.post('/upload', upload.single('file'), async(req,res)=>{
  const token = req.headers.authorization?.replace('Bearer ','');
  const decoded = verifyToken(token);
  if(!decoded) return res.status(401).json({ error:'未授權' });

  if(!req.file) return res.status(400).json({ error:'請選擇檔案' });
  let user = await User.findByPk(decoded.userId);
  if(!user) return res.status(404).json({ error:'用戶不存在' });

  // 檔案類型 (image 或 video)
  let fileType = req.file.mimetype.startsWith('image/') ? 'image':'video';

  // 檢查上傳數量
  let userWorks = await Work.findAll({where:{userId:user.id}});
  let imageCount = userWorks.filter(w=>w.fileType==='image').length;
  let videoCount = userWorks.filter(w=>w.fileType==='video').length;

  if(user.role==='shortVideo'){
    // 短影音網紅：只允許上傳 video，上限5部
    if(fileType==='image'){
      return res.status(400).json({ error:'短影音網紅只允許上傳影片' });
    }
    if(videoCount >= 5){
      return res.status(400).json({ error:'已達短影音5部上限' });
    }
  } else if(user.role==='ecommerce'){
    // 電商：可上傳圖片(上限30) + 影片(上限2)
    if(fileType==='image'){
      if(imageCount>=30) return res.status(400).json({ error:'已達商品照30張上限' });
    } else{
      if(videoCount>=2) return res.status(400).json({ error:'已達短影音2部上限' });
    }
  }

  // 產生指紋
  let fileBuf = fs.readFileSync(req.file.path);
  let salt = uuidv4();
  let combined = Buffer.concat([fileBuf, Buffer.from(salt)]);
  let fingerprint = crypto.createHash('sha3-256').update(combined).digest('hex');

  try{
    // 上傳 Cloudinary
    let cloudRes = await cloudinary.uploader.upload(req.file.path, { resource_type:'auto' });
    fs.unlinkSync(req.file.path);

    // DB: 新增作品紀錄
    let newWork = await Work.create({
      title: req.body.title || (fileType==='video'?'短影音':'商品照片'),
      fingerprint,
      cloudinaryUrl: cloudRes.secure_url,
      userId: user.id,
      fileType
    });

    // 上鏈 storeFingerprint
    if(CONTRACT_ADDRESS && CONTRACT_ADDRESS!=='0xYourDeployedAddress'){
      try{
        let contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
        let txReceipt = await contract.methods.storeFingerprint("0x"+fingerprint).send({
          from: account.address,
          gas: 500000
        });
        console.log('Fingerprint上鏈成功:', txReceipt.transactionHash);
      } catch(e){
        console.error('上鏈失敗:', e.message);
      }
    }

    // 呼叫爬蟲 => /detectInfringement
    try{
      await axios.post('http://crawler:8081/detectInfringement',{
        fingerprint,
        workId:newWork.id,
        role:user.role
      });
      console.log('已呼叫爬蟲檢測侵權');
    } catch(e){
      console.error('呼叫爬蟲失敗:', e.message);
    }

    res.json({
      message:'上傳成功, 已啟動侵權偵測',
      fingerprint,
      cloudinaryUrl:cloudRes.secure_url,
      workId:newWork.id
    });
  }catch(e){
    console.error('上傳錯誤:', e.message);
    res.status(500).json({ error:e.toString() });
  }
});

// DMCA 通報
app.post('/dmca/report', async(req,res)=>{
  const { infringingUrl, workId } = req.body;
  if(!infringingUrl || !workId){
    return res.status(400).json({ error:'缺少 infringingUrl / workId' });
  }
  let found = await Work.findByPk(workId);
  if(!found) return res.status(404).json({ error:'無此作品id' });

  // 找作者
  let user = await User.findByPk(found.userId);
  if(!user){
    return res.status(404).json({ error:'作者不存在' });
  }

  if(DMCA_AUTO_NOTIFY==='true'){
    try{
      await transporter.sendMail({
        from: EMAIL_FROM,
        to:'dmca@some-platform.com',
        subject:`DMCA Takedown - WorkID ${workId}`,
        text:`侵權網址: ${infringingUrl}\n作者: ${user.email}\nFingerprint:${found.fingerprint}`
      });
      console.log('DMCA信件已寄出');
    }catch(e){
      console.error('DMCA寄信失敗:', e.message);
    }
  }

  res.json({ message:'DMCA通報已接收', autoNotified:DMCA_AUTO_NOTIFY });
});

// 重複健康檢查路由(可省)
app.get('/health',(req,res)=>{
  res.json({status:'ok', service:'Express VFinal'});
});

// 啟動
(async()=>{
  try{
    await sequelize.authenticate();
    console.log('PostgreSQL 連線成功');
    await sequelize.sync();
  } catch(e){
    console.error('PostgreSQL 連線失敗:', e.message);
  }
  app.listen(3000, ()=>{
    console.log('Express VFinal on port 3000');
  });
})();
