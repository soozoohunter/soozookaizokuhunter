/*************************************************************
 * express/routes/admin.js
 * 
 * 管理員相關路由：
 *  - /admin/login
 *  - /admin/users
 *  - /admin/files
 *************************************************************/
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, File } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'SomeSuperSecretKey';

// Middleware：檢查 JWT & role=admin
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'You are not admin' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * POST /admin/login
 * - 以 phone (或 email) 當帳號
 */
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: '缺少帳號或密碼' });
    }

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(401).json({ error: '無此帳號' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: '密碼錯誤' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: '非管理員無法登入' });
    }

    const token = jwt.sign({ userId: user.id, role: 'admin' }, JWT_SECRET, {
      expiresIn: '1d'
    });

    return res.json({ message: 'Admin登入成功', token });
  } catch (err) {
    console.error('[AdminLogin Error]', err);
    return res.status(500).json({ error: '登入過程發生錯誤' });
  }
});

/**
 * GET /admin/users
 */
router.get('/users', requireAdmin, async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

/**
 * GET /admin/files
 */
router.get('/files', requireAdmin, async (req, res) => {
  const files = await File.findAll();
  res.json(files);
});

module.exports = router;
