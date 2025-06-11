/*************************************************************
 * express/routes/authRoutes.js
 * 
 * - /auth/login
 * - /auth/register
 *************************************************************/
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET || 'SomeSuperSecretKey';

/**
 * POST /auth/login
 *  - 若 identifier 含 '@' => 視為 email；否則視為 phone
 */
router.post('/login', async (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.account;
    const { password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: '請輸入帳號與密碼' });
    }

    let whereClause;
    if (identifier.includes('@')) {
      whereClause = { email: identifier.toLowerCase() };
    } else {
      // phone => 清除非數字/+號
      const phoneClean = identifier.replace(/[^\d+]/g, '');
      whereClause = { phone: phoneClean };
    }

    const user = await User.findOne({ where: whereClause });
    if (!user) {
      return res.status(401).json({ message: '帳號不存在' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: '密碼錯誤' });
    }

    // 簽發 JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    return res.json({
      message: '登入成功',
      token,
      user: {
        id: user.id,
        phone: user.phone,
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

/**
 * POST /auth/register
 *  - 以 phone + email 建立帳號
 */
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      phone,
      password,
      confirmPassword,
      IG, FB, YouTube, TikTok,
      Shopee, Ruten, Yahoo, Amazon, Taobao, eBay
    } = req.body;

    if (!email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: '必填欄位未填 (email, phone, password)' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: '兩次密碼不一致' });
    }

    // 檢查 email/phone 是否已註冊
    const existed = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          { phone }
        ]
      }
    });
    if (existed) {
      return res.status(409).json({ message: 'Email或手機已被註冊' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const serialNumber = 'SN-' + Date.now();

    const newUser = await User.create({
      serialNumber,
      email: email.toLowerCase(),
      phone,
      password: hashed,
      IG, FB, YouTube, TikTok,
      Shopee, Ruten, Yahoo, Amazon, Taobao, eBay
    });

    return res.json({ message: '註冊成功', userId: newUser.id });
  } catch (err) {
    console.error('[Register Error]', err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
