// express/routes/upload.js
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
const nodemailer = require('nodemailer');

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
  BLOCKCHAIN_RPC_URL,
  BLOCKCHAIN_PRIVATE_KEY,
  CONTRACT_ADDRESS,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  JWT_SECRET
} = process.env;

// DB model
const UserModel = require('../models/User')(db, DataTypes);

const Work = db.define('Work',{
  title: DataTypes.STRING,
  fingerprint: DataTypes.STRING,
  fileType: DataTypes.STRING,
  userId: DataTypes.INTEGER,
  chainRef: DataTypes.STRING
},{tableName:'works'});

// Cloudinary
const cloudinary = require('cloudinary').v2;
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

// Multer
const allowedMime = ['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/x-m4v','video/*'];
function fileFilter(req, file, cb){
  if(!allowedMime.includes(file.mimetype)){
    return cb(new Error('不支援的檔案類型'), false);
  }
  cb(null,true);
}
const upload = multer({dest:'uploads/', fileFilter});

// verify token
function verifyToken(token){
  try{
    return jwt.verify(token, JWT_SECRET);
  } catch(e){
    return null;
  }
}

router.post('/', upload.single('file'), async(req,res)=>{
  const token = req.headers.authorization?.replace('Bearer ','');
  if(!token) return res.status(401).json({error:'未登入,無法上傳'});
  let decoded = verifyToken(token);
  if(!decoded) return res.status(401).json({error:'Token無效或過期'});

  let user = await UserModel.findByPk(decoded.userId);
  if(!user) return res.status(404).json({error:'用戶不存在'});

  if(!req.file) return res.status(400).json({error:'缺少檔案file'});

  let fileType = req.file.mimetype.startsWith('image/')?'image':'video';
  // 角色檢查 => shortVideo => 15部 / ecommerce=>30張
  // 省略 or 稍後再加

  // 產生指紋 (sha256)
  let rawBuf = fs.readFileSync(req.file.path);
  let salt = uuidv4();
  let combined = Buffer.concat([rawBuf, Buffer.from(salt)]);
  let fingerprint = crypto.createHash('sha256').update(combined).digest('hex');

  // 上傳 Cloudinary
  try{
    let cloudRes = await cloudinary.uploader.upload(req.file.path, { resource_type:'auto'});
    fs.unlinkSync(req.file.path);

    // 上鏈
    let chainRef='';
    if(CONTRACT_ADDRESS!=='0xYourDeployedAddress'){
      try{
        const ctt = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
        let txReceipt = await ctt.methods.storeFingerprint("0x"+fingerprint).send({
          from: account.address,
          gas: 500000
        });
        chainRef = txReceipt.transactionHash;
      } catch(e){
        console.error('上鏈失敗:', e.message);
      }
    }

    // DB create
    let newWork = await Work.create({
      title: req.body.title || (fileType==='video'?'短影音':'商品圖'),
      fingerprint,
      fileType,
      userId: user.id,
      chainRef
    });

    // 呼叫爬蟲
    try{
      await axios.post('http://crawler:8081/detectInfringement',{
        fingerprint,
        workId:newWork.id,
        role:user.role
      });
    } catch(e){
      console.error('呼叫爬蟲失敗:', e.message);
    }

    res.json({
      message:'上傳成功, fingerprint='+fingerprint,
      chainRef,
      cloudinaryUrl: cloudRes.secure_url,
      workId:newWork.id
    });

  } catch(e){
    console.error('上傳錯誤:', e.message);
    res.status(500).json({error:e.toString()});
  }
});

module.exports = router;
