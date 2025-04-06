require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cloudinary = require('cloudinary').v2;
const Web3 = require('web3');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const {
  PORT = 3000,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASS,
  DB_NAME,
  JWT_SECRET,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  GANACHE_HOST = 'ganache',
  GANACHE_PORT = '8545',
  IPFS_API_URL = 'http://ipfs:5001'
} = process.env;

// 連線 PostgreSQL
const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME
});

// Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// Web3 連到 Ganache
const web3 = new Web3(`http://${GANACHE_HOST}:${GANACHE_PORT}`);

// JWT 驗證中介
function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'No Authorization header' });
  const token = auth.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch(e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Multer 上傳
const upload = multer({ storage: multer.memoryStorage() });

// 健康檢查
app.get('/api/health',(req,res)=>{
  res.json({status:'ok'});
});

// 註冊
app.post('/api/auth/register', async(req,res)=>{
  const { username, password } = req.body;
  if(!username||!password) return res.status(400).json({error:'Username/password missing'});
  try {
    const check = await pool.query(`SELECT id FROM users WHERE username=$1`, [username]);
    if(check.rowCount>0) {
      return res.status(400).json({error:'User exists'});
    }
    const hash = bcrypt.hashSync(password,10);
    await pool.query(`INSERT INTO users (username, password) VALUES ($1, $2)`, [username, hash]);
    res.json({message:'註冊成功'});
  } catch(e){
    console.error('Register error:', e);
    res.status(500).json({error:'DB error'});
  }
});

// 登入
app.post('/api/auth/login', async(req,res)=>{
  const { username, password } = req.body;
  if(!username||!password) return res.status(400).json({error:'Username/password missing'});
  try {
    const result = await pool.query(`SELECT id, username, password FROM users WHERE username=$1`, [username]);
    if(result.rowCount===0) return res.status(401).json({error:'User not found'});
    const user = result.rows[0];
    const match = bcrypt.compareSync(password, user.password);
    if(!match) return res.status(401).json({error:'Wrong password'});
    // 簽發 JWT
    const token = jwt.sign({id:user.id, username:user.username}, JWT_SECRET, {expiresIn:'1d'});
    res.json({token, username:user.username});
  } catch(e){
    console.error('Login error:', e);
    res.status(500).json({error:'DB error'});
  }
});

// 上傳檔案
app.post('/api/upload', authMiddleware, upload.single('file'), async(req,res)=>{
  if(!req.file) return res.status(400).json({error:'No file uploaded'});
  const fileBuffer = req.file.buffer;
  const originalName = req.file.originalname || 'uploadfile';
  try {
    // 1) Cloudinary 上傳
    const cloudResult = await new Promise((resolve, reject)=>{
      cloudinary.uploader.upload_stream({ resource_type:'auto' },(err,result)=>{
        if(err) reject(err);
        else resolve(result);
      }).end(fileBuffer);
    });
    const cloudUrl = cloudResult.secure_url;

    // 2) IPFS 上傳
    let ipfsHash = null;
    try {
      const form = new FormData();
      form.append('file', fileBuffer, { filename: originalName });
      const ipfsRes = await axios.post(`${IPFS_API_URL}/api/v0/add?pin=true`, form, {
        headers: form.getHeaders()
      });
      if(typeof ipfsRes.data === 'string'){
        // 可能是 multiline JSON
        const lines = ipfsRes.data.trim().split('\n');
        const firstLine = JSON.parse(lines[0]);
        ipfsHash = firstLine.Hash;
      } else {
        ipfsHash = ipfsRes.data.Hash;
      }
    } catch(e) {
      console.error('IPFS upload fail:', e.message);
    }

    // 3) 指紋 (本地 MD5 or call FastAPI)
    let fingerprint = null;
    try {
      const resp = await axios.post(`http://fastapi:8000/fingerprint`, {url: cloudUrl});
      fingerprint = resp.data.fingerprint;
    } catch(e) {
      console.error('Call FastAPI fingerprint fail:', e.message);
      // 備援：自己計算 MD5
      fingerprint = crypto.createHash('md5').update(fileBuffer).digest('hex');
    }

    // 4) 區塊鏈 (Ganache) 寫交易
    let txHash = null;
    try {
      const accounts = await web3.eth.getAccounts();
      if(accounts.length>0){
        const dataHex = web3.utils.asciiToHex(fingerprint);
        const receipt = await web3.eth.sendTransaction({
          from: accounts[0],
          to: accounts[0],
          data: dataHex,
          value: 0
        });
        txHash = receipt.transactionHash;
      }
    } catch(e){
      console.error('Chain TX fail:', e);
    }

    // 5) DB 新增記錄
    const userId = req.user.id;
    const insert = await pool.query(`
      INSERT INTO files (user_id, filename, fingerprint, ipfs_hash, cloud_url, tx_hash)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id, filename, fingerprint, ipfs_hash, cloud_url, dmca_flag, uploaded_at, tx_hash
    `, [userId, originalName, fingerprint, ipfsHash, cloudUrl, txHash]);
    const newFile = insert.rows[0];

    res.json(newFile);
  } catch(e){
    console.error('Upload error:', e);
    res.status(500).json({error:'File upload error'});
  }
});

// 取得使用者上傳的檔案列表
app.get('/api/files', authMiddleware, async(req,res)=>{
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT id, filename, fingerprint, ipfs_hash, cloud_url, dmca_flag, tx_hash, uploaded_at
      FROM files
      WHERE user_id=$1
      ORDER BY uploaded_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch(e){
    console.error('Get files error:', e);
    res.status(500).json({error:'DB error'});
  }
});

app.listen(PORT, ()=>{
  console.log(`Express listening on port ${PORT}`);
});
