require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { DataTypes } = require('sequelize');
const db = require('../db');
const nodemailer = require('nodemailer');

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  DMCA_AUTO_NOTIFY,
  JWT_SECRET
} = process.env;

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

const User = db.define('User',{
  email: DataTypes.STRING
},{tableName:'users'});

const Work = db.define('Work',{
  userId: DataTypes.INTEGER,
  fingerprint: DataTypes.STRING
},{tableName:'works'});

const Infringement = db.define('Infringement',{
  workId: DataTypes.INTEGER,
  infringingUrl: DataTypes.TEXT,
  status: { type: DataTypes.STRING, defaultValue:'pending' },
  demandedPrice: DataTypes.DECIMAL
},{tableName:'infringements'});

function verifyToken(tk){
  try{
    return jwt.verify(tk, JWT_SECRET || 'KaiKaiShieldSecret');
  }catch(e){
    return null;
  }
}

// 新增：爬蟲偵測 → foundInfringement
router.post('/foundInfringement', async(req,res)=>{
  const { workId, infringingUrl, status } = req.body;
  if(!workId || !infringingUrl){
    return res.status(400).json({ error:'缺參數' });
  }
  let w = await Work.findByPk(workId);
  if(!w) return res.status(404).json({ error:'無此作品' });

  let inf = await Infringement.findOne({ where:{ workId, infringingUrl }});
  if(!inf){
    inf = await Infringement.create({
      workId,
      infringingUrl,
      status: status || 'detected'
    });
  } else {
    inf.status = status || 'detected';
    await inf.save();
  }

  // 可寄信給該作品作者
  try {
    let author = await User.findByPk(w.userId);
    // mail
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: author.email,
      subject:'[速誅侵權獵人] 偵測到疑似侵權',
      text:`已為您偵測到疑似侵權: ${infringingUrl}\n請至系統後台進行確認或申訴。`
    });
  } catch(e){
    console.error('通知用戶偵測到侵權失敗:', e.message);
  }

  res.json({ message:'已記錄侵權(detected)，等待用戶確認', inf });
});

// 列出侵權
router.get('/list', async(req,res)=>{
  let tk = req.headers.authorization?.replace('Bearer ','');
  if(!tk) return res.status(401).json({ error:'未登入' });
  let dec = verifyToken(tk);
  if(!dec) return res.status(401).json({ error:'token無效' });

  // 找該user全部作品
  let works = await Work.findAll({ where: { userId: dec.userId } });
  let wids = works.map(w=> w.id);
  // 侵權列表
  let infs = await Infringement.findAll({ where:{ workId: wids }});
  res.json(infs);
});

// 點擊 DMCA
router.post('/dmca', async(req,res)=>{
  let tk = req.headers.authorization?.replace('Bearer ','');
  if(!tk) return res.status(401).json({ error:'未登入' });
  let dec = verifyToken(tk);
  if(!dec) return res.status(401).json({ error:'token無效' });

  let { workId, infringingUrl } = req.body;
  if(!workId || !infringingUrl){
    return res.status(400).json({ error:'缺參數' });
  }
  let w = await Work.findByPk(workId);
  if(!w) return res.status(404).json({ error:'無此作品' });
  if(w.userId !== dec.userId) return res.status(403).json({ error:'無權操作此作品' });

  let inf = await Infringement.findOne({ where:{ workId, infringingUrl }});
  if(!inf){
    inf = await Infringement.create({ workId, infringingUrl, status:'dmca' });
  } else {
    inf.status = 'dmca';
    await inf.save();
  }

  if(DMCA_AUTO_NOTIFY==='true'){
    // email -> dmca@some-platform.com (示範)
    try{
      let user=await User.findByPk(w.userId);
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: 'dmca@some-platform.com',
        subject: `DMCA - WorkID=${workId}`,
        text: `侵權網址:${infringingUrl}\n作者:${user.email}\nFingerprint:${w.fingerprint}`
      });
    }catch(e){
      console.error('DMCA email fail:', e.message);
    }
  }
  res.json({ message:'DMCA完成', infId: inf.id });
});

// 標記合法
router.post('/legalize', async(req,res)=>{
  let tk = req.headers.authorization?.replace('Bearer ','');
  if(!tk) return res.status(401).json({ error:'未登入' });
  let dec = verifyToken(tk);
  if(!dec) return res.status(401).json({ error:'token無效' });

  let { infId } = req.body;
  if(!infId) return res.status(400).json({ error:'缺 infId' });
  let inf = await Infringement.findByPk(infId);
  if(!inf) return res.status(404).json({ error:'找不到紀錄' });
  let w = await Work.findByPk(inf.workId);
  if(!w || w.userId!==dec.userId) return res.status(403).json({ error:'無權操作' });

  inf.status='legalized';
  await inf.save();
  res.json({ message:'已標記為合法', infId });
});

// 要求授權費
router.post('/licenseFee', async(req,res)=>{
  let tk = req.headers.authorization?.replace('Bearer ','');
  if(!tk) return res.status(401).json({ error:'未登入' });
  let dec = verifyToken(tk);
  if(!dec) return res.status(401).json({ error:'token無效' });

  let { infId, demandedPrice } = req.body;
  if(!infId||!demandedPrice) return res.status(400).json({ error:'缺 infId/demandedPrice'});

  let inf = await Infringement.findByPk(infId);
  if(!inf) return res.status(404).json({ error:'不存在' });
  let w = await Work.findByPk(inf.workId);
  if(!w || w.userId!==dec.userId) return res.status(403).json({ error:'無權操作' });

  inf.status='licensingFeeRequested';
  inf.demandedPrice=demandedPrice;
  await inf.save();
  res.json({ message:'已要求授權費', infId });
});

// 提告
router.post('/lawsuit', async(req,res)=>{
  let tk = req.headers.authorization?.replace('Bearer ','');
  if(!tk) return res.status(401).json({ error:'未登入' });
  let dec = verifyToken(tk);
  if(!dec) return res.status(401).json({ error:'token無效' });

  let { infId } = req.body;
  if(!infId) return res.status(400).json({ error:'缺 infId' });

  let inf = await Infringement.findByPk(infId);
  if(!inf) return res.status(404).json({ error:'無此侵權紀錄' });
  let w = await Work.findByPk(inf.workId);
  if(!w || w.userId!==dec.userId) return res.status(403).json({ error:'無權操作' });

  inf.status='lawsuit';
  await inf.save();

  // email -> lawyer
  try{
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: 'lawyer@kai.com',
      subject: '提告 - infId='+infId,
      text:`用戶 ${dec.userId} 對侵權:${inf.infringingUrl} 提告`
    });
  }catch(e){
    console.error('寄給律師失敗:', e.message);
  }
  res.json({ message:'已提交訴訟', infId });
});

module.exports = router;
