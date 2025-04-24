const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET || 'SomeSuperSecretKey';

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: '請輸入帳號與密碼' });
    }

    let whereClause;
    if (identifier.includes('@')) {
      whereClause = { email: identifier.toLowerCase() };
    } else {
      whereClause = { username: identifier };
    }

    const user = await User.findOne({ where: whereClause });
    if (!user) {
      return res.status(401).json({ message: '帳號不存在' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: '密碼錯誤' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: '登入成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        plan: user.plan
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const {
      email, username, password, confirmPassword,
      IG, FB, YouTube, TikTok,
      Shopee, Ruten, Yahoo, Amazon, Taobao, eBay
    } = req.body;

    if (!email || !username || !password || !confirmPassword) {
      return res.status(400).json({ message: '必填欄位未填' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: '兩次密碼不一致' });
    }

    const exist = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          { username }
        ]
      }
    });
    if (exist) {
      return res.status(409).json({ message: 'Email或手機已註冊過' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const serialNumber = 'SN' + Date.now();

    const newUser = await User.create({
      serialNumber,
      email: email.toLowerCase(),
      username,
      password: hashed,
      IG, FB, YouTube, TikTok,
      Shopee, Ruten, Yahoo, Amazon, Taobao, eBay
    });

    res.json({ message: '註冊成功', userId: newUser.id });
  } catch (err) {
    console.error('[Register Error]', err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
