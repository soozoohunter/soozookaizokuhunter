// express/routes/infringement.js

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

// nodemailer
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// 模型 (可改成 require('../models/Work'), require('../models/Infringement') 之類)
const User = db.define('User', {
  email: DataTypes.STRING
}, { tableName: 'users', timestamps: false });

const Work = db.define('Work', {
  userId: DataTypes.INTEGER,
  fingerprint: DataTypes.STRING
}, { tableName: 'works', timestamps: false });

const Infringement = db.define('Infringement', {
  workId: DataTypes.INTEGER,
  infringingUrl: DataTypes.TEXT,
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  demandedPrice: DataTypes.DECIMAL
}, { tableName: 'infringements', timestamps: false });

function verifyToken(tk) {
  try {
    return jwt.verify(tk, JWT_SECRET || 'KaiKaiShieldSecret');
  } catch (e) {
    return null;
  }
}

/**
 * [POST] /api/infr/foundInfringement
 * 爬蟲偵測 => 記錄 status='detected' -> 寄信提醒
 */
router.post('/foundInfringement', async (req, res) => {
  const { workId, infringingUrl } = req.body;
  if (!workId || !infringingUrl) {
    return res.status(400).json({ error: '缺少 workId 或 infringingUrl' });
  }

  let w = await Work.findByPk(workId);
  if (!w) return res.status(404).json({ error: '無此作品' });

  // 新增或更新 Infringement
  let inf = await Infringement.findOne({ where: { workId, infringingUrl } });
  if (!inf) {
    inf = await Infringement.create({
      workId,
      infringingUrl,
      status: 'detected'
    });
  } else {
    inf.status = 'detected';
    await inf.save();
  }

  // 寄信給作品作者
  try {
    let author = await User.findByPk(w.userId);
    if (author) {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: author.email,
        subject: '[速誅侵權] 偵測到疑似侵權',
        text: `系統偵測到 ${infringingUrl} 可能侵害了您的作品（ID=${workId}）。請至後台確認。`
      });
    }
  } catch (e) {
    console.error('通知用戶失敗:', e.message);
  }

  res.json({ message: '已標記為 detected，等待用戶確認', inf });
});

/**
 * [GET] /api/infr/list
 * 用戶查看所有屬於自己的侵權紀錄
 */
router.get('/list', async (req, res) => {
  let tk = req.headers.authorization?.replace('Bearer ', '');
  if (!tk) return res.status(401).json({ error: '未登入' });
  let dec = verifyToken(tk);
  if (!dec) return res.status(401).json({ error: 'token無效' });

  // 找該user全部作品
  let works = await Work.findAll({ where: { userId: dec.userId } });
  let wids = works.map(w => w.id);

  let infs = [];
  if (wids.length > 0) {
    infs = await Infringement.findAll({
      where: { workId: wids }
    });
  }

  res.json(infs);
});

/**
 * [POST] /api/infr/dmca
 * 用戶決定要對該筆侵權提交 DMCA
 */
router.post('/dmca', async (req, res) => {
  let tk = req.headers.authorization?.replace('Bearer ', '');
  if (!tk) return res.status(401).json({ error: '未登入' });
  let dec = verifyToken(tk);
  if (!dec) return res.status(401).json({ error: 'token無效' });

  let { workId, infringingUrl } = req.body;
  if (!workId || !infringingUrl) {
    return res.status(400).json({ error: '缺參數: workId / infringingUrl' });
  }

  // 檢查該work屬於此用戶
  let w = await Work.findByPk(workId);
  if (!w || w.userId !== dec.userId) {
    return res.status(403).json({ error: '無權操作此作品' });
  }

  let inf = await Infringement.findOne({ where: { workId, infringingUrl } });
  if (!inf) {
    inf = await Infringement.create({ workId, infringingUrl, status: 'dmca' });
  } else {
    inf.status = 'dmca';
    await inf.save();
  }

  if (DMCA_AUTO_NOTIFY === 'true') {
    // (可選)寄信到 DMCA 專用信箱
    try {
      let author = await User.findByPk(w.userId);
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: 'dmca@some-platform.com',
        subject: `DMCA Notice - WorkID=${workId}`,
        text: `侵權URL: ${infringingUrl}\n作者: ${author ? author.email : '未知'}`
      });
    } catch (err) {
      console.error('DMCA通報失敗:', err.message);
    }
  }

  res.json({ message: '已送出DMCA通知', infId: inf.id });
});

/**
 * [POST] /api/infr/legalize
 * 標記該筆侵權為合法
 */
router.post('/legalize', async (req, res) => {
  let tk = req.headers.authorization?.replace('Bearer ', '');
  if (!tk) return res.status(401).json({ error: '未登入' });
  let dec = verifyToken(tk);
  if (!dec) return res.status(401).json({ error: 'token無效' });

  let { infId } = req.body;
  if (!infId) return res.status(400).json({ error: '缺 infId' });

  let inf = await Infringement.findByPk(infId);
  if (!inf) return res.status(404).json({ error: '找不到此紀錄' });

  let w = await Work.findByPk(inf.workId);
  if (!w || w.userId !== dec.userId) {
    return res.status(403).json({ error: '無權操作此紀錄' });
  }

  inf.status = 'legalized';
  await inf.save();
  res.json({ message: '已標記為合法', infId: inf.id });
});

/**
 * [POST] /api/infr/licenseFee
 * 要求授權費
 */
router.post('/licenseFee', async (req, res) => {
  let tk = req.headers.authorization?.replace('Bearer ', '');
  if (!tk) return res.status(401).json({ error: '未登入' });
  let dec = verifyToken(tk);
  if (!dec) return res.status(401).json({ error: 'token無效' });

  let { infId, demandedPrice } = req.body;
  if (!infId || !demandedPrice) {
    return res.status(400).json({ error: '缺 infId 或 demandedPrice' });
  }

  let inf = await Infringement.findByPk(infId);
  if (!inf) return res.status(404).json({ error: '紀錄不存在' });

  let w = await Work.findByPk(inf.workId);
  if (!w || w.userId !== dec.userId) {
    return res.status(403).json({ error: '無權操作此紀錄' });
  }

  inf.status = 'licensingFeeRequested';
  inf.demandedPrice = demandedPrice;
  await inf.save();
  res.json({ message: '已要求授權費', infId: inf.id });
});

/**
 * [POST] /api/infr/lawsuit
 * 提告
 */
router.post('/lawsuit', async (req, res) => {
  let tk = req.headers.authorization?.replace('Bearer ', '');
  if (!tk) return res.status(401).json({ error: '未登入' });
  let dec = verifyToken(tk);
  if (!dec) return res.status(401).json({ error: 'token無效' });

  let { infId } = req.body;
  if (!infId) return res.status(400).json({ error: '缺 infId' });

  let inf = await Infringement.findByPk(infId);
  if (!inf) return res.status(404).json({ error: '無此紀錄' });

  let w = await Work.findByPk(inf.workId);
  if (!w || w.userId !== dec.userId) {
    return res.status(403).json({ error: '無權操作此紀錄' });
  }

  inf.status = 'lawsuit';
  await inf.save();

  // (可選)寄信給法務
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: 'lawyer@kaishield.com',
      subject: `提告 - infId=${infId}`,
      text: `用戶 ${dec.userId} 已對侵權 ${inf.infringingUrl} 提告`
    });
  } catch (err) {
    console.error('寄給律師失敗:', err.message);
  }

  res.json({ message: '已提交提告', infId });
});

module.exports = router;
