const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const upload = multer({ dest:'uploads/' });

function auth(req, res, next){
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/, '');
  if(!token) return res.status(401).json({ error:'未登入' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch(e){
    return res.status(403).json({ error:'token失效' });
  }
}

router.post('/', auth, upload.single('file'), (req, res)=>{
  if(!req.file){
    return res.status(400).json({ error:'未選擇檔案' });
  }
  // TODO: 在此把檔案資訊寫DB、或上傳Cloud/ IPFS/ S3...
  return res.json({
    message:'上傳成功',
    filename:req.file.filename
  });
});

module.exports = router;
