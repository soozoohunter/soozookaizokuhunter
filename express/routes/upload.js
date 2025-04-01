require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');
const db = require('../db');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

const Web3 = require('web3');
const contractABI = [
  {
    "inputs":[],
    "stateMutability":"nonpayable",
    "type":"constructor"
  },
  {
    "inputs":[{"internalType":"bytes32","name":"hash","type":"bytes32"}],
    "name":"storeFingerprint",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  }
];

const {
  JWT_SECRET,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  BLOCKCHAIN_RPC_URL,
  BLOCKCHAIN_PRIVATE_KEY,
  CONTRACT_ADDRESS
} = process.env;

const User = db.define('User',{
  email: { type:DataTypes.STRING },
  passwordHash: DataTypes.STRING,
  role: { type:DataTypes.ENUM('shortVideo','ecommerce'), defaultValue:'shortVideo' }
},{ tableName:'users'});

const Work = db.define('Work',{
  title:DataTypes.STRING,
  fingerprint:DataTypes.STRING,
  fileType:DataTypes.STRING,
  userId:DataTypes.INTEGER,
  chainRef:DataTypes.STRING
},{tableName:'works'});

// Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// Web3
const web3 = new Web3(BLOCKCHAIN_RPC_URL);
const account = web3.eth.accounts.privateKeyToAccount(BLOCKCHAIN_PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// multer
const allowedMime = ['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/x-m4v','video/*'];
function fileFilter(req,file,cb){
  if(!allowedMime.includes(file.mimetype)) return cb(new Error('不支援檔案類型'),false);
  cb(null,true);
}
const upload = multer({ dest:'uploads/', fileFilter});

function verifyToken(token){
  try{
    return jwt.verify(token, JWT_SECRET);
  }catch(e){
    return null;
  }
}

// POST /upload
router.post('/', upload.single('file'), async(req,res)=>{
  const tk = req.headers.authorization && req.headers.authorization.replace('Bearer ','');
  if(!tk) return res.status(401).json({error:'未登入'});
  let dec = verifyToken(tk);
  if(!dec) return res.status(401).json({error:'token無效'});

  if(!req.file) return res.status(400).json({error:'缺檔案'});
  let user = await User.findByPk(dec.userId);
  if(!user) return res.status(404).json({error:'用戶不存在'});

  let fileType = req.file.mimetype.startsWith('image/')?'image':'video';
  // role=shortVideo => 最多15部, ecommerce=>最多30
  // (略) 省略數量檢查

  // fingerprint
  let rawBuf = fs.readFileSync(req.file.path);
  let salt = uuidv4();
  let combined = Buffer.concat([ rawBuf, Buffer.from(salt)]);
  let fingerprint = crypto.createHash('sha256').update(combined).digest('hex');

  try{
    // Cloudinary
    let cloudRes = await cloudinary.uploader.upload(req.file.path,{
      resource_type:'auto'
    });
    fs.unlinkSync(req.file.path);

    // storeFingerprint => chainRef
    let chainRef = '';
    if(CONTRACT_ADDRESS && CONTRACT_ADDRESS!=='0xYourDeployedAddress'){
      try{
        let ctt = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
        let txReceipt = await ctt.methods.storeFingerprint("0x"+fingerprint).send({
          from: account.address,
          gas: 500000
        });
        chainRef = txReceipt.transactionHash;
      } catch(e){
        console.error('上鏈失敗:', e.message);
      }
    }

    // DB
    let newWork = await Work.create({
      title: req.body.title || (fileType==='video'?'短影音':'商品圖'),
      fingerprint,
      fileType,
      userId: user.id,
      chainRef
    });

    // 呼叫 Crawler => detectInfringement
    try{
      await axios.post('http://crawler:8081/detectInfringement',{
        fingerprint,
        workId:newWork.id,
        role:user.role
      });
    }catch(e){
      console.error('crawler post fail:', e.message);
    }

    res.json({
      message:'上傳成功, fingerprint='+fingerprint,
      chainRef,
      cloudUrl: cloudRes.secure_url,
      workId:newWork.id
    });
  } catch(e){
    console.error('upload fail:', e.message);
    res.status(500).json({error:e.toString()});
  }
});

module.exports = router;
