// express/routes/infringement.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { DataTypes } = require('sequelize');

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM, DMCA_AUTO_NOTIFY } = process.env;

const User = db.define('User',{
  email: DataTypes.STRING
},{ tableName:'users'});

const Work = db.define('Work',{
  userId: DataTypes.INTEGER,
  fingerprint: DataTypes.STRING
},{ tableName:'works'});

const Infringement = db.define('Infringement',{
  workId: DataTypes.INTEGER,
  infringingUrl: DataTypes.TEXT,
  status: { type:DataTypes.STRING, defaultValue:'pending' },
  demandedPrice: DataTypes.DECIMAL
},{ tableName:'infringements'});

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure:false,
  auth:{ user:EMAIL_USER, pass:EMAIL_PASS }
});

function verifyToken(tk){
  try{ return jwt.verify(tk, process.env.JWT_SECRET);} catch(e){return null;}
}

router.get('/list', async(req,res)=>{
  const tk = req.headers.authorization?.replace('Bearer ','');
  if(!tk) return res.status(401).json({error:'未登入'});
  let dec = verifyToken(tk);
  if(!dec) return res.status(401).json({error:'token無效'});

  let works = await Work.findAll({ where:{ userId: dec.userId }});
  let wids = works.map(w=> w.id);
  let infs = await Infringement.findAll({ where:{ workId:wids }});
  res.json(infs);
});

// DMCA
router.post('/dmca', async(req,res)=>{
  const tk = req.headers.authorization?.replace('Bearer ','');
  if(!tk) return res.status(401).json({error:'未登入'});
  let dec = verifyToken(tk);
  if(!dec) return res.status(401).json({error:'token無效'});

  const { workId, infringingUrl } = req.body;
  if(!workId || !infringingUrl) return res.status(400).json({error:'缺 workId / infringingUrl'});

  let w = await Work.findByPk(workId);
  if(!w) return res.status(404).json({error:'作品不存在'});
  if(w.userId!==dec.userId) return res.status(403).json({error:'無權'});

  // create or update
  let inf = await Infringement.findOne({ where:{ workId, infringingUrl }});
  if(!inf){
    inf = await Infringement.create({ workId, infringingUrl, status:'dmca'});
  } else {
    inf.status='dmca';
    await inf.save();
  }

  if(DMCA_AUTO_NOTIFY==='true'){
    let us = await User.findByPk(w.userId);
    // email
    try{
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: 'dmca@some-platform.com',
        subject:`DMCA Takedown - WorkID ${workId}`,
        text:`侵權網址: ${infringingUrl}\n作者:${us.email}\nFingerprint:${w.fingerprint}`
      });
    }catch(e){
      console.error('dmca mail fail:', e.message);
    }
  }

  res.json({message:'DMCA已提交', infId:inf.id});
});

// 標記合法
router.post('/legalize', async(req,res)=>{
  const tk = req.headers.authorization?.replace('Bearer ','');
  if(!tk) return res.status(401).json({error:'未登入'});
  let dec = verifyToken(tk);
  if(!dec) return res.status(401).json({error:'token無效'});

  const { infId } = req.body;
  if(!infId) return res.status(400).json({error:'缺 infId'});

  let inf = await Infringement.findByPk(infId);
  if(!inf) return res.status(404).json({error:'找不到此侵權紀錄'});

  let w = await Work.findByPk(inf.workId);
  if(!w || w.userId!==dec.userId) return res.status(403).json({error:'無權操作'});
  
  inf.status='legalized';
  await inf.save();
  res.json({message:'已標記為合法授權', infId});
});

// 要求授權金
router.post('/licenseFee', async(req,res)=>{
  const tk = req.headers.authorization?.replace('Bearer ','');
  if(!tk) return res.status(401).json({error:'未登入'});
  let dec = verifyToken(tk);
  if(!dec) return res.status(401).json({error:'token無效'});

  const { infId, demandedPrice } = req.body;
  if(!infId || !demandedPrice) return res.status(400).json({error:'缺 infId/demandedPrice'});

  let inf = await Infringement.findByPk(infId);
  if(!inf) return res.status(404).json({error:'侵權記錄不存在'});

  let w = await Work.findByPk(inf.workId);
  if(!w || w.userId!==dec.userId) return res.status(403).json({error:'無權操作'});

  inf.status='licensingFeeRequested';
  inf.demandedPrice = demandedPrice;
  await inf.save();
  res.json({message:'已要求授權費', infId});
});

// 提告
router.post('/lawsuit', async(req,res)=>{
  const tk = req.headers.authorization?.replace('Bearer ','');
  if(!tk) return res.status(401).json({error:'未登入'});
  let dec = verifyToken(tk);
  if(!dec) return res.status(401).json({error:'token無效'});

  const { infId } = req.body;
  if(!infId) return res.status(400).json({error:'缺 infId'});

  let inf = await Infringement.findByPk(infId);
  if(!inf) return res.status(404).json({error:'侵權記錄不存在'});

  let w = await Work.findByPk(inf.workId);
  if(!w || w.userId!==dec.userId) return res.status(403).json({error:'無權操作'});

  inf.status='lawsuit';
  await inf.save();

  // email to lawyer
  try{
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: 'lawyer@kai.com',
      subject: '侵權提告 - InfID '+infId,
      text: `用戶 ${dec.userId} 要對該侵權發起法律訴訟, Url=${inf.infringingUrl}`
    });
  } catch(e){
    console.error('律師信件寄送失敗:', e.message);
  }

  res.json({message:'已提交訴訟', infId});
});

module.exports = router;
